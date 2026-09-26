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

export const CanonicalCaseTypeSchema = z.enum([
  'PROBATE_INTESTATE',
  'PROBATE_TESTATE',
  'GUARDIANSHIP',
  'CONSERVATORSHIP',
  'TRUST_DISPUTE',
]);

export const CaseTypeSchema = z.enum([
  'PROBATE_INTESTATE',
  'PROBATE_TESTATE',
  'GUARDIANSHIP',
  'CONSERVATORSHIP',
  'TRUST_DISPUTE',
  'ESTATE_WITH_WILL',
  'INDEPENDENT_ADMINISTRATION',
  'COMMUNITY_PROPERTY_AGREEMENT',
  'FORMAL_PROBATE',
  'INFORMAL_PROBATE',
]);

export const FilingTypeSchema = z.enum([
  'PETITION_FOR_PROBATE',
  'ORDER_APPOINTING_PR',
  'LETTERS_TESTAMENTARY',
  'LETTERS_OF_ADMINISTRATION',
  'INVENTORY_AND_APPRAISEMENT',
  'ANNUAL_ACCOUNTING',
  'NOTICE_TO_CREDITORS',
  'DECREE_OF_DISTRIBUTION',
  'DEED_OF_TRUST',
  'WARRANTY_DEED',
  'LACK_OF_PROBATE_AFFIDAVIT',
  'TRANSFER_ON_DEATH_DEED',
  'COMMUNITY_PROPERTY_AGREEMENT',
  'DOCKET_SUMMARY',
]);

