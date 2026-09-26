import { CoefficientWeights, createCoefficientProposal, CoefficientProposal } from './coefficients.js';

export type FeedbackDispositionSignal =
  | 'CONTACTED'
  | 'INVALID'
  | 'NOT_INTERESTED'
  | 'APPOINTMENT_SET'
  | 'DEAL_CLOSED';

export interface FeedbackRecordInput {
  disposition: FeedbackDispositionSignal;
  notes?: string | null;
  submittedAt?: string;
}

export interface FastSignalMetrics {

  totalDispositions: number;
  contactedCount: number;
  invalidContactCount: number;
  appointmentCount: number;
  positiveContactRate: number; // (contacted + appointment) / total
  invalidRate: number;         // invalid / total
}

export interface SlowSignalMetrics {
  totalOutcomes: number;
  dealClosedCount: number;
  notInterestedCount: number;
  closeRate: number;           // dealClosed / totalOutcomes
}

export interface AdaptiveSignalSummary {
  countyId: string;
  organizationId: string;
  evaluatedAt: string;
  fastSignals: FastSignalMetrics;
  slowSignals: SlowSignalMetrics;
  recommendedAdjustment?: {
    rationale: string;
    suggestedWeights: CoefficientWeights;
  };
}

type DispositionCounts = Record<FeedbackDispositionSignal, number>;

function countDispositions(feedbackRecords: FeedbackRecordInput[]): DispositionCounts {
  const counts: DispositionCounts = {
    CONTACTED: 0,
    INVALID: 0,
    APPOINTMENT_SET: 0,
    DEAL_CLOSED: 0,
    NOT_INTERESTED: 0,
  };

  for (const f of feedbackRecords) {
    if (f.disposition in counts) {
      counts[f.disposition] += 1;
    }
  }

  return counts;
}

function calculateFastSignals(counts: DispositionCounts): FastSignalMetrics {
  const fastTotal = counts.CONTACTED + counts.INVALID + counts.APPOINTMENT_SET;
  const positiveContactRate = fastTotal > 0 ? (counts.CONTACTED + counts.APPOINTMENT_SET) / fastTotal : 0;
  const invalidRate = fastTotal > 0 ? counts.INVALID / fastTotal : 0;

  return {
    totalDispositions: fastTotal,
    contactedCount: counts.CONTACTED,
    invalidContactCount: counts.INVALID,
    appointmentCount: counts.APPOINTMENT_SET,
    positiveContactRate: Math.round(positiveContactRate * 100) / 100,
    invalidRate: Math.round(invalidRate * 100) / 100,
  };
}

function calculateSlowSignals(counts: DispositionCounts): SlowSignalMetrics {
  const slowTotal = counts.DEAL_CLOSED + counts.NOT_INTERESTED;
  const closeRate = slowTotal > 0 ? counts.DEAL_CLOSED / slowTotal : 0;

  return {
    totalOutcomes: slowTotal,
    dealClosedCount: counts.DEAL_CLOSED,
    notInterestedCount: counts.NOT_INTERESTED,
    closeRate: Math.round(closeRate * 100) / 100,
  };
}

function shouldRecommendAdjustment(
  fastSignals: FastSignalMetrics,
  freshnessWeight: number
): boolean {
  if (fastSignals.totalDispositions < 10) return false;
  if (fastSignals.invalidRate < 0.25) return false;
  if (freshnessWeight < 0.1) return false;
  return true;
}

function buildRecommendedAdjustment(
  invalidRate: number,
  currentWeights: CoefficientWeights
): AdaptiveSignalSummary['recommendedAdjustment'] {
  return {
    rationale: `Elevated invalid contact rate (${Math.round(invalidRate * 100)}%). Recommend increasing Authority weight to prioritize verified letters and confirmed personal representatives.`,
    suggestedWeights: {
      authorityWeight: Math.round((currentWeights.authorityWeight + 0.05) * 100) / 100,
      ownershipWeight: currentWeights.ownershipWeight,
      equityWeight: currentWeights.equityWeight,
      freshnessWeight: Math.round((currentWeights.freshnessWeight - 0.05) * 100) / 100,
    },
  };
}

/**
 * Aggregates commercial feedback into fast (daily) and slow (monthly) learning signals (Gieni OS Section 11 P3-2).
 */
export function aggregateAdaptiveSignals(params: {
  organizationId: string;
  countyId: string;
  feedbackRecords: FeedbackRecordInput[];
  currentWeights: CoefficientWeights;
}): AdaptiveSignalSummary {
  const { organizationId, countyId, feedbackRecords, currentWeights } = params;

  const counts = countDispositions(feedbackRecords);
  const fastSignals = calculateFastSignals(counts);
  const slowSignals = calculateSlowSignals(counts);

  const recommendedAdjustment = shouldRecommendAdjustment(fastSignals, currentWeights.freshnessWeight)
    ? buildRecommendedAdjustment(fastSignals.invalidRate, currentWeights)
    : undefined;

  return {
    countyId,
    organizationId,
    evaluatedAt: new Date().toISOString(),
    fastSignals,
    slowSignals,
    recommendedAdjustment,
  };
}

/**
 * Builds an official CoefficientProposal from an AdaptiveSignalSummary.
 * Strictly adheres to human-in-the-loop certification requirements.
 */
export function generateProposalFromSignals(params: {
  summary: AdaptiveSignalSummary;
  sourceVersion: string;
  proposedVersion: string;
  proposedBy: string;
}): CoefficientProposal | null {
  if (!params.summary.recommendedAdjustment) {
    return null; // No adjustment needed
  }

  return createCoefficientProposal({
    organizationId: params.summary.organizationId,
    sourceVersion: params.sourceVersion,
    proposedVersion: params.proposedVersion,
    proposedWeights: params.summary.recommendedAdjustment.suggestedWeights,
    rationale: `Adaptive Signal Recommendation: ${params.summary.recommendedAdjustment.rationale}`,
    proposedBy: params.proposedBy,
    fastSignalMetrics: {
      clientFeedbackPositiveRate: params.summary.fastSignals.positiveContactRate,
      sampleSize: params.summary.fastSignals.totalDispositions,
    },
    slowSignalMetrics: {
      dealClosedRate: params.summary.slowSignals.closeRate,
      titleDisputeRate: 0,
      sampleSize: params.summary.slowSignals.totalOutcomes,
    },
  });
}
