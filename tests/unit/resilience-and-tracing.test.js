import crypto from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CircuitBreakerEngine,
  CircuitBreakerSchema,
  SystemicIncidentSchema,
  ParkedWorkSchema,
} from '../../packages/resilience/dist/index.js';
import {
  evaluateAmbiguityRouting,
  InvestigationExceptionSchema,
} from '../../packages/qc/dist/index.js';
import {
  createCorrelationContext,
  toSentryScopeTags,
  formatTracingPrefix,
  WorkflowRunSchema,
} from '../../packages/workflow/dist/index.js';

test('Circuit Breaker: State transitions from CLOSED to OPEN upon reaching failure threshold', () => {
  const engine = new CircuitBreakerEngine();
  const circuit = {
    id: 'cb_travis_scraper',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    serviceKey: 'travis_county_docket_scraper',
    state: 'CLOSED',
    failureCount: 0,
    successCount: 10,
    failureThreshold: 3,
    cooldownPeriodSeconds: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  assert.equal(engine.checkAvailability(circuit).allowed, true);

  // Failure 1: does not trip
  let res = engine.recordFailure(circuit, { message: 'Timeout 1' });
  assert.equal(res.tripped, false);
  assert.equal(circuit.state, 'CLOSED');
  assert.equal(circuit.failureCount, 1);

  // Failure 2: does not trip
  res = engine.recordFailure(circuit, { message: 'Timeout 2' });
  assert.equal(res.tripped, false);
  assert.equal(circuit.state, 'CLOSED');
  assert.equal(circuit.failureCount, 2);

  // Failure 3: reaches threshold -> trips to OPEN & records SystemicIncident
  res = engine.recordFailure(circuit, {
    message: 'Timeout 3 - remote court portal offline',
    incidentType: 'COUNTY_SCRAPER_FAILURE',
    severity: 'CRITICAL',
  });

  assert.equal(res.tripped, true);
  assert.equal(circuit.state, 'OPEN');
  assert.ok(res.incident);
  assert.equal(res.incident.countyId, 'county_travis_tx');
  assert.equal(res.incident.incidentType, 'COUNTY_SCRAPER_FAILURE');
  assert.doesNotThrow(() => SystemicIncidentSchema.parse(res.incident));

  // Immediate subsequent request must be blocked
  const check = engine.checkAvailability(circuit);
  assert.equal(check.allowed, false);
  assert.equal(check.state, 'OPEN');
});

test('Circuit Breaker: County-Level Fault Isolation guarantees independent failure domains', () => {
  const engine = new CircuitBreakerEngine();

  const travisCircuit = {
    id: 'cb_travis',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    serviceKey: 'docket_adapter',
    state: 'CLOSED',
    failureCount: 0,
    successCount: 0,
    failureThreshold: 2,
    cooldownPeriodSeconds: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const dallasCircuit = {
    id: 'cb_dallas',
    organizationId: 'org_gieni_internal',
    countyId: 'county_dallas_tx',
    serviceKey: 'docket_adapter',
    state: 'CLOSED',
    failureCount: 0,
    successCount: 5,
    failureThreshold: 2,
    cooldownPeriodSeconds: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  // Fail Travis County until it trips
  engine.recordFailure(travisCircuit, { message: 'Fail 1' });
  engine.recordFailure(travisCircuit, { message: 'Fail 2' });

  assert.equal(travisCircuit.state, 'OPEN');
  assert.equal(engine.checkAvailability(travisCircuit).allowed, false);

  // Dallas County remains healthy and CLOSED
  assert.equal(dallasCircuit.state, 'CLOSED');
  assert.equal(engine.checkAvailability(dallasCircuit).allowed, true);
});

test('Circuit Breaker: Parked work generates cryptographic replay signature and prevents replay attacks', () => {
  const engine = new CircuitBreakerEngine();
  const secret = 'sec_replay_key_0123456789abcdef';

  const circuit = {
    id: 'cb_parked_test',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    serviceKey: 'document_ai_parser',
    state: 'OPEN',
    failureCount: 5,
    successCount: 0,
    failureThreshold: 3,
    cooldownPeriodSeconds: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const parked = engine.parkWork(
    circuit,
    'PROPOSAL_EXTRACTION',
    { documentId: 'doc_123', opportunityId: 'opp_456' },
    secret,
    3600 // 1 hour TTL
  );

  assert.doesNotThrow(() => ParkedWorkSchema.parse(parked));
  assert.equal(parked.status, 'PARKED');
  assert.ok(parked.replayNonce.length >= 16);
  assert.ok(parked.replaySignature.length >= 64);

  // Valid replay passes
  const validCheck = engine.validateParkedWorkReplay(parked, secret);
  assert.equal(validCheck.valid, true);

  // Tampered payload fails
  const tamperedWork = {
    ...parked,
    payload: { documentId: 'doc_tampered_attack' },
  };
  const tamperedCheck = engine.validateParkedWorkReplay(tamperedWork, secret);
  assert.equal(tamperedCheck.valid, false);
  assert.match(tamperedCheck.reason, /Security Violation: Tampered replay signature/);

  // Expired replay token fails
  const expiredWork = {
    ...parked,
    replayExpiration: new Date(Date.now() - 1000).toISOString(),
  };
  const expiredCheck = engine.validateParkedWorkReplay(expiredWork, secret);
  assert.equal(expiredCheck.valid, false);
  assert.match(expiredCheck.reason, /expired/);
});

test('QC Soft-Gate Routing: High-Value Ambiguity routes priority to senior reviewer without halting pipeline', () => {
  // Case A: High-Value ($750k equity) -> EXPEDITE_SENIOR_REVIEW
  const highValue = evaluateAmbiguityRouting({
    opportunityId: 'opp_luxury_001',
    countyId: 'county_travis_tx',
    organizationId: 'org_gieni_internal',
    estimatedEquity: 750000,
    ambiguityDescription: 'Multiple handwritten codicils naming competing co-executors',
  });

  assert.equal(highValue.isHighValue, true);
  assert.equal(highValue.priority, 'EXPEDITE_SENIOR_REVIEW');
  assert.equal(highValue.isSoftGate, true);
  assert.equal(highValue.exceptionPayload.assignedTo, 'role:senior_qc_lead');

  // Verify Zod schema validation
  const fullHighValueException = {
    id: 'exc_high_001',
    ...highValue.exceptionPayload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.doesNotThrow(() => InvestigationExceptionSchema.parse(fullHighValueException));

  // Case B: Standard Value ($200k equity) -> STANDARD priority
  const standardValue = evaluateAmbiguityRouting({
    opportunityId: 'opp_modest_002',
    countyId: 'county_travis_tx',
    organizationId: 'org_gieni_internal',
    estimatedEquity: 200000,
    ambiguityDescription: 'Petitioner name typo in court caption',
  });

  assert.equal(standardValue.isHighValue, false);
  assert.equal(standardValue.priority, 'STANDARD');
  assert.equal(standardValue.isSoftGate, true);
});

test('Workflow Tracing: CorrelationContext propagates IDs and formats Sentry scope tags', () => {
  const ctx = createCorrelationContext({
    workflowRunId: 'run_stage9_001',
    caseId: 'case_travis_001',
    claimId: 'claim_fiduciary_001',
    opportunityId: 'opp_001',
    countyId: 'county_travis_tx',
    organizationId: 'org_gieni_internal',
  });

  assert.ok(ctx.correlationId.startsWith('corr_'));
  assert.equal(ctx.workflowRunId, 'run_stage9_001');

  // Verify Sentry tag formatting
  const sentryTags = toSentryScopeTags(ctx);
  assert.equal(sentryTags.correlationId, ctx.correlationId);
  assert.equal(sentryTags.workflowRunId, 'run_stage9_001');
  assert.equal(sentryTags.caseId, 'case_travis_001');
  assert.equal(sentryTags.claimId, 'claim_fiduciary_001');
  assert.equal(sentryTags.opportunityId, 'opp_001');

  // Verify logging prefix
  const prefix = formatTracingPrefix(ctx);
  assert.ok(prefix.includes(ctx.correlationId));
  assert.ok(prefix.includes('run=run_stage9_001'));

  // Verify WorkflowRunSchema with correlationId and caseId
  const runPayload = {
    id: 'run_test_001',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    correlationId: ctx.correlationId,
    caseId: 'case_travis_001',
    stage: 'AUTHORITY_ASSESSMENT',
    status: 'COMPLETED',
    idempotencyKey: 'idemp_test_corr',
    attemptCount: 1,
    maxAttempts: 3,
    inputRef: {},
    outputRef: { success: true },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  assert.doesNotThrow(() => WorkflowRunSchema.parse(runPayload));
});

test('QC: scanStalledHighValueReviews detects aging senior review exceptions', async () => {
  const { scanStalledHighValueReviews, generateOperatorMorningBriefing } = await import(
    '../../packages/qc/dist/index.js'
  );

  const mockExceptions = [
    {
      id: 'exc_stalled_1',
      organizationId: 'org_test',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_high_1',
      type: 'HIGH_VALUE_AMBIGUITY',
      status: 'PENDING_REVIEW',
      priority: 'EXPEDITE_SENIOR_REVIEW',
      isSoftGate: true,
      estimatedValue: 750000,
      description: 'Expedite Senior Review',
      assignedTo: 'role:senior_qc_lead',
      createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), // 30h ago
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    {
      id: 'exc_fresh_2',
      organizationId: 'org_test',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_high_2',
      type: 'HIGH_VALUE_AMBIGUITY',
      status: 'PENDING_REVIEW',
      priority: 'EXPEDITE_SENIOR_REVIEW',
      isSoftGate: true,
      estimatedValue: 600000,
      description: 'Expedite Senior Review',
      assignedTo: 'role:senior_qc_lead',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2h ago
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
  ];

  const alerts = scanStalledHighValueReviews({
    exceptions: mockExceptions,
    stalledThresholdHours: 24,
  });

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].exceptionId, 'exc_stalled_1');
  assert.equal(alerts[0].urgency, 'WARNING_STALLED_REVIEW');
  assert.ok(alerts[0].escalationMessage.includes('$750,000'));

  // Test Morning Briefing generation
  const briefing = generateOperatorMorningBriefing({
    organizationId: 'org_test',
    countyHealthReports: [
      {
        countyId: 'county_travis_tx',
        countyName: 'Travis County',
        stateCode: 'TX',
        casesHarvestedLast24h: 14,
        layoutDriftDetected: false,
        queueHealth: {
          countyId: 'county_travis_tx',
          organizationId: 'org_test',
          totalPendingExceptions: 1,
          expeditedSeniorCount: 1,
          standardCount: 0,
          oldestPendingHours: 30,
          averageResolutionMinutes: 45,
          breachedSlaCount: 1,
          healthStatus: 'DEGRADED',
          alerts: ['Oldest item breached 24h SLA'],
          evaluatedAt: new Date().toISOString(),
        },
      },
    ],
  });

  assert.equal(briefing.totalBreachedSlas, 1);
  assert.equal(briefing.overallSystemHealth, 'DEGRADED_OPERATIONS');
  assert.equal(briefing.countySummaries.length, 1);
});

