import { z } from 'zod';
export declare const FiduciaryRoleSchema: z.ZodEnum<["EXECUTOR", "ADMINISTRATOR", "PERSONAL_REPRESENTATIVE", "SPECIAL_ADMINISTRATOR", "UNAPPOINTED", "UNKNOWN"]>;
export declare const AuthorityStatusSchema: z.ZodEnum<["CONFIRMED", "DISPUTED", "UNRESOLVED", "NO_APPOINTMENT"]>;
export declare const AuthorityTierSchema: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>;
export declare const FiduciaryAppointmentSchema: z.ZodObject<{
    personId: z.ZodNullable<z.ZodString>;
    fullName: z.ZodEffects<z.ZodNullable<z.ZodString>, string | null, string | null>;
    role: z.ZodEnum<["EXECUTOR", "ADMINISTRATOR", "PERSONAL_REPRESENTATIVE", "SPECIAL_ADMINISTRATOR", "UNAPPOINTED", "UNKNOWN"]>;
    appointmentDate: z.ZodNullable<z.ZodString>;
    lettersIssued: z.ZodBoolean;
    bondAmount: z.ZodNullable<z.ZodNumber>;
    verifiedEvidenceId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    personId: string | null;
    fullName: string | null;
    role: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
    appointmentDate: string | null;
    lettersIssued: boolean;
    bondAmount: number | null;
    verifiedEvidenceId: string | null;
}, {
    personId: string | null;
    fullName: string | null;
    role: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
    appointmentDate: string | null;
    lettersIssued: boolean;
    bondAmount: number | null;
    verifiedEvidenceId: string | null;
}>;
export declare const ProbateCaseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    countyId: z.ZodString;
    caseNumber: z.ZodString;
    decedentName: z.ZodString;
    dateOfDeath: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    filingDate: z.ZodString;
    caseType: z.ZodString;
    courtName: z.ZodString;
    judgeName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    schemaVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    organizationId: string;
    countyId: string;
    caseNumber: string;
    decedentName: string;
    filingDate: string;
    caseType: string;
    courtName: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
    dateOfDeath?: string | null | undefined;
    judgeName?: string | null | undefined;
}, {
    id: string;
    organizationId: string;
    countyId: string;
    caseNumber: string;
    decedentName: string;
    filingDate: string;
    caseType: string;
    courtName: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
    dateOfDeath?: string | null | undefined;
    judgeName?: string | null | undefined;
}>;
export declare const AuthorityAssessmentSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    caseId: z.ZodString;
    countyId: z.ZodString;
    status: z.ZodEnum<["CONFIRMED", "DISPUTED", "UNRESOLVED", "NO_APPOINTMENT"]>;
    tier: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>;
    fiduciary: z.ZodNullable<z.ZodObject<{
        personId: z.ZodNullable<z.ZodString>;
        fullName: z.ZodEffects<z.ZodNullable<z.ZodString>, string | null, string | null>;
        role: z.ZodEnum<["EXECUTOR", "ADMINISTRATOR", "PERSONAL_REPRESENTATIVE", "SPECIAL_ADMINISTRATOR", "UNAPPOINTED", "UNKNOWN"]>;
        appointmentDate: z.ZodNullable<z.ZodString>;
        lettersIssued: z.ZodBoolean;
        bondAmount: z.ZodNullable<z.ZodNumber>;
        verifiedEvidenceId: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        personId: string | null;
        fullName: string | null;
        role: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
        appointmentDate: string | null;
        lettersIssued: boolean;
        bondAmount: number | null;
        verifiedEvidenceId: string | null;
    }, {
        personId: string | null;
        fullName: string | null;
        role: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
        appointmentDate: string | null;
        lettersIssued: boolean;
        bondAmount: number | null;
        verifiedEvidenceId: string | null;
    }>>;
    verifiedClaimIds: z.ZodArray<z.ZodString, "many">;
    rejectionReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    evaluatedAt: z.ZodString;
    evaluatorId: z.ZodString;
    ruleVersion: z.ZodString;
    schemaVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "CONFIRMED" | "DISPUTED" | "UNRESOLVED" | "NO_APPOINTMENT";
    id: string;
    organizationId: string;
    countyId: string;
    schemaVersion: number;
    caseId: string;
    tier: 1 | 2 | 3 | 4;
    fiduciary: {
        personId: string | null;
        fullName: string | null;
        role: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
        appointmentDate: string | null;
        lettersIssued: boolean;
        bondAmount: number | null;
        verifiedEvidenceId: string | null;
    } | null;
    verifiedClaimIds: string[];
    evaluatedAt: string;
    evaluatorId: string;
    ruleVersion: string;
    rejectionReason?: string | null | undefined;
}, {
    status: "CONFIRMED" | "DISPUTED" | "UNRESOLVED" | "NO_APPOINTMENT";
    id: string;
    organizationId: string;
    countyId: string;
    schemaVersion: number;
    caseId: string;
    tier: 1 | 2 | 3 | 4;
    fiduciary: {
        personId: string | null;
        fullName: string | null;
        role: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
        appointmentDate: string | null;
        lettersIssued: boolean;
        bondAmount: number | null;
        verifiedEvidenceId: string | null;
    } | null;
    verifiedClaimIds: string[];
    evaluatedAt: string;
    evaluatorId: string;
    ruleVersion: string;
    rejectionReason?: string | null | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map