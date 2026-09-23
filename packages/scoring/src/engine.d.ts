import { OpportunityScore, ScoringEngineInput } from './types.js';
export declare const SCORING_RULE_VERSION = "v1.0.0-deterministic";
/**
 * Deterministically computes an opportunity score and priority band.
 * Contains ZERO randomized or synthetic mock values.
 */
export declare function calculateOpportunityScore(id: string, input: ScoringEngineInput): OpportunityScore;
//# sourceMappingURL=engine.d.ts.map