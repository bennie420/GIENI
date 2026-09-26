export type OwnershipStatus =
  | 'DECEDENT_SOLE_OWNER'
  | 'JOINT_TENANCY_WITH_SURVIVOR'
  | 'TENANTS_IN_COMMON'
  | 'TRUST_HELD'
  | 'TRANSFERRED_PRIOR_TO_DEATH'
  | 'UNRESOLVED';

export interface OwnershipAssessment {
  id: string;
  organizationId: string;
  parcelId: string;
  caseId: string;
  countyId: string;
  status: OwnershipStatus;
  ownerNames: string[];
  deedRecordIds: string[];
  verifiedClaimIds: string[];
  notes?: string;
  confidence: number;
  ruleVersion: string;
  evaluatedAt: string;
  evaluatorId: string;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type OwnershipEventType =
  | 'DEED_RECORDING'
  | 'MORTGAGE_RECORDING'
  | 'LIEN_RECORDING'
  | 'PROBATE_ORDER'
  | 'FORECLOSURE'
  | 'RELEASE'
  | 'AFFIDAVIT_OF_DEATH';

export interface OwnershipEvent {
  id: string;
  organizationId: string;
  clientId?: string | null;
  countyId: string;
  parcelId: string;
  eventType: OwnershipEventType;
  instrumentNumber: string;
  recordingDate: string;
  grantorName: string;
  granteeName: string;
  considerationAmount: number | null;
  sourceDocumentId: string;
  verifiedEvidenceId: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

