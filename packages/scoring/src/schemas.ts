import { z } from 'zod';

export const PriorityBandSchema = z.enum([
  'PRIORITY_A',
  'PRIORITY_B',
  'PRIORITY_C',
  'DISQUALIFIED',
]);

export const ScoreComponentBreakdownSchema = z.object({
  equityComponent: z.number().min(0).max(100),
  authorityComponent: z.number().min(0).max(100),
  ownershipComponent: z.number().min(0).max(100),
  freshnessComponent: z.number().min(0).max(100),
  riskPenalty: z.number().min(0),
});

export const OpportunityScoreSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  opportunityId: z.string().min(1),
  countyId: z.string().min(1),
  equityScore: z.number().min(0).max(100),
  authorityScore: z.number().min(0).max(100),
  riskScore: z.number().min(0),
  compositeScore: z.number().min(0).max(100),
  priorityBand: PriorityBandSchema,
  breakdown: ScoreComponentBreakdownSchema,
  ruleVersion: z.string().min(1),
  evaluatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});
