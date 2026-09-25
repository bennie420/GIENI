import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { 
  LicenseService, 
  InMemoryLicenseRepository, 
  defaultKeyRotationRegistry 
} from '../../packages/authz/dist/index.js';

import { 
  computeAuditEventHash, 
  verifyAuditChain, 
  createSensitiveReadAuditEvent, 
  ClaimVerificationPolicy 
} from '../../packages/evidence/dist/index.js';

import { 
  WebhookReplayRegistry 
} from '../../packages/delivery/dist/index.js';

import { 
  DEFAULT_RETENTION_POLICIES, 
  evaluateRetentionSchedule, 
  isRecordPastRetention 
} from '../../packages/database/dist/index.js';

import { 
  INCIDENT_RESPONSE_PLAYBOOKS, 
  getPlaybookForIncident, 
  IncidentAlertDispatcher 
} from '../../packages/resilience/dist/index.js';

import { 
  buildCountyHealthTelemetry 
} from '../../packages/qc/dist/index.js';

import { 
  toSentryContext, 
  createCorrelationContext 
} from '../../packages/workflow/dist/index.js';

test('SH-001: Dynamic County Licensing enforces permissions and immediate revocation', async () => {
  const repo = new InMemoryLicenseRepository();
  const service = new LicenseService(repo);

  // Default seeded licensed counties
  const initialCounties = await service.getLicensedCountiesForOrg('client_austin_capital_partners');
  assert.deepEqual(initialCounties, ['county_travis_tx']);

  // Assert access
  await assert.doesNotReject(() =>
    service.assertCountyAccess({
      organizationId: 'client_austin_capital_partners',
      countyId: 'county_travis_tx',
      role: 'org:client_user',
    })
  );

  // Unlicensed county rejected
  await assert.rejects(
    () =>
      service.assertCountyAccess({
        organizationId: 'client_austin_capital_partners',
        countyId: 'county_dallas_tx',
        role: 'org:client_user',
      }),
    /lacks dynamic license/
  );

  // Grant county dynamically
  await service.grantCounty('client_austin_capital_partners', 'county_dallas_tx');
  const updatedCounties = await service.getLicensedCountiesForOrg('client_austin_capital_partners');
  assert.ok(updatedCounties.includes('county_dallas_tx'));

  // Revoke organization license -> immediate block
  await service.revokeLicense('client_austin_capital_partners');
  await assert.rejects(
    () => service.getLicensedCountiesForOrg('client_austin_capital_partners'),
    /REVOKED/
  );
});

test('SH-003: Webhook Replay Registry rejects duplicate nonces and signature reuse', () => {
  const registry = new WebhookReplayRegistry(300);
  const now = Math.floor(Date.now() / 1000).toString();
  const payload = JSON.stringify({ event: 'DELIVERY_DISPATCHED', caseId: 'case_101' });
  const signature = 'sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

  // First registration succeeds
  const reg1 = registry.register({
    nonce: 'nonce_unique_001',
    signature,
    payload,
    timestamp: now,
  });
  assert.equal(reg1.allowed, true);

  // Duplicate nonce rejected
  const reg2 = registry.register({
    nonce: 'nonce_unique_001',
    signature: 'sha256=different_sig_123',
    payload,
    timestamp: now,
  });
  assert.equal(reg2.allowed, false);
  assert.match(reg2.error || '', /Duplicate nonce/);

  // Signature reuse rejected
  const reg3 = registry.register({
    nonce: 'nonce_unique_002',
    signature,
    payload,
    timestamp: now,
  });
  assert.equal(reg3.allowed, false);
  assert.match(reg3.error || '', /Signature reuse/);

  // Expired timestamp outside tolerance rejected
  const expiredTs = (parseInt(now, 10) - 400).toString();
  const reg4 = registry.register({
    nonce: 'nonce_unique_003',
    signature: 'sha256=sig_expired_001',
    payload,
    timestamp: expiredTs,
  });
  assert.equal(reg4.allowed, false);
  assert.match(reg4.error || '', /tolerance window/);
});

test('SH-004: Read Audit Logging tracks sensitive access events', () => {
  const readEvent = createSensitiveReadAuditEvent({
    organizationId: 'org_test',
    clientId: 'client_test',
    countyId: 'county_travis_tx',
    actorId: 'user_researcher_01',
    actorRole: 'org:researcher',
    eventType: 'RECORD_VIEWED',
    dataClassification: 'PII',
    resourceType: 'HEIR_CONTACT_RECORD',
    resourceId: 'heir_9921',
    fieldsAccessed: ['phoneNumber', 'mailingAddress', 'email'],
    ipAddress: '192.168.1.50',
  });

  assert.equal(readEvent.dataClassification, 'PII');
  assert.equal(readEvent.eventType, 'RECORD_VIEWED');
  assert.deepEqual(readEvent.fieldsAccessed, ['phoneNumber', 'mailingAddress', 'email']);
  assert.ok(readEvent.id.startsWith('read_audit_'));
});

test('EI-001: Immutable Audit Chain detects retrospective tampering', () => {
  const baseEvent1 = {
    id: 'audit_1',
    organizationId: 'org_test',
    countyId: 'county_travis_tx',
    claimId: 'claim_1',
    eventType: 'CREATED',
    previousStatus: undefined,
    newStatus: 'PROPOSED',
    actorId: 'system_gemini_ocr',
    schemaVersion: 1,
    createdAt: '2026-09-24T10:00:00.000Z',
    updatedAt: '2026-09-24T10:00:00.000Z',
    previousAuditHash: null,
  };
  const hash1 = computeAuditEventHash(baseEvent1, null);
  const event1 = { ...baseEvent1, auditHash: hash1 };

  const baseEvent2 = {
    id: 'audit_2',
    organizationId: 'org_test',
    countyId: 'county_travis_tx',
    claimId: 'claim_1',
    eventType: 'VERIFIED',
    previousStatus: 'PROPOSED',
    newStatus: 'VERIFIED',
    actorId: 'operator_lead_01',
    rationale: 'Satisfied ClaimVerificationPolicy',
    schemaVersion: 1,
    createdAt: '2026-09-24T11:00:00.000Z',
    updatedAt: '2026-09-24T11:00:00.000Z',
    previousAuditHash: hash1,
  };
  const hash2 = computeAuditEventHash(baseEvent2, hash1);
  const event2 = { ...baseEvent2, auditHash: hash2 };

  // Valid chain verification
  const verificationResult = verifyAuditChain([event1, event2]);
  assert.equal(verificationResult.valid, true);

  // Tampering detection: simulate illicit modification of event1's actorId
  const tamperedEvent1 = { ...event1, actorId: 'hacker_injected' };
  const tamperedResult = verifyAuditChain([tamperedEvent1, event2]);
  assert.equal(tamperedResult.valid, false);
  assert.equal(tamperedResult.brokenIndex, 0);
  assert.match(tamperedResult.reason || '', /mismatch/);
});

test('EI-002: Claim Verification Policy strictly validates evidence and authorized roles', () => {
  const legitimateClaim = {
    id: 'claim_legit_001',
    organizationId: 'org_test',
    countyId: 'county_travis_tx',
    subjectType: 'AUTHORITY',
    subjectId: 'case_travis_001',
    fieldPath: 'authority.fiduciary',
    proposedValue: { fiduciaryName: 'Sarah Louise Jenkins' },
    claimType: 'EXTRACTED',
    confidence: 0.98,
    verificationStatus: 'PROPOSED',
    evidence: [
      {
        id: 'ev_1',
        claimId: 'claim_legit_001',
        sourceDocumentId: 'doc_1',
        pageNumber: 1,
        excerpt: 'LETTERS TESTAMENTARY granted unto SARAH LOUISE JENKINS',
        sourceLocator: 'Page 1, Paragraph 2',
        artifactSha256: 'a5dee72a371498301b67a870d4c7d37f9c947974f215b3ef9b639197b0726c07',
        createdAt: new Date().toISOString(),
      },
    ],
    createdBy: 'gemini_ocr_pipeline',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  // 1. Authorized operator verification succeeds
  const legitResult = ClaimVerificationPolicy.evaluate(legitimateClaim, {
    actorId: 'qc_lead_01',
    actorRole: 'org:operator_admin',
  });
  assert.equal(legitResult.allowed, true);
  assert.equal(legitResult.violations.length, 0);

  // 2. Unauthorized role rejected
  const unauthorizedRole = ClaimVerificationPolicy.evaluate(legitimateClaim, {
    actorId: 'client_user_01',
    actorRole: 'org:client_user',
  });
  assert.equal(unauthorizedRole.allowed, false);
  assert.match(unauthorizedRole.violations[0], /not authorized/);

  // 3. Unresolved blocking exception rejects verification
  const exceptionBlocked = ClaimVerificationPolicy.evaluate(legitimateClaim, {
    actorId: 'qc_lead_01',
    actorRole: 'org:operator_admin',
    knownExceptions: [
      {
        id: 'exc_001',
        status: 'PENDING_REVIEW',
        subjectId: 'case_travis_001',
        type: 'TITLE_CONFLICT',
      },
    ],
  });
  assert.equal(exceptionBlocked.allowed, false);
  assert.match(exceptionBlocked.violations[0], /unresolved investigation exception/);
});

test('CO-001: Data Retention Engine enforces 7-year audit retention and 90-day log cutoffs', () => {
  const auditPolicy = DEFAULT_RETENTION_POLICIES.AUDIT_EVENTS;
  assert.equal(auditPolicy.retentionDays, 2555); // 7 years

  const logPolicy = DEFAULT_RETENTION_POLICIES.OPERATIONAL_LOGS;
  assert.equal(logPolicy.retentionDays, 90);

  const now = new Date('2026-09-24T12:00:00.000Z');

  // Event from 100 days ago is past 90-day retention
  const oldLogDate = new Date(now.getTime() - 100 * 86400000).toISOString();
  assert.equal(isRecordPastRetention(oldLogDate, logPolicy, now), true);

  // Event from 100 days ago is NOT past 7-year audit retention
  assert.equal(isRecordPastRetention(oldLogDate, auditPolicy, now), false);

  // Schedule purge simulation
  const mockLogs = [
    { id: 'log_1', timestamp: oldLogDate },
    { id: 'log_2', timestamp: new Date(now.getTime() - 10 * 86400000).toISOString() },
  ];
  const purgeResult = evaluateRetentionSchedule(mockLogs, logPolicy, { now, dryRun: true });
  assert.equal(purgeResult.eligibleCount, 1);
});

test('CO-002: Key Rotation Registry enforces active, rotated grace periods, and expiration', () => {
  const registry = defaultKeyRotationRegistry;

  const createdKey = registry.registerKey({
    keyId: 'atlas_creds_prod_01',
    keyType: 'MONGODB_ATLAS_CREDENTIAL',
    owner: 'devops_lead',
    environment: 'production',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    rotationGracePeriodHours: 48,
    keyFingerprint: 'a1b2c3d4e5f6g7h8',
  });

  assert.equal(createdKey.status, 'ACTIVE');

  // Valid key assertion passes
  assert.doesNotThrow(() => registry.assertKeyValid('atlas_creds_prod_01'));

  // Rotate key with grace period
  const { oldKey, newKey } = registry.rotateKey('atlas_creds_prod_01', {
    keyId: 'atlas_creds_prod_02',
    keyType: 'MONGODB_ATLAS_CREDENTIAL',
    owner: 'devops_lead',
    environment: 'production',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    rotationGracePeriodHours: 48,
    keyFingerprint: 'f8e7d6c5b4a39281',
  });

  assert.equal(oldKey.status, 'ROTATED');
  assert.equal(newKey.status, 'ACTIVE');

  // During grace period, rotated key still validates
  assert.doesNotThrow(() => registry.assertKeyValid('atlas_creds_prod_01'));

  // Revocation immediately blocks access
  registry.revokeKey('atlas_creds_prod_01');
  assert.throws(() => registry.assertKeyValid('atlas_creds_prod_01'), /REVOKED/);
});

test('CO-003 & OP-002: Security Incident Taxonomy and Automated Alerting Dispatcher', async () => {
  const breachPlaybook = INCIDENT_RESPONSE_PLAYBOOKS.TENANT_BREACH_ATTEMPT;
  assert.equal(breachPlaybook.defaultSeverity, 'CRITICAL');
  assert.equal(breachPlaybook.quarantineRequired, true);

  const dispatcher = new IncidentAlertDispatcher();
  const alertResult = await dispatcher.dispatch({
    alertId: 'alert_test_01',
    source: 'packages/authz/tenant.ts',
    severity: 'CRITICAL',
    alertType: 'TENANT_ISOLATION_VIOLATION',
    countyId: 'county_travis_tx',
    organizationId: 'offender_org_x',
    summary: 'Cross-tenant query rejected at TenantScopedRepository boundary',
    details: { attemptedOrg: 'victim_org_y' },
    timestamp: new Date().toISOString(),
  });

  assert.equal(alertResult.dispatched, true);
  const recordedAlerts = dispatcher.getDispatchedAlerts();
  assert.equal(recordedAlerts.length, 1);
  assert.equal(recordedAlerts[0].alertType, 'TENANT_ISOLATION_VIOLATION');
});

test('OP-003: County Health Telemetry aggregates status, throughput, exceptions, and delivery SLA', () => {
  const telemetry = buildCountyHealthTelemetry({
    countyId: 'county_travis_tx',
    countyName: 'Travis County',
    circuitState: 'CLOSED',
    queueHealth: {
      countyId: 'county_travis_tx',
      organizationId: 'org_test',
      totalPendingExceptions: 2,
      expeditedSeniorCount: 1,
      standardCount: 1,
      oldestPendingHours: 4.5,
      averageResolutionMinutes: 35,
      breachedSlaCount: 0,
      healthStatus: 'HEALTHY',
      alerts: [],
      evaluatedAt: new Date().toISOString(),
    },
    activeCaseCount: 14,
    openExceptions: 2,
    highValueExceptions: 1,
    resolvedExceptions: 8,
    publishedToday: 6,
    successfulDeliveries: 6,
    failedDeliveries: 0,
  });

  assert.equal(telemetry.operationalStatus, 'HEALTHY');
  assert.equal(telemetry.circuitState, 'CLOSED');
  assert.equal(telemetry.deliveryMetrics.deliverySlaPercentage, 100);
  assert.equal(telemetry.exceptions.highValueCount, 1);
});

test('OP-001: Sentry Context mapping captures complete distributed tracing context', () => {
  const ctx = createCorrelationContext({
    caseId: 'case_2026_01',
    claimId: 'claim_fiduciary_99',
    opportunityId: 'opp_alpha_1',
    countyId: 'county_travis_tx',
    organizationId: 'org_gieni_internal',
  });

  const sentryContext = toSentryContext(ctx);
  assert.equal(sentryContext.name, 'probate_investigation');
  assert.equal(sentryContext.context.caseId, 'case_2026_01');
  assert.equal(sentryContext.context.claimId, 'claim_fiduciary_99');
  assert.ok(sentryContext.context.correlationId);
});
