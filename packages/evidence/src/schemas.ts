import { z } from 'zod';


export const FilingTypeSchema = z.enum([
  'PETITION_FOR_PROBATE',
  'ORDER_APPOINTING_PR',
  'LETTERS_TESTAMENTARY',
  'LETTERS_OF_ADMINISTRATION',
  'INVENTORY_AND_APPRAISEMENT',
  'ANNUAL_ACCOUNTING',
  'NOTICE_TO_CREDITORS',
  'DECREE_OF_DISTRIBUTION',
  'DEED_OF_TRUST',
  'WARRANTY_DEED',
  'LACK_OF_PROBATE_AFFIDAVIT',
  'TRANSFER_ON_DEATH_DEED',
  'COMMUNITY_PROPERTY_AGREEMENT',
  'DOCKET_SUMMARY',
]);

export const ClaimTypeSchema = z.enum(['EXTRACTED', 'MATCHED', 'DERIVED', 'HUMAN_VERIFIED']);

export const VerificationStatusSchema = z.enum(['PROPOSED', 'VERIFIED', 'REJECTED', 'SUPERSEDED']);

export const BoundingBoxSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  page: z.number().int().min(1),
});

export const SourceDocumentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  storageUri: z.string().url(),
  artifactSha256: z.string().length(64),
  sourceUrl: z.string().url().optional(),
  retrievalTimestamp: z.string().datetime(),
  termsNote: z.string().optional(),
  filingType: FilingTypeSchema.optional(),
  caseNumber: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const ClaimEvidenceSchema = z.object({
  id: z.string().min(1),
  claimId: z.string().min(1),
  sourceDocumentId: z.string().min(1),
  pageNumber: z.number().int().min(1),
  boundingBox: BoundingBoxSchema.optional(),
  excerpt: z.string().min(1),
  sourceLocator: z.string().min(1),
  artifactSha256: z.string().length(64),
  extractionRunId: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const ClaimSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().optional(),
  countyId: z.string().min(1),
  subjectType: z.enum(['PROBATE_CASE', 'PROPERTY', 'PERSON', 'AUTHORITY', 'OWNERSHIP']),
  subjectId: z.string().min(1),
  fieldPath: z.string().min(1),
  proposedValue: z.unknown(),
  normalizedValue: z.unknown().optional(),
  claimType: ClaimTypeSchema,
  confidence: z.number().min(0).max(1),
  verificationStatus: VerificationStatusSchema,
  modelVersion: z.string().optional(),
  ruleVersion: z.string().optional(),
  evidence: z.array(ClaimEvidenceSchema).min(1, 'A claim must cite at least one piece of primary evidence'),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  createdBy: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const ClaimAuditEventTypeSchema = z.enum([
  'CREATED',
  'VERIFIED',
  'REJECTED',
  'SUPERSEDED',
  'DELIVERED',
  'ROLLED_BACK',
]);

export const ClaimAuditEventSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  clientId: z.string().optional(),
  claimId: z.string().min(1),
  eventType: ClaimAuditEventTypeSchema,
  previousStatus: VerificationStatusSchema.optional(),
  newStatus: z.union([VerificationStatusSchema, z.literal('DELIVERED'), z.literal('ROLLED_BACK')]),
  actorId: z.string().min(1),
  rationale: z.string().optional(),
  evidenceId: z.string().optional(),
  policyRuleVersion: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const SourceRecordTypeSchema = z.enum(['COURT', 'ASSESSOR', 'RECORDER', 'GIS', 'TAX']);

export const SourceRecordSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  sourceType: SourceRecordTypeSchema,
  sourceUrl: z.string().url(),
  retrievalTimestamp: z.string().datetime(),
  artifactSha256: z.string().length(64),
  sourceSystem: z.string().min(1),
  rawPayloadLocation: z.string().min(1),
  adapterVersion: z.string().min(1),
  filingType: FilingTypeSchema.optional(),
  caseNumber: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});
