import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  aggregateAdaptiveSignals, 
  generateProposalFromSignals 
} from '../../packages/scoring/dist/signals.js';
import { 
  CloudTasksWorkflowQueueAdapter, 
  evaluateScaleEvolution 
} from '../../packages/workflow/dist/queue-adapter.js';

test('P3-2 Adaptive Learning Signals: Fast vs Slow feedback aggregation', () => {
  const currentWeights = {
    authorityWeight: 0.40,
    ownershipWeight: 0.25,
    equityWeight: 0.20,
    freshnessWeight: 0.15,
  };

  const feedbackRecords = [
    { disposition: 'CONTACTED', notes: 'Valid personal rep contacted' },
    { disposition: 'APPOINTMENT_SET', notes: 'Discovery call booked' },
    { disposition: 'INVALID', notes: 'Wrong phone number' },
    { disposition: 'INVALID', notes: 'Not the executor' },
    { disposition: 'INVALID', notes: 'Deceased was tenant only' },
    { disposition: 'INVALID', notes: 'Out of date contact' },
    { disposition: 'CONTACTED', notes: 'Follow up required' },
    { disposition: 'CONTACTED', notes: 'Discussed timeline' },
    { disposition: 'CONTACTED', notes: 'Spoke with attorney' },
    { disposition: 'CONTACTED', notes: 'Left message' },
    { disposition: 'DEAL_CLOSED', notes: 'Executed purchase contract' },
    { disposition: 'NOT_INTERESTED', notes: 'Family keeping property' }
  ];

  const summary = aggregateAdaptiveSignals({
    organizationId: 'org_test_1',
    countyId: 'harris_tx',
    feedbackRecords,
    currentWeights,
  });

  assert.equal(summary.countyId, 'harris_tx');
  assert.equal(summary.organizationId, 'org_test_1');
  assert.equal(summary.fastSignals.totalDispositions, 10);
  assert.equal(summary.fastSignals.contactedCount, 5);
  assert.equal(summary.fastSignals.appointmentCount, 1);
  assert.equal(summary.fastSignals.invalidContactCount, 4);
  assert.equal(summary.fastSignals.invalidRate, 0.4); // 4 / 10 = 40%

  assert.equal(summary.slowSignals.totalOutcomes, 2);
  assert.equal(summary.slowSignals.dealClosedCount, 1);
  assert.equal(summary.slowSignals.notInterestedCount, 1);
  assert.equal(summary.slowSignals.closeRate, 0.5); // 50%

  // High invalid rate (40% >= 25%) triggers recommended adjustment
  assert.ok(summary.recommendedAdjustment);
  assert.equal(summary.recommendedAdjustment.suggestedWeights.authorityWeight, 0.45);
  assert.equal(summary.recommendedAdjustment.suggestedWeights.freshnessWeight, 0.10);
});

test('P3-2 Adaptive Learning Signals: Proposal generation bounded by safety limits', () => {
  const currentWeights = {
    authorityWeight: 0.40,
    ownershipWeight: 0.25,
    equityWeight: 0.20,
    freshnessWeight: 0.15,
  };

  const feedbackRecords = Array.from({ length: 12 }, (_, i) => ({
    disposition: i < 4 ? 'INVALID' : 'CONTACTED',
  }));

  const summary = aggregateAdaptiveSignals({
    organizationId: 'org_test_1',
    countyId: 'harris_tx',
    feedbackRecords,
    currentWeights,
  });

  const proposal = generateProposalFromSignals({
    summary,
    sourceVersion: 'v1.0.0',
    proposedVersion: 'v1.1.0',
    proposedBy: 'operator_reviewer_1',
  });

  assert.ok(proposal);
  assert.equal(proposal.sourceVersion, 'v1.0.0');
  assert.equal(proposal.proposedVersion, 'v1.1.0');
  assert.equal(proposal.proposedWeights.authorityWeight, 0.45);
  assert.equal(proposal.proposedWeights.freshnessWeight, 0.10);
  const totalWeight = Math.round((
    proposal.proposedWeights.authorityWeight +
    proposal.proposedWeights.ownershipWeight +
    proposal.proposedWeights.equityWeight +
    proposal.proposedWeights.freshnessWeight
  ) * 100) / 100;
  assert.equal(totalWeight, 1.0);
  assert.equal(proposal.status, 'PENDING_CERTIFICATION');
  assert.ok(!proposal.certifiedBy); // Human certification required before adoption
});

test('P3-3 Infrastructure Evolution: Evaluates Cloud Tasks vs Temporal/BullMQ thresholds', () => {
  // Moderate load -> Stay on Cloud Tasks
  const moderateScale = evaluateScaleEvolution({
    dailyTaskVolume: 2500,
    maxObservedDurationMinutes: 5,
    peakConcurrentTasks: 50,
  });

  assert.equal(moderateScale.recommendedTarget, 'MAINTAIN_CURRENT');
  assert.equal(moderateScale.justified, false);

  // High daily volume -> Recommend BullMQ
  const highVolumeScale = evaluateScaleEvolution({
    dailyTaskVolume: 25000,
    maxObservedDurationMinutes: 10,
    peakConcurrentTasks: 300,
  });

  assert.equal(highVolumeScale.recommendedTarget, 'MIGRATE_TO_BULLMQ');
  assert.equal(highVolumeScale.justified, true);

  // Multi-hour state machines -> Recommend Temporal
  const longRunningScale = evaluateScaleEvolution({
    dailyTaskVolume: 5000,
    maxObservedDurationMinutes: 45,
    peakConcurrentTasks: 100,
  });

  assert.equal(longRunningScale.recommendedTarget, 'MIGRATE_TO_TEMPORAL');
  assert.equal(longRunningScale.justified, true);
});

test('P3-3 Queue Adapter: Cloud Tasks Adapter lifecycle', async () => {
  const adapter = new CloudTasksWorkflowQueueAdapter();

  assert.equal(adapter.adapterName, 'CLOUD_TASKS');

  const receipt = await adapter.enqueue({
    stage: 'DOCUMENT_AI_EXTRACTION',
    countyId: 'harris_tx',
    organizationId: 'org_test_1',
    payload: { documentId: 'doc_123' },
    idempotencyKey: 'idemp_key_001',
  });

  assert.ok(receipt.taskId);
  assert.equal(receipt.adapterName, 'CLOUD_TASKS');
  assert.ok(receipt.queueName.includes('harris_tx'));

  const cancelled = await adapter.cancel(receipt.taskId);
  assert.equal(cancelled, true);

  const doubleCancel = await adapter.cancel(receipt.taskId);
  assert.equal(doubleCancel, false);
});
