import { z } from 'zod';

export const OwnershipStatusSchema = z.enum([
  'DECEDENT_SOLE_OWNER',
  'JOINT_TENANCY_WITH_SURVIVOR',
  'TENANTS_IN_COMMON',
  'TRUST_HELD',
  'TRANSFERRED_PRIOR_TO_DEATH',
  'UNRESOLVED',
]);

export const OwnershipAssessmentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  parcelId: z.string().min(1),
  caseId: z.string().min(1),
  countyId: z.string().min(1),
  status: OwnershipStatusSchema,
  ownerNames: z.array(z.string()).min(1),
  deedRecordIds: z.array(z.string()),
  verifiedClaimIds: z.array(z.string()),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1),
  ruleVersion: z.string().min(1),
  evaluatedAt: z.string().datetime(),
  evaluatorId: z.string().min(1),
  schemaVersion: z.number().int().min(1),
});
