import { z } from 'zod';

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
