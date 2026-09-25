import fs from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createCoefficientProposal,
  promoteCoefficientProposal,
  rollbackCoefficientVersion,
  CoefficientWeightsSchema,
} from '../../packages/scoring/dist/index.js';
import { computeQueueHealth } from '../../packages/qc/dist/index.js';
import {
  getEntityClassification,
  DataClassificationTierSchema,
  ENTITY_CLASSIFICATION_MAP,
} from '../../packages/authz/dist/index.js';

test('Coefficient Proposal Engine: Enforces human certification and weight sum invariants', () => {
  // 1. Valid weights sum to 1.0
  const validWeights = {
    authorityWeight: 0.35,
    ownershipWeight: 0.25,
    equityWeight: 0.25,
    freshnessWeight: 0.15,
  };
  assert.doesNotThrow(() => CoefficientWeightsSchema.parse(validWeights));

  // 2. Invalid weights not summing to 1.0 are rejected
  const invalidWeights = {
    authorityWeight: 0.5,
    ownershipWeight: 0.5,
    equityWeight: 0.25,
    freshnessWeight: 0.15,
  };
  assert.throws(() => CoefficientWeightsSchema.parse(invalidWeights));

  // 3. Propose new weights
  const proposal = createCoefficientProposal({
    organizationId: 'org_gieni_internal',
    sourceVersion: '2026.1-probate-score',
    proposedVersion: '2026.2-adaptive-score',
    proposedWeights: {
      authorityWeight: 0.4,
      ownershipWeight: 0.2,
      equityWeight: 0.25,
      freshnessWeight: 0.15,
    },
    rationale: 'Observed higher close rate when authority certainty is elevated',
    proposedBy: 'adaptive_learning_subsystem',
  });

  assert.equal(proposal.status, 'PENDING_CERTIFICATION');

  // 4. Autonomous promotion without certifier ID is strictly prohibited
  assert.throws(
    () => promoteCoefficientProposal(proposal, '', 'Attempting unauthenticated promotion'),
    /Human certifier ID is mandatory/
  );

  // 5. Human operator certification successfully promotes version
  const { promotedVersion, updatedProposal } = promoteCoefficientProposal(
    proposal,
    'operator_lead_42',
    'Validated against Q1 pilot results'
  );

  assert.equal(updatedProposal.status, 'PROMOTED');
  assert.equal(promotedVersion.status, 'ACTIVE');
  assert.equal(promotedVersion.version, '2026.2-adaptive-score');
  assert.equal(promotedVersion.certifiedBy, 'operator_lead_42');

  // 6. Rollback to previous version
  const previousVersion = {
    id: 'cver_2026_1',
    version: '2026.1-probate-score',
    organizationId: 'org_gieni_internal',
    weights: validWeights,
    status: 'SUPERSEDED',
    authorId: 'system',
    rationale: 'Initial launch weights',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const { supersededVersion, restoredActive } = rollbackCoefficientVersion(
    promotedVersion,
    previousVersion,
    'operator_lead_42',
    'Rollback test verification'
  );

  assert.equal(supersededVersion.status, 'ROLLED_BACK');
  assert.equal(restoredActive.status, 'ACTIVE');
  assert.equal(restoredActive.version, '2026.1-probate-score');
});

test('Queue Health Metrics: Evaluates queue backlog depth, latency, and SLA breach thresholds', () => {
  const now = Date.now();
  const activeExceptions = [
    {
      id: 'exc_001',
      organizationId: 'org_gieni_internal',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_001',
      type: 'HIGH_VALUE_AMBIGUITY',
      status: 'PENDING_REVIEW',
      priority: 'EXPEDITE_SENIOR_REVIEW',
      description: 'Expedite senior review required',
      createdAt: new Date(now - 30 * 3600 * 1000).toISOString(), // 30 hours old -> SLA breached (>24h)
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    {
      id: 'exc_002',
      organizationId: 'org_gieni_internal',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_002',
      type: 'TITLE_CONFLICT',
      status: 'PENDING_REVIEW',
      priority: 'STANDARD',
      description: 'Standard review',
      createdAt: new Date(now - 2 * 3600 * 1000).toISOString(), // 2 hours old
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
  ];

  const health = computeQueueHealth({
    countyId: 'county_travis_tx',
    organizationId: 'org_gieni_internal',
    activeExceptions,
    slaThresholdHours: 24,
  });

  assert.equal(health.totalPendingExceptions, 2);
  assert.equal(health.expeditedSeniorCount, 1);
  assert.equal(health.standardCount, 1);
  assert.equal(health.breachedSlaCount, 1);
  assert.equal(health.healthStatus, 'DEGRADED');
  assert.ok(health.alerts.length > 0);
});

test('Data Classification: Maps domain entities to required regulatory and privacy tiers', () => {
  // Verify classification schema
  assert.doesNotThrow(() => DataClassificationTierSchema.parse('PUBLIC_RECORD'));
  assert.doesNotThrow(() => DataClassificationTierSchema.parse('BUSINESS'));
  assert.doesNotThrow(() => DataClassificationTierSchema.parse('CONFIDENTIAL'));
  assert.doesNotThrow(() => DataClassificationTierSchema.parse('PII'));
  assert.doesNotThrow(() => DataClassificationTierSchema.parse('REGULATED'));

  // Verify entity mappings
  assert.equal(getEntityClassification('PropertyParcel'), 'PUBLIC_RECORD');
  assert.equal(getEntityClassification('CourtRecord'), 'PUBLIC_RECORD');
  assert.equal(getEntityClassification('PersonRecord'), 'CONFIDENTIAL');
  assert.equal(getEntityClassification('FiduciaryContactPhone'), 'PII');
  assert.equal(getEntityClassification('FiduciaryContactEmail'), 'REGULATED');
  assert.equal(getEntityClassification('ClientFeedback'), 'BUSINESS');
});

test('CodeScene Configuration: Architecture component manifest enforces boundary rules', () => {
  const raw = fs.readFileSync('.codescene/architecture.json', 'utf-8');
  const config = JSON.parse(raw);

  assert.equal(config.system, 'Gieni OS Monorepo');
  assert.ok(config.components.length >= 10);
  assert.ok(config.rules.length >= 3);

  const evidenceRule = config.rules.find((r) => r.source.includes('evidence'));
  assert.ok(evidenceRule);
  assert.ok(evidenceRule.forbiddenDependencies.some((d) => d.includes('delivery')));
});
