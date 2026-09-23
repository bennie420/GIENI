import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchRealWebhook,
  LEGAL_DISCLAIMER,
  ProbateOpportunityFileSchema,
} from '../../packages/delivery/dist/index.js';

test('Delivery: requires mandatory legal disclaimer notice', () => {
  const validPOF = {
    id: 'pof_001',
    organizationId: 'org_gieni_ops',
    countyId: 'county_travis_tx',
    caseNumber: 'PR-2026-08912',
    decedentName: 'Arthur Jenkins',
    filingDate: '2026-03-01T00:00:00.000Z',
    property: {
      apn: '02-4412-009',
      addressText: '742 Evergreen Terrace, Austin, TX 78701',
      assessedValue: 620000,
      estimatedEquity: 570000,
      recordsLocated: true,
    },
    ownership: {
      status: 'DECEDENT_SOLE_OWNER',
      verifiedOwners: ['Arthur Jenkins'],
    },
    authority: {
      status: 'CONFIRMED',
      tier: 1,
      fiduciaryName: 'Sarah Jenkins',
      fiduciaryRole: 'EXECUTOR',
      lettersIssued: true,
    },
    scoring: {
      compositeScore: 95,
      priorityBand: 'PRIORITY_A',
      ruleVersion: 'v1.0.0-deterministic',
    },
    evidence: [
      {
        claimPath: 'authority.fiduciary',
        factSummary: 'Letters Testamentary issued to Sarah Jenkins',
        sourceDocumentName: 'Letters_Testamentary.pdf',
        pageNumber: 1,
        excerpt: 'Sarah Jenkins is hereby appointed Executor',
        artifactSha256: 'a'.repeat(64),
      },
    ],
    recommendedAction: 'Contact Executor to present acquisition terms',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const parsed = ProbateOpportunityFileSchema.parse(validPOF);
  assert.equal(parsed.disclaimer, 'research finding—not legal opinion or title guarantee');
});

test('Delivery: authentic webhook dispatcher fails honestly on unreachable endpoint (Zero Fake Delivery)', async () => {
  const validPOF = {
    id: 'pof_001',
    organizationId: 'org_gieni_ops',
    countyId: 'county_travis_tx',
    caseNumber: 'PR-2026-08912',
    decedentName: 'Arthur Jenkins',
    filingDate: '2026-03-01T00:00:00.000Z',
    property: {
      apn: '02-4412-009',
      addressText: '742 Evergreen Terrace, Austin, TX 78701',
      assessedValue: 620000,
      estimatedEquity: 570000,
      recordsLocated: true,
    },
    ownership: {
      status: 'DECEDENT_SOLE_OWNER',
      verifiedOwners: ['Arthur Jenkins'],
    },
    authority: {
      status: 'CONFIRMED',
      tier: 1,
      fiduciaryName: 'Sarah Jenkins',
      fiduciaryRole: 'EXECUTOR',
      lettersIssued: true,
    },
    scoring: {
      compositeScore: 95,
      priorityBand: 'PRIORITY_A',
      ruleVersion: 'v1.0.0-deterministic',
    },
    evidence: [
      {
        claimPath: 'authority.fiduciary',
        factSummary: 'Letters Testamentary issued to Sarah Jenkins',
        sourceDocumentName: 'Letters_Testamentary.pdf',
        pageNumber: 1,
        excerpt: 'Sarah Jenkins is hereby appointed Executor',
        artifactSha256: 'a'.repeat(64),
      },
    ],
    recommendedAction: 'Contact Executor to present acquisition terms',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  // Attempt dispatch to an un-bound local port
  const result = await dispatchRealWebhook({
    dispatchId: 'disp_test_fail',
    targetWebhookUrl: 'http://127.0.0.1:59199/unreachable-endpoint',
    payload: validPOF,
    timeoutMs: 1000,
  });

  // MUST be FAILED, NEVER fake SUCCESS
  assert.equal(result.status, 'FAILED');
  assert.equal(result.acknowledgedAt, null);
  assert.ok(result.errorMessage?.includes('Real network transmission failed'));
});
