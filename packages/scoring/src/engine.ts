import { OpportunityScore, PriorityBand, ScoreComponentBreakdown, ScoringEngineInput } from './types.js';

export const SCORING_RULE_VERSION = 'v1.0.0-deterministic';

/**
 * Deterministically computes an opportunity score and priority band.
 * Contains ZERO randomized or synthetic mock values.
 */
export function calculateOpportunityScore(
  id: string,
  input: ScoringEngineInput
): OpportunityScore {
  const evaluatedAt = new Date().toISOString();

  // 1. Authority Component (0 - 100)
  let authorityComponent = 0;
  if (input.authority && input.authority.status === 'CONFIRMED' && input.authority.fiduciary) {
    switch (input.authority.tier) {
      case 1:
        authorityComponent = 100;
        break;
      case 2:
        authorityComponent = 80;
        break;
      case 3:
        authorityComponent = 50;
        break;
      case 4:
        authorityComponent = 20;
        break;
    }
  } else if (input.authority && input.authority.status === 'DISPUTED') {
    authorityComponent = 10;
  } else {
    // Unresolved or unappointed - transparent 0
    authorityComponent = 0;
  }

  // 2. Ownership Component (0 - 100)
  let ownershipComponent = 0;
  if (input.ownership) {
    switch (input.ownership.status) {
      case 'DECEDENT_SOLE_OWNER':
        ownershipComponent = 100;
        break;
      case 'TENANTS_IN_COMMON':
        ownershipComponent = 60;
        break;
      case 'JOINT_TENANCY_WITH_SURVIVOR':
        ownershipComponent = 30;
        break;
      case 'TRUST_HELD':
        ownershipComponent = 40;
        break;
      case 'TRANSFERRED_PRIOR_TO_DEATH':
      case 'UNRESOLVED':
      default:
        ownershipComponent = 0;
        break;
    }
  }

  // 3. Equity Component (0 - 100)
  let equityComponent = 0;
  if (input.property && input.property.totalAssessedValue !== null) {
    const value = input.property.totalAssessedValue;
    const liens = input.estimatedLiensOrMortgageAmount ?? 0;
    const estimatedEquity = Math.max(0, value - liens);

    if (estimatedEquity >= 500000) {
      equityComponent = 100;
    } else if (estimatedEquity >= 300000) {
      equityComponent = 80;
    } else if (estimatedEquity >= 150000) {
      equityComponent = 50;
    } else if (estimatedEquity > 0) {
      equityComponent = 25;
    }
  }

  // 4. Freshness Component (0 - 100)
  let freshnessComponent = 0;
  const filingTime = new Date(input.filingDate).getTime();
  const now = Date.now();
  const daysOld = Math.max(0, Math.floor((now - filingTime) / (1000 * 60 * 60 * 24)));
  if (daysOld <= 14) {
    freshnessComponent = 100;
  } else if (daysOld <= 30) {
    freshnessComponent = 80;
  } else if (daysOld <= 60) {
    freshnessComponent = 50;
  } else {
    freshnessComponent = 20;
  }

  // 5. Risk Penalty (0 - 50)
  let riskPenalty = 0;
  if (!input.property) {
    riskPenalty += 30;
  }
  if (!input.authority || input.authority.status === 'UNRESOLVED') {
    riskPenalty += 20;
  }
  if (!input.ownership || input.ownership.status === 'UNRESOLVED') {
    riskPenalty += 15;
  }

  // Composite Calculation: Weighted sum minus penalties
  // Weights: Authority (35%), Ownership (25%), Equity (25%), Freshness (15%)
  const rawWeightedScore =
    authorityComponent * 0.35 +
    ownershipComponent * 0.25 +
    equityComponent * 0.25 +
    freshnessComponent * 0.15;

  const compositeScore = Math.max(0, Math.min(100, Math.round(rawWeightedScore - riskPenalty)));

  // Priority Band
  let priorityBand: PriorityBand = 'DISQUALIFIED';
  if (compositeScore >= 80 && authorityComponent >= 70 && ownershipComponent >= 60) {
    priorityBand = 'PRIORITY_A';
  } else if (compositeScore >= 60 && authorityComponent >= 50) {
    priorityBand = 'PRIORITY_B';
  } else if (compositeScore >= 35) {
    priorityBand = 'PRIORITY_C';
  } else {
    priorityBand = 'DISQUALIFIED';
  }

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
