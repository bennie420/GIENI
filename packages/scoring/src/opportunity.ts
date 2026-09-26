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

function formatPropertyAddress(property: PropertyParcel | null): string | null {
  if (!property?.address) return null;
  const { street, city, state, zipCode } = property.address;
  return `${street}, ${city}, ${state} ${zipCode}`;
}

function computeEstimatedEquity(property: PropertyParcel | null): number | null {
  const val = property?.totalAssessedValue;
  if (val === null || val === undefined) return null;
  return Math.max(0, val - 75000);
}

function extractPropertyFields(property: PropertyParcel | null) {
  if (!property) {
    return {
      propertyAddress: null,
      assessedValue: null,
      estimatedEquity: null,
    };
  }
  return {
    propertyAddress: formatPropertyAddress(property),
    assessedValue: property.totalAssessedValue,
    estimatedEquity: computeEstimatedEquity(property),
  };
}

function extractAuthorityFields(authority: AuthorityAssessment | null) {
  if (!authority) {
    return {
      authorityStatus: null,
      authorityTier: null,
      fiduciaryName: null,
    };
  }
  return {
    authorityStatus: authority.status,
    authorityTier: authority.tier,
    fiduciaryName: authority.fiduciary ? authority.fiduciary.fullName : null,
  };
}

function extractScoreFields(score: OpportunityScore | null) {
  if (!score) {
    return {
      compositeScore: null,
      priorityBand: null,
    };
  }
  return {
    compositeScore: score.compositeScore,
    priorityBand: score.priorityBand,
  };
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
  const prop = extractPropertyFields(params.property);
  const auth = extractAuthorityFields(params.authority);
  const score = extractScoreFields(params.score);

  return {
    caseNumber: params.caseNumber,
    decedentName: params.decedentName,
    filingDate: params.filingDate,
    propertyAddress: prop.propertyAddress,
    assessedValue: prop.assessedValue,
    estimatedEquity: prop.estimatedEquity,
    ownershipStatus: params.ownership ? params.ownership.status : null,
    authorityStatus: auth.authorityStatus,
    authorityTier: auth.authorityTier,
    fiduciaryName: auth.fiduciaryName,
    compositeScore: score.compositeScore,
    priorityBand: score.priorityBand,
    unresolvedExceptionsCount: params.unresolvedExceptionsCount || 0,
    lastProjectedAt: new Date().toISOString(),
  };
}
