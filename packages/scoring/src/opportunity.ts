import { BaseEntity } from '@gieni/database';
import { PriorityBand, OpportunityScore } from './types.js';
import { AuthorityAssessment } from '@gieni/authority';
import { OwnershipAssessment } from '@gieni/ownership';
import { PropertyParcel } from '@gieni/property';

export type OpportunityLifecycleStatus =
  | 'INTAKE'
  | 'INVESTIGATING'
  | 'EXCEPTION'
  | 'READY_FOR_QC'
  | 'QC_APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

/**
 * Denormalized current snapshot stored on Opportunity for fast operator dashboards.
 * CRITICAL RULE: This snapshot is a projection rebuilt from canonical assessments,
 * not the evidence system of record.
 */
export interface OpportunitySnapshot {
  caseNumber: string;
  decedentName: string;
  filingDate: string;
  propertyAddress: string | null;
  assessedValue: number | null;
  estimatedEquity: number | null;
  ownershipStatus: string | null;
  authorityStatus: string | null;
  authorityTier: number | null;
  fiduciaryName: string | null;
  compositeScore: number | null;
  priorityBand: PriorityBand | null;
  unresolvedExceptionsCount: number;
  lastProjectedAt: string;
}

/**
 * Operational opportunity projection entity (Collection: 'opportunities').
 */
export interface Opportunity extends BaseEntity {
  caseId: string;
  parcelId: string | null;
  status: OpportunityLifecycleStatus;
  currentSnapshot: OpportunitySnapshot;
}

/**
 * Deterministically rebuilds an Opportunity projection snapshot from canonical assessments.
 */
export function buildOpportunitySnapshot(params: {
  caseNumber: string;
  decedentName: string;
  filingDate: string;
  property: PropertyParcel | null;
  authority: AuthorityAssessment | null;
  ownership: OwnershipAssessment | null;
  score: OpportunityScore | null;
  unresolvedExceptionsCount?: number;
}): OpportunitySnapshot {
  const propertyAddress = params.property?.address
    ? `${params.property.address.street}, ${params.property.address.city}, ${params.property.address.state} ${params.property.address.zipCode}`
    : null;

  return {
    caseNumber: params.caseNumber,
    decedentName: params.decedentName,
    filingDate: params.filingDate,
    propertyAddress,
    assessedValue: params.property?.totalAssessedValue ?? null,
    estimatedEquity: params.property?.totalAssessedValue ? Math.max(0, params.property.totalAssessedValue - 75000) : null,
    ownershipStatus: params.ownership?.status ?? null,
    authorityStatus: params.authority?.status ?? null,
    authorityTier: params.authority?.tier ?? null,
    fiduciaryName: params.authority?.fiduciary?.fullName ?? null,
    compositeScore: params.score?.compositeScore ?? null,
    priorityBand: params.score?.priorityBand ?? null,
    unresolvedExceptionsCount: params.unresolvedExceptionsCount ?? 0,
    lastProjectedAt: new Date().toISOString(),
  };
}
