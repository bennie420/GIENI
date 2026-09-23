import { z } from 'zod';

export const WorkflowStageSchema = z.enum([
  'DOCUMENT_INGEST',
  'OCR_LAYOUT',
  'PROPOSAL_EXTRACTION',
  'PARCEL_MATCH',
  'OWNERSHIP_ASSESSMENT',
  'AUTHORITY_ASSESSMENT',
  'DETERMINISTIC_SCORING',
  'QC_GATE',
  'DELIVERY',
]);

export const WorkflowStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'RETRYING',
  'DEAD_LETTER',
]);

export const WorkflowRunSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  opportunityId: z.string().nullable().optional(),
  stage: WorkflowStageSchema,
  status: WorkflowStatusSchema,
  idempotencyKey: z.string().min(1),
  attemptCount: z.number().int().min(0),
  maxAttempts: z.number().int().min(1),
  inputRef: z.record(z.unknown()),
  outputRef: z.record(z.unknown()).nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  startedAt: z.string(),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().int().min(1),
});

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  userId: z.string().min(1),
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  payloadSummary: z.record(z.unknown()),
  ipAddress: z.string().nullable().optional(),
  timestamp: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().int().min(1),
});
