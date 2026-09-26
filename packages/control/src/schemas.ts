import { z } from 'zod';

export const ControlMechanismSchema = z.enum([
  'LETTERS_TESTAMENTARY',
  'LETTERS_OF_ADMINISTRATION',
  'TRUST_AGREEMENT',
  'SURVIVORSHIP_TRANSFER',
  'DEED_TITLE_HOLDER',
  'POWER_OF_ATTORNEY',
  'UNRESOLVED',
]);

export const ControlStatusSchema = z.enum([
  'ESTATE_JUDICIAL_CONTROL',
  'TRUSTEE_CONTROL',
  'SURVIVOR_OPERATION_OF_LAW',
  'DISPUTED_CONTROL',
  'NO_LEGAL_CONTROL',
  'UNRESOLVED',
]);

export const ControlAssessmentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  parcelId: z.string().min(1),
  caseId: z.string().nullable().optional(),
  primaryControllerName: z.string().nullable(),
  controlMechanism: ControlMechanismSchema,
  status: ControlStatusSchema,
  effectiveBasis: z.string().min(1),
  canConveyTitle: z.boolean(),
  verifiedEvidenceIds: z.array(z.string()),
  verifiedClaimIds: z.array(z.string()),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1),
  ruleVersion: z.string().min(1),
  evaluatedAt: z.string().datetime(),
  evaluatorId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});
