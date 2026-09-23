export interface ParcelAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
}

export interface PropertyParcel {
  id: string;
  organizationId: string;
  countyId: string;
  apn: string; // Assessor's Parcel Number
  legalDescription: string;
  address: ParcelAddress;
  assessedLandValue: number | null;
  assessedImprovementValue: number | null;
  totalAssessedValue: number | null;
  taxYear: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  verifiedEvidenceIds: string[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type DeedType =
  | 'WARRANTY_DEED'
  | 'GRANT_DEED'
  | 'QUITCLAIM_DEED'
  | 'SPECIAL_WARRANTY_DEED'
  | 'DEED_OF_TRUST'
  | 'MORTGAGE'
  | 'PROBATE_ORDER'
  | 'AFFIDAVIT_DEATH_JOINT_TENANT'
  | 'OTHER';

export interface DeedRecord {
  id: string;
  parcelId: string;
  countyId: string;
  instrumentNumber: string;
  bookPage?: string;
  recordingDate: string;
  deedType: DeedType;
  grantor: string;
  grantee: string;
  considerationAmount: number | null;
  sourceDocumentId: string;
  verifiedEvidenceId: string;
  createdAt: string;
}

export interface NoRecordsLocatedResult {
  status: 'NO_RECORDS_LOCATED';
  countyId: string;
  searchType: 'PARCEL' | 'DEED' | 'MORTGAGE' | 'TAX_ROLL';
  searchQuery: Record<string, unknown>;
  sourcesChecked: string[];
  searchedAt: string;
  message: string;
}

export type RecordSearchResult<T> =
  | { status: 'FOUND'; data: T }
  | NoRecordsLocatedResult;
