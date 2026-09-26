import { z } from 'zod';

export const CoefficientWeightsSchema = z
  .object({
    authorityWeight: z.number().min(0).max(1),
    ownershipWeight: z.number().min(0).max(1),
    equityWeight: z.number().min(0).max(1),
    freshnessWeight: z.number().min(0).max(1),
  })
  .refine(
    (w) =>
      Math.abs(w.authorityWeight + w.ownershipWeight + w.equityWeight + w.freshnessWeight - 1.0) <
      0.001,
    { message: 'Sum of scoring weights must equal exactly 1.0' }
  );

export type CoefficientWeights = z.infer<typeof CoefficientWeightsSchema>;

export type CoefficientStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'ROLLED_BACK';

export interface CoefficientVersion {
  id: string;
  version: string;
  organizationId: string;
  weights: CoefficientWeights;
  status: CoefficientStatus;
  authorId: string;
  certifiedBy?: string | null;
  certifiedAt?: string | null;
  rationale: string;
  promotedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface CoefficientProposal {
  id: string;
  organizationId: string;
  sourceVersion: string;
  proposedVersion: string;
  proposedWeights: CoefficientWeights;
  rationale: string;
  fastSignalMetrics?: {
    clientFeedbackPositiveRate: number;
    sampleSize: number;
  };
  slowSignalMetrics?: {
    dealClosedRate: number;
    titleDisputeRate: number;
    sampleSize: number;
  };
  status: 'PENDING_CERTIFICATION' | 'PROMOTED' | 'REJECTED';
  proposedBy: string;
  createdAt: string;
  schemaVersion: number;
}

export const ACTIVE_DEFAULT_WEIGHTS: CoefficientWeights = {
  authorityWeight: 0.35,
  ownershipWeight: 0.25,
  equityWeight: 0.25,
  freshnessWeight: 0.15,
};

/**
 * Creates a new versioned CoefficientProposal from adaptive feedback signals.
 * CRITICAL RULE: Proposals are NEVER promoted automatically.
 */
export function createCoefficientProposal(params: {
  organizationId: string;
  sourceVersion: string;
  proposedVersion: string;
  proposedWeights: CoefficientWeights;
  rationale: string;
  proposedBy: string;
  fastSignalMetrics?: { clientFeedbackPositiveRate: number; sampleSize: number };
  slowSignalMetrics?: { dealClosedRate: number; titleDisputeRate: number; sampleSize: number };
}): CoefficientProposal {
  // Validate weight constraints
  CoefficientWeightsSchema.parse(params.proposedWeights);

  return {
    id: `cprop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    organizationId: params.organizationId,
    sourceVersion: params.sourceVersion,
    proposedVersion: params.proposedVersion,
    proposedWeights: params.proposedWeights,
    rationale: params.rationale,
    fastSignalMetrics: params.fastSignalMetrics,
    slowSignalMetrics: params.slowSignalMetrics,
    status: 'PENDING_CERTIFICATION',
    proposedBy: params.proposedBy,
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

/**
 * Promotes a proposed coefficient version to ACTIVE status.
 * Requires mandatory human certification (never autonomous agent promotion).
 */
export function promoteCoefficientProposal(
  proposal: CoefficientProposal,
  certifierId: string,
  certificationNote: string
): { promotedVersion: CoefficientVersion; updatedProposal: CoefficientProposal } {
  if (proposal.status !== 'PENDING_CERTIFICATION') {
    throw new Error(
      `Cannot promote proposal: status is currently '${proposal.status}', must be 'PENDING_CERTIFICATION'`
    );
  }

  if (!certifierId || certifierId.trim().length === 0) {
    throw new Error('Security Violation: Human certifier ID is mandatory for coefficient promotion');
  }

  const now = new Date().toISOString();

  const promotedVersion: CoefficientVersion = {
    id: `cver_${proposal.proposedVersion.replace(/[^a-zA-Z0-9]/g, '_')}`,
    version: proposal.proposedVersion,
    organizationId: proposal.organizationId,
    weights: proposal.proposedWeights,
    status: 'ACTIVE',
    authorId: proposal.proposedBy,
    certifiedBy: certifierId,
    certifiedAt: now,
    rationale: `${proposal.rationale} [Certified by ${certifierId}: ${certificationNote}]`,
    promotedAt: now,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };

  proposal.status = 'PROMOTED';

  return { promotedVersion, updatedProposal: proposal };
}

/**
 * Rolls back an active coefficient version to a certified previous version.
 */
export function rollbackCoefficientVersion(
  currentActive: CoefficientVersion,
  previousTarget: CoefficientVersion,
  operatorId: string,
  reason: string
): { supersededVersion: CoefficientVersion; restoredActive: CoefficientVersion } {
  const now = new Date().toISOString();

  currentActive.status = 'ROLLED_BACK';
  currentActive.updatedAt = now;

  const restoredActive: CoefficientVersion = {
    ...previousTarget,
    id: `cver_${previousTarget.version}_restored_${Date.now()}`,
    status: 'ACTIVE',
    certifiedBy: operatorId,
    certifiedAt: now,
    promotedAt: now,
    rationale: `Rolled back from ${currentActive.version} to ${previousTarget.version}. Reason: ${reason}`,
    updatedAt: now,
  };

  return { supersededVersion: currentActive, restoredActive };
}
