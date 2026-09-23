import { z } from 'zod';
import { LEGAL_DISCLAIMER } from './types.js';

export const PropertySummarySchema = z.object({
  apn: z.string().min(1),
  addressText: z.string().min(1),
  assessedValue: z.number().nullable(),
  estimatedEquity: z.number().nullable(),
  recordsLocated: z.boolean(),
});

export const OwnershipSummarySchema = z.object({
  status: z.enum([
    'DECEDENT_SOLE_OWNER',
    'JOINT_TENANCY_WITH_SURVIVOR',
    'TENANTS_IN_COMMON',
    'TRUST_HELD',
    'TRANSFERRED_PRIOR_TO_DEATH',
    'UNRESOLVED',
  ]),
  verifiedOwners: z.array(z.string()).min(1),
});

export const AuthoritySummarySchema = z.object({
  status: z.enum(['CONFIRMED', 'DISPUTED', 'UNRESOLVED', 'NO_APPOINTMENT']),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  fiduciaryName: z.string().nullable(),
  fiduciaryRole: z.enum([
    'EXECUTOR',
    'ADMINISTRATOR',
    'PERSONAL_REPRESENTATIVE',
    'SPECIAL_ADMINISTRATOR',
    'UNAPPOINTED',
    'UNKNOWN',
  ]),
  lettersIssued: z.boolean(),
});

export const ScoringSummarySchema = z.object({
  compositeScore: z.number().min(0).max(100),
  priorityBand: z.enum(['PRIORITY_A', 'PRIORITY_B', 'PRIORITY_C', 'DISQUALIFIED']),
  ruleVersion: z.string().min(1),
});

export const EvidencePointerSchema = z.object({
  claimPath: z.string().min(1),
  factSummary: z.string().min(1),
  sourceDocumentName: z.string().min(1),
  pageNumber: z.number().int().min(1),
  excerpt: z.string().min(1),
  artifactSha256: z.string().length(64),
  signedViewUrl: z.string().url().optional(),
});

export const ProbateOpportunityFileSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().optional(),
  countyId: z.string().min(1),
  caseNumber: z.string().min(1),
  decedentName: z.string().min(1),
  filingDate: z.string().datetime(),
  property: PropertySummarySchema,
  ownership: OwnershipSummarySchema,
  authority: AuthoritySummarySchema,
  scoring: ScoringSummarySchema,
  evidence: z.array(EvidencePointerSchema).min(1),
  recommendedAction: z.string().min(1),
  disclaimer: z.literal(LEGAL_DISCLAIMER),
  publishedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const DeliveryDispatchSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().min(1),
  opportunityId: z.string().min(1),
  targetWebhookUrl: z.string().url(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  httpStatus: z.number().nullable(),
  responseBody: z.string().nullable(),
  errorMessage: z.string().nullable().optional(),
  attemptCount: z.number().int().min(1),
  dispatchedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().nullable().optional(),
});

export const ClientFeedbackSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().min(1),
  opportunityId: z.string().min(1),
  disposition: z.enum([
    'CONTACTED',
    'INVALID',
    'NOT_INTERESTED',
    'APPOINTMENT_SET',
    'DEAL_CLOSED',
  ]),
  notes: z.string().nullable().optional(),
  submittedAt: z.string().datetime(),
});
