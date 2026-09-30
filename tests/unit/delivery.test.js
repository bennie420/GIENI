import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchRealWebhook,
  LEGAL_DISCLAIMER,
  ProbateOpportunityFileSchema,
  WebhookRetryQueue,
  dispatchDeliveryNotifications,
  analyzeClientFeedbackDispositions,
} from '../../packages/delivery/dist/index.js';

function createTestSamplePOF(overrides = {}) {
  const now = new Date().toISOString();
  return {
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
    ownership: { status: 'DECEDENT_SOLE_OWNER', verifiedOwners: ['Arthur Jenkins'] },
    authority: { status: 'CONFIRMED', tier: 1, fiduciaryName: 'Sarah Jenkins', fiduciaryRole: 'EXECUTOR', lettersIssued: true },
    scoring: { compositeScore: 95, priorityBand: 'PRIORITY_A', ruleVersion: 'v1.0.0-deterministic' },
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
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    ...overrides,
  };
}

test('Delivery: requires mandatory legal disclaimer notice', () => {
  const validPOF = createTestSamplePOF();
  const parsed = ProbateOpportunityFileSchema.parse(validPOF);
  assert.equal(parsed.disclaimer, 'research finding—not legal opinion or title guarantee');
});

test('Delivery: authentic webhook dispatcher fails honestly on unreachable endpoint (Zero Fake Delivery)', async () => {
  const validPOF = createTestSamplePOF();

  const result = await dispatchRealWebhook({
    dispatchId: 'disp_test_fail',
    targetWebhookUrl: 'http://127.0.0.1:59199/unreachable-endpoint',
    payload: validPOF,
    timeoutMs: 1000,
  });

  assert.equal(result.status, 'FAILED');
  assert.equal(result.acknowledgedAt, null);
  assert.ok(result.errorMessage?.includes('Real network transmission failed'));
});

function createTestFailedDispatch(overrides = {}) {
  return {
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
    ...overrides,
  };
}

function setupTestRetryQueue(idSuffix = '001') {
  const queue = new WebhookRetryQueue({ maxAttempts: 3, initialDelayMs: 10, backoffMultiplier: 2, maxDelayMs: 50 });
  const samplePOF = createTestSamplePOF({ id: `pof_retry_${idSuffix}`, evidence: [] });
  const queued = queue.enqueueFailedDispatch(
    { dispatchId: `disp_fail_${idSuffix}`, targetWebhookUrl: 'http://127.0.0.1:59199/unreachable', payload: samplePOF },
    createTestFailedDispatch({ id: `disp_fail_${idSuffix}`, opportunityId: `pof_retry_${idSuffix}` })
  );
  return { queue, queued };
}

test('Delivery: WebhookRetryQueue schedules backoff on initial delivery failure', async () => {
  const { queue, queued } = setupTestRetryQueue('backoff');

  assert.equal(queued.status, 'PENDING');
  assert.equal(queued.attempts, 1);
  assert.ok(queued.nextAttemptAt);

  const attempt2 = await queue.processItem(queued.id, { timeoutMs: 500 });
  assert.equal(attempt2.status, 'FAILED');
  assert.equal(queue.getItem(queued.id)?.attempts, 2);
  assert.equal(queue.getItem(queued.id)?.status, 'PENDING');
});

test('Delivery: WebhookRetryQueue escalates to EXHAUSTED_DEAD_LETTER when maxAttempts reached', async () => {
  const { queue, queued } = setupTestRetryQueue('dlq');

  await queue.processItem(queued.id, { timeoutMs: 500 });
  const exhausted = await queue.processItem(queued.id, { timeoutMs: 500 });

  assert.equal(exhausted.status, 'FAILED');
  assert.equal(queue.getItem(queued.id)?.attempts, 3);
  assert.equal(queue.getItem(queued.id)?.status, 'EXHAUSTED_DEAD_LETTER');
});

test('Delivery: dispatchDeliveryNotifications transmits email and in-app alerts', async () => {
  const samplePOF = createTestSamplePOF({ id: 'pof_notif_001', evidence: [] });

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

function createTestFeedback(id, disposition, countyId = 'county_travis_tx') {
  return {
    id,
    organizationId: 'org_test',
    clientId: 'client_1',
    countyId,
    opportunityId: `opp_${id}`,
    disposition,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

test('Delivery: analyzeClientFeedbackDispositions aggregates conversion metrics and expansion triggers', async () => {
  const feedbackList = [
    createTestFeedback('fb_1', 'CONTACTED'),
    createTestFeedback('fb_2', 'DEAL_CLOSED'),
    createTestFeedback('fb_3', 'DEAL_CLOSED'),
  ];

  const report = analyzeClientFeedbackDispositions(feedbackList);
  assert.equal(report.globalMetrics.totalDispositions, 3);
  assert.equal(report.globalMetrics.dealClosedCount, 2);
  assert.equal(report.countyBreakdown['county_travis_tx'].positiveConversions, 2);
  assert.equal(report.countyBreakdown['county_travis_tx'].expansionEligible, true);
});
