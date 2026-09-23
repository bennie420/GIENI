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
