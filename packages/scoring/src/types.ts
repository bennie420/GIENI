import { BaseEntity } from '@gieni/database';
import { AuthorityAssessment } from '@gieni/authority';
import { OwnershipAssessment } from '@gieni/ownership';
import { PropertyParcel } from '@gieni/property';

export type PriorityBand = 'PRIORITY_A' | 'PRIORITY_B' | 'PRIORITY_C' | 'DISQUALIFIED';

export interface ScoreComponentBreakdown {
  equityComponent: number;
  authorityComponent: number;
  ownershipComponent: number;
  freshnessComponent: number;
  riskPenalty: number;
}

export interface OpportunityScore extends BaseEntity {
  opportunityId: string;
  equityScore: number;
  authorityScore: number;
  riskScore: number;
  compositeScore: number;
  priorityBand: PriorityBand;
  breakdown: ScoreComponentBreakdown;
  ruleVersion: string;
  evaluatedAt: string;
}

export interface ScoringEngineInput {
  organizationId: string;
  opportunityId: string;
  countyId: string;
  property: PropertyParcel | null;
  authority: AuthorityAssessment | null;
  ownership: OwnershipAssessment | null;
  filingDate: string;
  estimatedLiensOrMortgageAmount?: number;
}
