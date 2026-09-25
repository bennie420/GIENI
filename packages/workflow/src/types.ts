import { BaseEntity } from '@gieni/database';

export type WorkflowStage =
  | 'DOCUMENT_INGEST'
  | 'OCR_LAYOUT'
  | 'PROPOSAL_EXTRACTION'
  | 'PARCEL_MATCH'
  | 'OWNERSHIP_ASSESSMENT'
  | 'AUTHORITY_ASSESSMENT'
  | 'DETERMINISTIC_SCORING'
  | 'QC_GATE'
  | 'DELIVERY';

export type WorkflowStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'DEAD_LETTER';

export interface WorkflowRun extends BaseEntity {
  correlationId?: string | null;
  opportunityId?: string | null;
  caseId?: string | null;
  stage: WorkflowStage;
  status: WorkflowStatus;
  idempotencyKey: string;
  attemptCount: number;
  maxAttempts: number;
  inputRef: Record<string, unknown>;
  outputRef?: Record<string, unknown> | null;
  errorMessage?: string | null;
  startedAt: string;
  completedAt?: string | null;
}

export interface AuditEvent extends BaseEntity {
  correlationId?: string | null;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payloadSummary: Record<string, unknown>;
  ipAddress?: string | null;
  timestamp: string;
}

