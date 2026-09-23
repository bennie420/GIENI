import { z } from 'zod';

export const ExceptionTypeSchema = z.enum([
  'AUTHORITY_UNRESOLVED',
  'NO_RECORD_MATCH',
  'TITLE_CONFLICT',
  'OCR_CONFIDENCE_LOW',
  'DATA_MISMATCH',
  'MISSING_MANDATORY_EVIDENCE',
]);

export const ExceptionStatusSchema = z.enum([
  'PENDING_REVIEW',
  'IN_RESEARCH',
  'RESOLVED',
  'REJECTED',
  'DISQUALIFIED',
]);

export const InvestigationExceptionSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  opportunityId: z.string().min(1),
  type: ExceptionTypeSchema,
  status: ExceptionStatusSchema,
  description: z.string().min(1),
  assignedTo: z.string().nullable().optional(),
  resolutionNote: z.string().nullable().optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
  clientId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const QCGateResultSchema = z.object({
  gateName: z.string().min(1),
  passed: z.boolean(),
  reason: z.string().optional(),
});

export const QCDecisionSchema = z.enum([
  'APPROVED_FOR_DELIVERY',
  'REJECTED_TO_EXCEPTION',
  'DISQUALIFIED',
]);

export const QCReviewSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  opportunityId: z.string().min(1),
  reviewerId: z.string().min(1),
  decision: QCDecisionSchema,
  gates: z.array(QCGateResultSchema),
  notes: z.string().nullable().optional(),
  reviewedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});
