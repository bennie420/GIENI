import { z } from 'zod';
export declare const ParcelAddressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zipCode: z.ZodString;
    county: z.ZodString;
}, "strip", z.ZodTypeAny, {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
}, {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
}>;
export declare const PropertyParcelSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    countyId: z.ZodString;
    apn: z.ZodString;
    legalDescription: z.ZodString;
    address: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        county: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        county: string;
    }, {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        county: string;
    }>;
    assessedLandValue: z.ZodNullable<z.ZodNumber>;
    assessedImprovementValue: z.ZodNullable<z.ZodNumber>;
    totalAssessedValue: z.ZodNullable<z.ZodNumber>;
    taxYear: z.ZodNullable<z.ZodNumber>;
    lastSaleDate: z.ZodNullable<z.ZodString>;
    lastSalePrice: z.ZodNullable<z.ZodNumber>;
    verifiedEvidenceIds: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    schemaVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    organizationId: string;
    countyId: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
    apn: string;
    legalDescription: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        county: string;
    };
    assessedLandValue: number | null;
    assessedImprovementValue: number | null;
    totalAssessedValue: number | null;
    taxYear: number | null;
    lastSaleDate: string | null;
    lastSalePrice: number | null;
    verifiedEvidenceIds: string[];
}, {
    id: string;
    organizationId: string;
    countyId: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
    apn: string;
    legalDescription: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        county: string;
    };
    assessedLandValue: number | null;
    assessedImprovementValue: number | null;
    totalAssessedValue: number | null;
    taxYear: number | null;
    lastSaleDate: string | null;
    lastSalePrice: number | null;
    verifiedEvidenceIds: string[];
}>;
export declare const DeedTypeSchema: z.ZodEnum<["WARRANTY_DEED", "GRANT_DEED", "QUITCLAIM_DEED", "SPECIAL_WARRANTY_DEED", "DEED_OF_TRUST", "MORTGAGE", "PROBATE_ORDER", "AFFIDAVIT_DEATH_JOINT_TENANT", "OTHER"]>;
export declare const DeedRecordSchema: z.ZodObject<{
    id: z.ZodString;
    parcelId: z.ZodString;
    countyId: z.ZodString;
    instrumentNumber: z.ZodString;
    bookPage: z.ZodOptional<z.ZodString>;
    recordingDate: z.ZodString;
    deedType: z.ZodEnum<["WARRANTY_DEED", "GRANT_DEED", "QUITCLAIM_DEED", "SPECIAL_WARRANTY_DEED", "DEED_OF_TRUST", "MORTGAGE", "PROBATE_ORDER", "AFFIDAVIT_DEATH_JOINT_TENANT", "OTHER"]>;
    grantor: z.ZodString;
    grantee: z.ZodString;
    considerationAmount: z.ZodNullable<z.ZodNumber>;
    sourceDocumentId: z.ZodString;
    verifiedEvidenceId: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    verifiedEvidenceId: string;
    id: string;
    countyId: string;
    createdAt: string;
    parcelId: string;
    instrumentNumber: string;
    recordingDate: string;
    deedType: "WARRANTY_DEED" | "GRANT_DEED" | "QUITCLAIM_DEED" | "SPECIAL_WARRANTY_DEED" | "DEED_OF_TRUST" | "MORTGAGE" | "PROBATE_ORDER" | "AFFIDAVIT_DEATH_JOINT_TENANT" | "OTHER";
    grantor: string;
    grantee: string;
    considerationAmount: number | null;
    sourceDocumentId: string;
    bookPage?: string | undefined;
}, {
    verifiedEvidenceId: string;
    id: string;
    countyId: string;
    createdAt: string;
    parcelId: string;
    instrumentNumber: string;
    recordingDate: string;
    deedType: "WARRANTY_DEED" | "GRANT_DEED" | "QUITCLAIM_DEED" | "SPECIAL_WARRANTY_DEED" | "DEED_OF_TRUST" | "MORTGAGE" | "PROBATE_ORDER" | "AFFIDAVIT_DEATH_JOINT_TENANT" | "OTHER";
    grantor: string;
    grantee: string;
    considerationAmount: number | null;
    sourceDocumentId: string;
    bookPage?: string | undefined;
}>;
export declare const NoRecordsLocatedResultSchema: z.ZodObject<{
    status: z.ZodLiteral<"NO_RECORDS_LOCATED">;
    countyId: z.ZodString;
    searchType: z.ZodEnum<["PARCEL", "DEED", "MORTGAGE", "TAX_ROLL"]>;
    searchQuery: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    sourcesChecked: z.ZodArray<z.ZodString, "many">;
    searchedAt: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "NO_RECORDS_LOCATED";
    message: string;
    countyId: string;
    searchType: "MORTGAGE" | "PARCEL" | "DEED" | "TAX_ROLL";
    searchQuery: Record<string, unknown>;
    sourcesChecked: string[];
    searchedAt: string;
}, {
    status: "NO_RECORDS_LOCATED";
    message: string;
    countyId: string;
    searchType: "MORTGAGE" | "PARCEL" | "DEED" | "TAX_ROLL";
    searchQuery: Record<string, unknown>;
    sourcesChecked: string[];
    searchedAt: string;
}>;
//# sourceMappingURL=schemas.d.ts.map