"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoRecordsLocatedResultSchema = exports.DeedRecordSchema = exports.DeedTypeSchema = exports.PropertyParcelSchema = exports.ParcelAddressSchema = void 0;
const zod_1 = require("zod");
exports.ParcelAddressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().length(2),
    zipCode: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/),
    county: zod_1.z.string().min(1),
});
exports.PropertyParcelSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().min(1),
    countyId: zod_1.z.string().min(1),
    apn: zod_1.z.string().min(1),
    legalDescription: zod_1.z.string().min(1),
    address: exports.ParcelAddressSchema,
    assessedLandValue: zod_1.z.number().nullable(),
    assessedImprovementValue: zod_1.z.number().nullable(),
    totalAssessedValue: zod_1.z.number().nullable(),
    taxYear: zod_1.z.number().int().min(1900).max(2100).nullable(),
    lastSaleDate: zod_1.z.string().datetime().nullable(),
    lastSalePrice: zod_1.z.number().nullable(),
    verifiedEvidenceIds: zod_1.z.array(zod_1.z.string()),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    schemaVersion: zod_1.z.number().int().min(1),
});
exports.DeedTypeSchema = zod_1.z.enum([
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
exports.DeedRecordSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    parcelId: zod_1.z.string().min(1),
    countyId: zod_1.z.string().min(1),
    instrumentNumber: zod_1.z.string().min(1),
    bookPage: zod_1.z.string().optional(),
    recordingDate: zod_1.z.string().datetime(),
    deedType: exports.DeedTypeSchema,
    grantor: zod_1.z.string().min(1),
    grantee: zod_1.z.string().min(1),
    considerationAmount: zod_1.z.number().nullable(),
    sourceDocumentId: zod_1.z.string().min(1),
    verifiedEvidenceId: zod_1.z.string().min(1),
    createdAt: zod_1.z.string().datetime(),
});
exports.NoRecordsLocatedResultSchema = zod_1.z.object({
    status: zod_1.z.literal('NO_RECORDS_LOCATED'),
    countyId: zod_1.z.string().min(1),
    searchType: zod_1.z.enum(['PARCEL', 'DEED', 'MORTGAGE', 'TAX_ROLL']),
    searchQuery: zod_1.z.record(zod_1.z.unknown()),
    sourcesChecked: zod_1.z.array(zod_1.z.string()).min(1),
    searchedAt: zod_1.z.string().datetime(),
    message: zod_1.z.string().min(1),
});
//# sourceMappingURL=schemas.js.map