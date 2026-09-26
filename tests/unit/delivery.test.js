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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

test('Delivery: WebhookRetryQueue handles retry enqueuing and backoff progression', async () => {
  const { WebhookRetryQueue } = await import('../../packages/delivery/dist/index.js');
  const queue = new WebhookRetryQueue({
    maxAttempts: 3,
    initialDelayMs: 50,
    backoffMultiplier: 2,
    maxDelayMs: 200,
  });

  const samplePOF = {
    id: 'pof_retry_test',
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
    evidence: [],
    recommendedAction: 'Contact Executor',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const failedDispatch = {
    id: 'disp_fail_001',
    organizationId: 'org_gieni_ops',
    clientId: 'client_austin_cap',
    opportunityId: 'pof_retry_test',
    targetWebhookUrl: 'http://127.0.0.1:59199/unreachable',
    status: 'FAILED',
    httpStatus: null,
    responseBody: null,
    errorMessage: 'Real network transmission failed: Connection refused',
    attemptCount: 1,
    dispatchedAt: new Date().toISOString(),
    acknowledgedAt: null,
  };

  const queued = queue.enqueueFailedDispatch(
    {
      dispatchId: 'disp_fail_001',
      targetWebhookUrl: 'http://127.0.0.1:59199/unreachable',
      payload: samplePOF,
    },
    failedDispatch
  );

  assert.equal(queued.status, 'PENDING');
  assert.equal(queued.attempts, 1);
  assert.ok(queued.nextAttemptAt);

  // Process attempt 2 (will fail again due to unreachable endpoint)
  const attempt2 = await queue.processItem(queued.id, { timeoutMs: 500 });
  assert.equal(attempt2.status, 'FAILED');
  const afterAttempt2 = queue.getItem(queued.id);
  assert.equal(afterAttempt2?.attempts, 2);
  assert.equal(afterAttempt2?.status, 'PENDING');

  // Process attempt 3 (exhausts maxAttempts -> EXHAUSTED_DEAD_LETTER)
  const attempt3 = await queue.processItem(queued.id, { timeoutMs: 500 });
  assert.equal(attempt3.status, 'FAILED');
  const exhausted = queue.getItem(queued.id);
  assert.equal(exhausted?.attempts, 3);
  assert.equal(exhausted?.status, 'EXHAUSTED_DEAD_LETTER');
});

test('Delivery: dispatchDeliveryNotifications transmits email and in-app alerts', async () => {
  const { dispatchDeliveryNotifications } = await import('../../packages/delivery/dist/index.js');

  const samplePOF = {
    id: 'pof_notif_001',
    organizationId: 'org_test',
    clientId: 'client_acp',
    countyId: 'county_travis_tx',
    caseNumber: 'PR-2026-09912',
    decedentName: 'Eleanor Vance Sterling',
    filingDate: '2026-03-01T00:00:00.000Z',
    property: {
      apn: '01-2894-0012',
      addressText: '3814 Westlake Hills Dr, Austin, TX',
      assessedValue: 1250000,
      estimatedEquity: 980000,
      recordsLocated: true,
    },
    ownership: {
      status: 'DECEDENT_SOLE_OWNER',
      verifiedOwners: ['Eleanor Vance Sterling'],
    },
    authority: {
      status: 'CONFIRMED',
      tier: 1,
      fiduciaryName: 'Marcus Sterling',
      fiduciaryRole: 'EXECUTOR',
      lettersIssued: true,
    },
    scoring: {
      compositeScore: 96,
      priorityBand: 'PRIORITY_A',
      ruleVersion: 'v1.0.0-deterministic',
    },
    evidence: [],
    recommendedAction: 'Immediate high-equity outreach',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const events = await dispatchDeliveryNotifications({
    pof: samplePOF,
    channels: [
      { channelType: 'EMAIL', destination: 'acquisitions@acpcapital.com', enabled: true },
      { channelType: 'IN_APP', destination: 'client_portal_banner', enabled: true },
      { channelType: 'EMAIL', destination: 'disabled@test.com', enabled: false },
    ],
  });

  assert.equal(events.length, 2);
  assert.equal(events[0].channelType, 'EMAIL');
  assert.equal(events[0].status, 'SENT');
  assert.equal(events[0].priorityBand, 'PRIORITY_A');
  assert.equal(events[1].channelType, 'IN_APP');
  assert.equal(events[1].status, 'SENT');
});

test('Delivery: analyzeClientFeedbackDispositions aggregates conversion metrics and expansion triggers', async () => {
  const { analyzeClientFeedbackDispositions } = await import('../../packages/delivery/dist/index.js');

  const feedbackList = [
    {
      id: 'fb_1',
      organizationId: 'org_test',
      clientId: 'client_1',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_1',
      disposition: 'CONTACTED',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    {
      id: 'fb_2',
      organizationId: 'org_test',
      clientId: 'client_1',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_2',
      disposition: 'DEAL_CLOSED',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    {
      id: 'fb_3',
      organizationId: 'org_test',
      clientId: 'client_1',
      countyId: 'county_travis_tx',
      opportunityId: 'opp_3',
      disposition: 'DEAL_CLOSED',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
  ];

  const report = analyzeClientFeedbackDispositions(feedbackList);
  assert.equal(report.globalMetrics.totalDispositions, 3);
  assert.equal(report.globalMetrics.dealClosedCount, 2);
  assert.equal(report.countyBreakdown['county_travis_tx'].positiveConversions, 2);
  assert.equal(report.countyBreakdown['county_travis_tx'].expansionEligible, true);
});

