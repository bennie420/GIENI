import { z } from 'zod';

export const TenantScopeSchema = z.object({
  organizationId: z.string().min(1),
  clientId: z.string().optional(),
  countyId: z.string().optional(),
});

export const BaseEntitySchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const OrganizationEntitySchema = BaseEntitySchema.extend({
  clerkOrgId: z.string().min(1),
  name: z.string().min(1),
  orgType: z.enum(['OPERATOR', 'CLIENT']),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export const ClientTenantSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  contactEmail: z.string().email(),
  webhookUrl: z.string().url().nullable().optional(),
  licensedCounties: z.array(z.string()),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const CountyJurisdictionSchema = BaseEntitySchema.extend({
  countyName: z.string().min(1),
  stateCode: z.string().length(2),
  fipsCode: z.string().min(1),
  courtSystem: z.string().min(1),
  assessorSystem: z.string().min(1),
  recorderSystem: z.string().min(1),
  active: z.boolean(),
});

