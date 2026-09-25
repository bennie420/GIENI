export type ClaimType = 'EXTRACTED' | 'MATCHED' | 'DERIVED' | 'HUMAN_VERIFIED';

export type VerificationStatus = 'PROPOSED' | 'VERIFIED' | 'REJECTED' | 'SUPERSEDED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface SourceDocument {
  id: string;
  organizationId: string;
  countyId: string;
  filename: string;
  mimeType: string;
  storageUri: string;
  artifactSha256: string;
  sourceUrl?: string;
  retrievalTimestamp: string;
  termsNote?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface ClaimEvidence {
  id: string;
  claimId: string;
  sourceDocumentId: string;
  pageNumber: number;
  boundingBox?: BoundingBox;
  excerpt: string;
  sourceLocator: string;
  artifactSha256: string;
  extractionRunId?: string;
  createdAt: string;
}

export interface Claim<T = unknown> {
  id: string;
  organizationId: string;
  clientId?: string;
  countyId: string;
  subjectType: 'PROBATE_CASE' | 'PROPERTY' | 'PERSON' | 'AUTHORITY' | 'OWNERSHIP';
  subjectId: string;
  fieldPath: string;
  proposedValue: T;
  normalizedValue?: T;
  claimType: ClaimType;
  confidence: number;
  verificationStatus: VerificationStatus;
  modelVersion?: string;
  ruleVersion?: string;
  evidence: ClaimEvidence[];
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type ClaimAuditEventType =
  | 'CREATED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'DELIVERED'
  | 'ROLLED_BACK';

export interface ClaimAuditEvent {
  id: string;
  organizationId: string;
  countyId: string;
  clientId?: string;
  claimId: string;
  eventType: ClaimAuditEventType;
  previousStatus?: VerificationStatus;
  newStatus: VerificationStatus | 'DELIVERED' | 'ROLLED_BACK';
  actorId: string;
  rationale?: string;
  evidenceId?: string;
  policyRuleVersion?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type SourceRecordType = 'COURT' | 'ASSESSOR' | 'RECORDER' | 'GIS' | 'TAX';

export interface SourceRecord {
  id: string;
  organizationId: string;
  countyId: string;
  sourceType: SourceRecordType;
  sourceUrl: string;
  retrievalTimestamp: string;
  artifactSha256: string;
  sourceSystem: string;
  rawPayloadLocation: string;
  adapterVersion: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
