export interface TenantScope {
  organizationId: string;
  clientId?: string;
  countyId?: string;
}

export interface BaseEntity {
  id: string;
  organizationId: string;
  clientId?: string | null;
  countyId: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface OrganizationEntity extends BaseEntity {
  clerkOrgId: string;
  name: string;
  orgType: 'OPERATOR' | 'CLIENT';
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface ClientTenant extends BaseEntity {
  name: string;
  contactEmail: string;
  webhookUrl?: string | null;
  licensedCounties: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CountyJurisdiction extends BaseEntity {
  countyName: string;
  stateCode: string;
  fipsCode: string;
  courtSystem: string;
  assessorSystem: string;
  recorderSystem: string;
  active: boolean;
}

export type CanonicalCaseType =
  | 'PROBATE_INTESTATE'
  | 'PROBATE_TESTATE'
  | 'GUARDIANSHIP'
  | 'CONSERVATORSHIP'
  | 'TRUST_DISPUTE';

export type CaseType =
  | CanonicalCaseType
  | 'ESTATE_WITH_WILL'
  | 'INDEPENDENT_ADMINISTRATION'
  | 'COMMUNITY_PROPERTY_AGREEMENT'
  | 'FORMAL_PROBATE'
  | 'INFORMAL_PROBATE';

export type FilingType =
  | 'PETITION_FOR_PROBATE'
  | 'ORDER_APPOINTING_PR'
  | 'LETTERS_TESTAMENTARY'
  | 'LETTERS_OF_ADMINISTRATION'
  | 'INVENTORY_AND_APPRAISEMENT'
  | 'ANNUAL_ACCOUNTING'
  | 'NOTICE_TO_CREDITORS'
  | 'DECREE_OF_DISTRIBUTION'
  | 'DEED_OF_TRUST'
  | 'WARRANTY_DEED'
  | 'LACK_OF_PROBATE_AFFIDAVIT'
  | 'TRANSFER_ON_DEATH_DEED'
  | 'COMMUNITY_PROPERTY_AGREEMENT'
  | 'DOCKET_SUMMARY';

