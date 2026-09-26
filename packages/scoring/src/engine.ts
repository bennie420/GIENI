import { OpportunityScore, PriorityBand, ScoreComponentBreakdown, ScoringEngineInput } from './types.js';

export const SCORING_RULE_VERSION = 'v1.0.0-deterministic';

function computeAuthorityComponent(authority?: ScoringEngineInput['authority']): number {
  if (!authority) return 0;
  if (authority.status === 'DISPUTED') return 10;
  if (authority.status !== 'CONFIRMED' || !authority.fiduciary) return 0;

  const tierScores: Record<number, number> = {
    1: 100,
    2: 80,
    3: 50,
    4: 20,
  };

  return tierScores[authority.tier] ?? 0;
}

function computeOwnershipComponent(ownership?: ScoringEngineInput['ownership']): number {
  if (!ownership) return 0;

  switch (ownership.status) {
    case 'DECEDENT_SOLE_OWNER':
      return 100;
    case 'TENANTS_IN_COMMON':
      return 60;
    case 'JOINT_TENANCY_WITH_SURVIVOR':
      return 30;
    case 'TRUST_HELD':
      return 40;
    case 'TRANSFERRED_PRIOR_TO_DEATH':
    case 'UNRESOLVED':
    default:
      return 0;
  }
}

function computeEquityComponent(
  property?: ScoringEngineInput['property'],
  estimatedLiens?: number
): number {
  if (!property || property.totalAssessedValue === null) {
    return 0;
  }

  const value = property.totalAssessedValue;
  const liens = estimatedLiens ?? 0;
  const estimatedEquity = Math.max(0, value - liens);

  if (estimatedEquity >= 500000) return 100;
  if (estimatedEquity >= 300000) return 80;
  if (estimatedEquity >= 150000) return 50;
  if (estimatedEquity > 0) return 25;
  return 0;
}

function computeFreshnessComponent(filingDate: string): number {
  const filingTime = new Date(filingDate).getTime();
  const daysOld = Math.max(0, Math.floor((Date.now() - filingTime) / (1000 * 60 * 60 * 24)));

  if (daysOld <= 14) return 100;
  if (daysOld <= 30) return 80;
  if (daysOld <= 60) return 50;
  return 20;
}

function computeRiskPenalty(input: ScoringEngineInput): number {
  let penalty = 0;

  if (!input.property) {
    penalty += 30;
  }
  if (!input.authority || input.authority.status === 'UNRESOLVED') {
    penalty += 20;
  }
  if (!input.ownership || input.ownership.status === 'UNRESOLVED') {
    penalty += 15;
  }

  return penalty;
}

function isPriorityA(score: number, authority: number, ownership: number): boolean {
  return score >= 80 && authority >= 70 && ownership >= 60;
}

function isPriorityB(score: number, authority: number): boolean {
  return score >= 60 && authority >= 50;
}

function determinePriorityBand(
  compositeScore: number,
  authorityComponent: number,
  ownershipComponent: number
): PriorityBand {
  if (isPriorityA(compositeScore, authorityComponent, ownershipComponent)) {
    return 'PRIORITY_A';
  }
  if (isPriorityB(compositeScore, authorityComponent)) {
    return 'PRIORITY_B';
  }
  if (compositeScore >= 35) {
    return 'PRIORITY_C';
  }
  return 'DISQUALIFIED';
}

/**
 * Deterministically computes an opportunity score and priority band.
 * Contains ZERO randomized or synthetic mock values.
 */
export function calculateOpportunityScore(
  id: string,
  input: ScoringEngineInput
): OpportunityScore {
  const evaluatedAt = new Date().toISOString();

  const authorityComponent = computeAuthorityComponent(input.authority);
  const ownershipComponent = computeOwnershipComponent(input.ownership);
  const equityComponent = computeEquityComponent(input.property, input.estimatedLiensOrMortgageAmount);
  const freshnessComponent = computeFreshnessComponent(input.filingDate);
  const riskPenalty = computeRiskPenalty(input);

  // Composite Calculation: Weighted sum minus penalties
  // Weights: Authority (35%), Ownership (25%), Equity (25%), Freshness (15%)
  const rawWeightedScore =
    authorityComponent * 0.35 +
    ownershipComponent * 0.25 +
    equityComponent * 0.25 +
    freshnessComponent * 0.15;

  const compositeScore = Math.max(0, Math.min(100, Math.round(rawWeightedScore - riskPenalty)));
  const priorityBand = determinePriorityBand(compositeScore, authorityComponent, ownershipComponent);

  const breakdown: ScoreComponentBreakdown = {
    authorityComponent,
    ownershipComponent,
    equityComponent,
    freshnessComponent,
    riskPenalty,
  };

  return {
    id,
    organizationId: input.organizationId,
    opportunityId: input.opportunityId,
    countyId: input.countyId,
    equityScore: equityComponent,
    authorityScore: authorityComponent,
    riskScore: riskPenalty,
    compositeScore,
    priorityBand,
    breakdown,
    ruleVersion: SCORING_RULE_VERSION,
    evaluatedAt,
    createdAt: evaluatedAt,
    updatedAt: evaluatedAt,
    schemaVersion: 1,
  };
}
