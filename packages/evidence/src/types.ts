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
