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

  let contacted = 0;
  let invalid = 0;
  let appointments = 0;
  let dealsClosed = 0;
  let notInterested = 0;

  for (const f of feedbackRecords) {
    switch (f.disposition) {
      case 'CONTACTED':
        contacted += 1;
        break;
      case 'INVALID':
        invalid += 1;
        break;
      case 'APPOINTMENT_SET':
        appointments += 1;
        break;
      case 'DEAL_CLOSED':
        dealsClosed += 1;
        break;
      case 'NOT_INTERESTED':
        notInterested += 1;
        break;
    }
  }

  const fastTotal = contacted + invalid + appointments;
  const positiveContactRate = fastTotal > 0 ? (contacted + appointments) / fastTotal : 0;
  const invalidRate = fastTotal > 0 ? invalid / fastTotal : 0;

  const slowTotal = dealsClosed + notInterested;
  const closeRate = slowTotal > 0 ? dealsClosed / slowTotal : 0;

  const fastSignals: FastSignalMetrics = {
    totalDispositions: fastTotal,
    contactedCount: contacted,
    invalidContactCount: invalid,
    appointmentCount: appointments,
    positiveContactRate: Math.round(positiveContactRate * 100) / 100,
    invalidRate: Math.round(invalidRate * 100) / 100,
  };

  const slowSignals: SlowSignalMetrics = {
    totalOutcomes: slowTotal,
    dealClosedCount: dealsClosed,
    notInterestedCount: notInterested,
    closeRate: Math.round(closeRate * 100) / 100,
  };

  // Adaptive recommendation heuristic:
  // If invalid fiduciary contact rate > 25%, recommend increasing Authority certainty weight by +0.05 and reducing Freshness by 0.05
  let recommendedAdjustment: AdaptiveSignalSummary['recommendedAdjustment'];

  if (fastTotal >= 10 && invalidRate >= 0.25 && currentWeights.freshnessWeight >= 0.1) {
    recommendedAdjustment = {
      rationale: `Elevated invalid contact rate (${Math.round(invalidRate * 100)}%). Recommend increasing Authority weight to prioritize verified letters and confirmed personal representatives.`,
      suggestedWeights: {
        authorityWeight: Math.round((currentWeights.authorityWeight + 0.05) * 100) / 100,
        ownershipWeight: currentWeights.ownershipWeight,
        equityWeight: currentWeights.equityWeight,
        freshnessWeight: Math.round((currentWeights.freshnessWeight - 0.05) * 100) / 100,
      },
    };
  }

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
