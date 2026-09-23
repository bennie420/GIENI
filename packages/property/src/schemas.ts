import { z } from 'zod';

export const ParcelAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  county: z.string().min(1),
});

export const PropertyParcelSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  apn: z.string().min(1),
  legalDescription: z.string().min(1),
  address: ParcelAddressSchema,
  assessedLandValue: z.number().nullable(),
  assessedImprovementValue: z.number().nullable(),
  totalAssessedValue: z.number().nullable(),
  taxYear: z.number().int().min(1900).max(2100).nullable(),
  lastSaleDate: z.string().datetime().nullable(),
  lastSalePrice: z.number().nullable(),
  verifiedEvidenceIds: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const DeedTypeSchema = z.enum([
  'WARRANTY_DEED',
  'GRANT_DEED',
  'QUITCLAIM_DEED',
  'SPECIAL_WARRANTY_DEED',
  'DEED_OF_TRUST',
  'MORTGAGE',
  'PROBATE_ORDER',
  'AFFIDAVIT_DEATH_JOINT_TENANT',
  'OTHER',
]);

export const DeedRecordSchema = z.object({
  id: z.string().min(1),
  parcelId: z.string().min(1),
  countyId: z.string().min(1),
  instrumentNumber: z.string().min(1),
  bookPage: z.string().optional(),
  recordingDate: z.string().datetime(),
  deedType: DeedTypeSchema,
  grantor: z.string().min(1),
  grantee: z.string().min(1),
  considerationAmount: z.number().nullable(),
  sourceDocumentId: z.string().min(1),
  verifiedEvidenceId: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const NoRecordsLocatedResultSchema = z.object({
  status: z.literal('NO_RECORDS_LOCATED'),
  countyId: z.string().min(1),
  searchType: z.enum(['PARCEL', 'DEED', 'MORTGAGE', 'TAX_ROLL']),
  searchQuery: z.record(z.unknown()),
  sourcesChecked: z.array(z.string()).min(1),
  searchedAt: z.string().datetime(),
  message: z.string().min(1),
});
