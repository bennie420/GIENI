export type ExceptionType =
  | 'AUTHORITY_UNRESOLVED'
  | 'NO_RECORD_MATCH'
  | 'TITLE_CONFLICT'
  | 'OCR_CONFIDENCE_LOW'
  | 'DATA_MISMATCH'
  | 'MISSING_MANDATORY_EVIDENCE'
  | 'HIGH_VALUE_AMBIGUITY';

export type ExceptionPriority = 'STANDARD' | 'HIGH' | 'EXPEDITE_SENIOR_REVIEW';

export type ExceptionStatus =
  | 'PENDING_REVIEW'
  | 'IN_RESEARCH'
  | 'RESOLVED'
  | 'REJECTED'
  | 'DISQUALIFIED';

export interface InvestigationException {
  id: string;
  organizationId: string;
  countyId: string;
  opportunityId: string;
  type: ExceptionType;
  status: ExceptionStatus;
  priority?: ExceptionPriority;
  isSoftGate?: boolean;
  estimatedValue?: number | null;
  description: string;
  assignedTo?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}


export interface QCGateResult {
  gateName: string;
  passed: boolean;
  reason?: string;
}

export type QCDecision =
  | 'APPROVED_FOR_DELIVERY'
  | 'REJECTED_TO_EXCEPTION'
  | 'DISQUALIFIED';

export interface QCReview {
  id: string;
  organizationId: string;
  clientId?: string | null;
  countyId: string;
  opportunityId: string;
  reviewerId: string;
  decision: QCDecision;
  gates: QCGateResult[];
  notes?: string | null;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
