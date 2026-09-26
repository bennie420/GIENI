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

