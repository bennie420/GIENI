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

export const OpportunitySnapshotSchema = z.object({
  caseNumber: z.string().min(1),
  decedentName: z.string().min(1),
  filingDate: z.string(),
  propertyAddress: z.string().nullable(),
  assessedValue: z.number().nullable(),
  estimatedEquity: z.number().nullable(),
  ownershipStatus: z.string().nullable(),
  authorityStatus: z.string().nullable(),
  authorityTier: z.number().nullable(),
  fiduciaryName: z.string().nullable(),
  compositeScore: z.number().nullable(),
  priorityBand: PriorityBandSchema.nullable(),
  unresolvedExceptionsCount: z.number().int().nonnegative(),
  lastProjectedAt: z.string(),
});

export const OpportunityLifecycleStatusSchema = z.enum([
  'INTAKE',
  'INVESTIGATING',
  'EXCEPTION',
  'READY_FOR_QC',
  'QC_APPROVED',
  'PUBLISHED',
  'ARCHIVED',
]);

export const OpportunitySchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  caseId: z.string().min(1),
  parcelId: z.string().nullable().optional(),
  status: OpportunityLifecycleStatusSchema,
  currentSnapshot: OpportunitySnapshotSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().int().min(1),
});

