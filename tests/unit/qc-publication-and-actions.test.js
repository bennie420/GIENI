import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDeliveryEligibility,
  assertDeliveryEligibility,
  LEGAL_DISCLAIMER,
  WebhookRetryQueue,
  analyzeClientFeedbackDispositions,
} from '../../packages/delivery/dist/index.js';

test('Delivery Eligibility: Valid opportunity passes publication gate', () => {
  const pof = {
    id: 'pof_valid_01',
    organizationId: 'org_test',
    countyId: 'county_travis_tx',
    caseNumber: 'PR-2026-001',
    decedentName: 'Jane Doe',
    filingDate: new Date().toISOString(),
    property: {
      apn: 'APN-1234',
      addressText: '100 Main St, Austin TX',
      assessedValue: 500000,
      estimatedEquity: 425000,
      recordsLocated: true,
    },
    ownership: {
      status: 'DEED_RECORDED',
      verifiedOwners: ['Jane Doe'],
    },
    authority: {
      status: 'CONFIRMED',
      tier: 1,
      fiduciaryName: 'John Doe',
      fiduciaryRole: 'EXECUTOR',
      lettersIssued: true,
    },
    scoring: {
      compositeScore: 92,
      priorityBand: 'PRIORITY_A',
      ruleVersion: 'v1.0.0-deterministic',
    },
    evidence: [
      {
        claimPath: 'authority.fiduciary',
        factSummary: 'Letters Testamentary',
        sourceDocumentName: 'Letters.pdf',
        pageNumber: 1,
        excerpt: 'John Doe appointed Executor',
        artifactSha256: 'a'.repeat(64),
      },
    ],
    recommendedAction: 'Contact Executor directly',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const result = checkDeliveryEligibility({
    pof,
    unresolvedExceptionsCount: 0,
    qcCertified: true,
    unverifiedClaimsCount: 0,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.violations.length, 0);
  assert.doesNotThrow(() =>
    assertDeliveryEligibility({
      pof,
      unresolvedExceptionsCount: 0,
      qcCertified: true,
      unverifiedClaimsCount: 0,
    })
  );
});

test('Delivery Eligibility: Authority Tier 4 (Unappointed/Speculative) is strictly blocked from delivery', () => {
  const pof = {
    id: 'pof_tier4_invalid',
    organizationId: 'org_test',
    countyId: 'county_travis_tx',
    caseNumber: 'PR-2026-002',
    decedentName: 'Bob Smith',
    filingDate: new Date().toISOString(),
    property: {
      apn: 'APN-5678',
      addressText: '200 Oak St, Austin TX',
      assessedValue: 350000,
      estimatedEquity: 275000,
      recordsLocated: true,
    },
    ownership: {
      status: 'DEED_RECORDED',
      verifiedOwners: ['Bob Smith'],
    },
    authority: {
      status: 'UNLOCATED',
      tier: 4,
      fiduciaryName: null,
      fiduciaryRole: 'UNAPPOINTED',
      lettersIssued: false,
    },
    scoring: {
      compositeScore: 45,
      priorityBand: 'DISQUALIFIED',
      ruleVersion: 'v1.0.0-deterministic',
    },
    evidence: [],
    recommendedAction: 'Monitor case docket for fiduciary appointment',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const result = checkDeliveryEligibility({
    pof,
    unresolvedExceptionsCount: 0,
    qcCertified: true,
    unverifiedClaimsCount: 0,
  });

  assert.equal(result.eligible, false);
  assert.ok(result.violations.some((v) => v.includes('Authority Tier 4')));
  assert.throws(
    () =>
      assertDeliveryEligibility({
        pof,
        unresolvedExceptionsCount: 0,
        qcCertified: true,
        unverifiedClaimsCount: 0,
      }),
    /Authority Tier 4/
  );
});

test('Delivery Eligibility: Unverified/PROPOSED claims strictly block delivery', () => {
  const pof = {
    id: 'pof_unverified_claims',
    organizationId: 'org_test',
    countyId: 'county_travis_tx',
    caseNumber: 'PR-2026-003',
    decedentName: 'Alice Green',
    filingDate: new Date().toISOString(),
    property: {
      apn: 'APN-9999',
      addressText: '300 Elm St, Austin TX',
      assessedValue: 600000,
      estimatedEquity: 525000,
      recordsLocated: true,
    },
    ownership: {
      status: 'DEED_RECORDED',
      verifiedOwners: ['Alice Green'],
    },
    authority: {
      status: 'CONFIRMED',
      tier: 1,
      fiduciaryName: 'George Green',
      fiduciaryRole: 'EXECUTOR',
      lettersIssued: true,
    },
    scoring: {
      compositeScore: 88,
      priorityBand: 'PRIORITY_A',
      ruleVersion: 'v1.0.0-deterministic',
    },
    evidence: [],
    recommendedAction: 'Contact Executor',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const result = checkDeliveryEligibility({
    pof,
    unresolvedExceptionsCount: 0,
    qcCertified: true,
    unverifiedClaimsCount: 2,
  });

  assert.equal(result.eligible, false);
  assert.ok(result.violations.some((v) => v.includes('2 unverified / PROPOSED claim(s)')));
});

test('WebhookRetryQueue: processAllPending executes due retries and transitions items', async () => {
  const queue = new WebhookRetryQueue({
    maxAttempts: 3,
    initialDelayMs: 0, // Instant for testing
    backoffMultiplier: 2,
    maxDelayMs: 1000,
  });

  const pof = {
    id: 'pof_test_retry',
    organizationId: 'org_test',
    countyId: 'county_travis_tx',
    caseNumber: 'PR-2026-004',
    decedentName: 'Test Decedent',
    filingDate: new Date().toISOString(),
    property: { apn: 'APN-1', addressText: '1 St', assessedValue: 100, estimatedEquity: 50, recordsLocated: true },
    ownership: { status: 'DEED_RECORDED', verifiedOwners: ['Test'] },
    authority: { status: 'CONFIRMED', tier: 1, fiduciaryName: 'Fid', fiduciaryRole: 'EXECUTOR', lettersIssued: true },
    scoring: { compositeScore: 90, priorityBand: 'PRIORITY_A', ruleVersion: 'v1.0.0' },
    evidence: [],
    recommendedAction: 'Action',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const initialFailedDispatch = {
    id: 'disp_001',
    organizationId: 'org_test',
    clientId: 'client_test',
    opportunityId: 'opp_001',
    targetWebhookUrl: 'http://127.0.0.1:9', // unreachable port
    status: 'FAILED',
    httpStatus: null,
    responseBody: null,
    errorMessage: 'Connection refused',
    attemptCount: 1,
    dispatchedAt: new Date().toISOString(),
  };

  const queued = queue.enqueueFailedDispatch(
    {
      dispatchId: 'disp_001',
      targetWebhookUrl: 'http://127.0.0.1:9',
      payload: pof,
    },
    initialFailedDispatch
  );

  assert.equal(queued.status, 'PENDING');
  assert.equal(queued.attempts, 1);

  // Process all pending retries
  const results = await queue.processAllPending();
  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'FAILED');

  const updatedItem = queue.getItem(queued.id);
  assert.equal(updatedItem?.attempts, 2);
});

test('Customer Expansion (W05): analyzeClientFeedbackDispositions flags expansion on >= 2 closed deals', () => {
  const feedbackList = [
    {
      id: 'fb_1',
      organizationId: 'org_client',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_1',
      disposition: 'DEAL_CLOSED',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    {
      id: 'fb_2',
      organizationId: 'org_client',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_2',
      disposition: 'DEAL_CLOSED',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
  ];

  const report = analyzeClientFeedbackDispositions(feedbackList);
  assert.equal(report.globalMetrics.dealClosedCount, 2);
  assert.equal(report.countyBreakdown['county_travis_tx'].expansionEligible, true);
});
