import { z } from 'zod';
export declare const PropertySummarySchema: z.ZodObject<{
    apn: z.ZodString;
    addressText: z.ZodString;
    assessedValue: z.ZodNullable<z.ZodNumber>;
    estimatedEquity: z.ZodNullable<z.ZodNumber>;
    recordsLocated: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    apn: string;
    addressText: string;
    assessedValue: number | null;
    estimatedEquity: number | null;
    recordsLocated: boolean;
}, {
    apn: string;
    addressText: string;
    assessedValue: number | null;
    estimatedEquity: number | null;
    recordsLocated: boolean;
}>;
export declare const OwnershipSummarySchema: z.ZodObject<{
    status: z.ZodEnum<["DECEDENT_SOLE_OWNER", "JOINT_TENANCY_WITH_SURVIVOR", "TENANTS_IN_COMMON", "TRUST_HELD", "TRANSFERRED_PRIOR_TO_DEATH", "UNRESOLVED"]>;
    verifiedOwners: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    status: "UNRESOLVED" | "DECEDENT_SOLE_OWNER" | "JOINT_TENANCY_WITH_SURVIVOR" | "TENANTS_IN_COMMON" | "TRUST_HELD" | "TRANSFERRED_PRIOR_TO_DEATH";
    verifiedOwners: string[];
}, {
    status: "UNRESOLVED" | "DECEDENT_SOLE_OWNER" | "JOINT_TENANCY_WITH_SURVIVOR" | "TENANTS_IN_COMMON" | "TRUST_HELD" | "TRANSFERRED_PRIOR_TO_DEATH";
    verifiedOwners: string[];
}>;
export declare const AuthoritySummarySchema: z.ZodObject<{
    status: z.ZodEnum<["CONFIRMED", "DISPUTED", "UNRESOLVED", "NO_APPOINTMENT"]>;
    tier: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>;
    fiduciaryName: z.ZodNullable<z.ZodString>;
    fiduciaryRole: z.ZodEnum<["EXECUTOR", "ADMINISTRATOR", "PERSONAL_REPRESENTATIVE", "SPECIAL_ADMINISTRATOR", "UNAPPOINTED", "UNKNOWN"]>;
    lettersIssued: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    status: "CONFIRMED" | "DISPUTED" | "UNRESOLVED" | "NO_APPOINTMENT";
    lettersIssued: boolean;
    tier: 1 | 2 | 3 | 4;
    fiduciaryName: string | null;
    fiduciaryRole: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
}, {
    status: "CONFIRMED" | "DISPUTED" | "UNRESOLVED" | "NO_APPOINTMENT";
    lettersIssued: boolean;
    tier: 1 | 2 | 3 | 4;
    fiduciaryName: string | null;
    fiduciaryRole: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
}>;
export declare const ScoringSummarySchema: z.ZodObject<{
    compositeScore: z.ZodNumber;
    priorityBand: z.ZodEnum<["PRIORITY_A", "PRIORITY_B", "PRIORITY_C", "DISQUALIFIED"]>;
    ruleVersion: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ruleVersion: string;
    compositeScore: number;
    priorityBand: "PRIORITY_A" | "PRIORITY_B" | "PRIORITY_C" | "DISQUALIFIED";
}, {
    ruleVersion: string;
    compositeScore: number;
    priorityBand: "PRIORITY_A" | "PRIORITY_B" | "PRIORITY_C" | "DISQUALIFIED";
}>;
export declare const EvidencePointerSchema: z.ZodObject<{
    claimPath: z.ZodString;
    factSummary: z.ZodString;
    sourceDocumentName: z.ZodString;
    pageNumber: z.ZodNumber;
    excerpt: z.ZodString;
    artifactSha256: z.ZodString;
    signedViewUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    claimPath: string;
    factSummary: string;
    sourceDocumentName: string;
    pageNumber: number;
    excerpt: string;
    artifactSha256: string;
    signedViewUrl?: string | undefined;
}, {
    claimPath: string;
    factSummary: string;
    sourceDocumentName: string;
    pageNumber: number;
    excerpt: string;
    artifactSha256: string;
    signedViewUrl?: string | undefined;
}>;
export declare const ProbateOpportunityFileSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    clientId: z.ZodOptional<z.ZodString>;
    countyId: z.ZodString;
    caseNumber: z.ZodString;
    decedentName: z.ZodString;
    filingDate: z.ZodString;
    property: z.ZodObject<{
        apn: z.ZodString;
        addressText: z.ZodString;
        assessedValue: z.ZodNullable<z.ZodNumber>;
        estimatedEquity: z.ZodNullable<z.ZodNumber>;
        recordsLocated: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        apn: string;
        addressText: string;
        assessedValue: number | null;
        estimatedEquity: number | null;
        recordsLocated: boolean;
    }, {
        apn: string;
        addressText: string;
        assessedValue: number | null;
        estimatedEquity: number | null;
        recordsLocated: boolean;
    }>;
    ownership: z.ZodObject<{
        status: z.ZodEnum<["DECEDENT_SOLE_OWNER", "JOINT_TENANCY_WITH_SURVIVOR", "TENANTS_IN_COMMON", "TRUST_HELD", "TRANSFERRED_PRIOR_TO_DEATH", "UNRESOLVED"]>;
        verifiedOwners: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        status: "UNRESOLVED" | "DECEDENT_SOLE_OWNER" | "JOINT_TENANCY_WITH_SURVIVOR" | "TENANTS_IN_COMMON" | "TRUST_HELD" | "TRANSFERRED_PRIOR_TO_DEATH";
        verifiedOwners: string[];
    }, {
        status: "UNRESOLVED" | "DECEDENT_SOLE_OWNER" | "JOINT_TENANCY_WITH_SURVIVOR" | "TENANTS_IN_COMMON" | "TRUST_HELD" | "TRANSFERRED_PRIOR_TO_DEATH";
        verifiedOwners: string[];
    }>;
    authority: z.ZodObject<{
        status: z.ZodEnum<["CONFIRMED", "DISPUTED", "UNRESOLVED", "NO_APPOINTMENT"]>;
        tier: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>;
        fiduciaryName: z.ZodNullable<z.ZodString>;
        fiduciaryRole: z.ZodEnum<["EXECUTOR", "ADMINISTRATOR", "PERSONAL_REPRESENTATIVE", "SPECIAL_ADMINISTRATOR", "UNAPPOINTED", "UNKNOWN"]>;
        lettersIssued: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        status: "CONFIRMED" | "DISPUTED" | "UNRESOLVED" | "NO_APPOINTMENT";
        lettersIssued: boolean;
        tier: 1 | 2 | 3 | 4;
        fiduciaryName: string | null;
        fiduciaryRole: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
    }, {
        status: "CONFIRMED" | "DISPUTED" | "UNRESOLVED" | "NO_APPOINTMENT";
        lettersIssued: boolean;
        tier: 1 | 2 | 3 | 4;
        fiduciaryName: string | null;
        fiduciaryRole: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
    }>;
    scoring: z.ZodObject<{
        compositeScore: z.ZodNumber;
        priorityBand: z.ZodEnum<["PRIORITY_A", "PRIORITY_B", "PRIORITY_C", "DISQUALIFIED"]>;
        ruleVersion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        ruleVersion: string;
        compositeScore: number;
        priorityBand: "PRIORITY_A" | "PRIORITY_B" | "PRIORITY_C" | "DISQUALIFIED";
    }, {
        ruleVersion: string;
        compositeScore: number;
        priorityBand: "PRIORITY_A" | "PRIORITY_B" | "PRIORITY_C" | "DISQUALIFIED";
    }>;
    evidence: z.ZodArray<z.ZodObject<{
        claimPath: z.ZodString;
        factSummary: z.ZodString;
        sourceDocumentName: z.ZodString;
        pageNumber: z.ZodNumber;
        excerpt: z.ZodString;
        artifactSha256: z.ZodString;
        signedViewUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        claimPath: string;
        factSummary: string;
        sourceDocumentName: string;
        pageNumber: number;
        excerpt: string;
        artifactSha256: string;
        signedViewUrl?: string | undefined;
    }, {
        claimPath: string;
        factSummary: string;
        sourceDocumentName: string;
        pageNumber: number;
        excerpt: string;
        artifactSha256: string;
        signedViewUrl?: string | undefined;
    }>, "many">;
    recommendedAction: z.ZodString;
    disclaimer: z.ZodLiteral<"research finding—not legal opinion or title guarantee">;
    publishedAt: z.ZodString;
    schemaVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    organizationId: string;
    countyId: string;
    caseNumber: string;
    decedentName: string;
    filingDate: string;
    schemaVersion: number;
    property: {
        apn: string;
        addressText: string;
        assessedValue: number | null;
        estimatedEquity: number | null;
        recordsLocated: boolean;
    };
    ownership: {
        status: "UNRESOLVED" | "DECEDENT_SOLE_OWNER" | "JOINT_TENANCY_WITH_SURVIVOR" | "TENANTS_IN_COMMON" | "TRUST_HELD" | "TRANSFERRED_PRIOR_TO_DEATH";
        verifiedOwners: string[];
    };
    authority: {
        status: "CONFIRMED" | "DISPUTED" | "UNRESOLVED" | "NO_APPOINTMENT";
        lettersIssued: boolean;
        tier: 1 | 2 | 3 | 4;
        fiduciaryName: string | null;
        fiduciaryRole: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
    };
    scoring: {
        ruleVersion: string;
        compositeScore: number;
        priorityBand: "PRIORITY_A" | "PRIORITY_B" | "PRIORITY_C" | "DISQUALIFIED";
    };
    evidence: {
        claimPath: string;
        factSummary: string;
        sourceDocumentName: string;
        pageNumber: number;
        excerpt: string;
        artifactSha256: string;
        signedViewUrl?: string | undefined;
    }[];
    recommendedAction: string;
    disclaimer: "research finding—not legal opinion or title guarantee";
    publishedAt: string;
    clientId?: string | undefined;
}, {
    id: string;
    organizationId: string;
    countyId: string;
    caseNumber: string;
    decedentName: string;
    filingDate: string;
    schemaVersion: number;
    property: {
        apn: string;
        addressText: string;
        assessedValue: number | null;
        estimatedEquity: number | null;
        recordsLocated: boolean;
    };
    ownership: {
        status: "UNRESOLVED" | "DECEDENT_SOLE_OWNER" | "JOINT_TENANCY_WITH_SURVIVOR" | "TENANTS_IN_COMMON" | "TRUST_HELD" | "TRANSFERRED_PRIOR_TO_DEATH";
        verifiedOwners: string[];
    };
    authority: {
        status: "CONFIRMED" | "DISPUTED" | "UNRESOLVED" | "NO_APPOINTMENT";
        lettersIssued: boolean;
        tier: 1 | 2 | 3 | 4;
        fiduciaryName: string | null;
        fiduciaryRole: "EXECUTOR" | "ADMINISTRATOR" | "PERSONAL_REPRESENTATIVE" | "SPECIAL_ADMINISTRATOR" | "UNAPPOINTED" | "UNKNOWN";
    };
    scoring: {
        ruleVersion: string;
        compositeScore: number;
        priorityBand: "PRIORITY_A" | "PRIORITY_B" | "PRIORITY_C" | "DISQUALIFIED";
    };
    evidence: {
        claimPath: string;
        factSummary: string;
        sourceDocumentName: string;
        pageNumber: number;
        excerpt: string;
        artifactSha256: string;
        signedViewUrl?: string | undefined;
    }[];
    recommendedAction: string;
    disclaimer: "research finding—not legal opinion or title guarantee";
    publishedAt: string;
    clientId?: string | undefined;
}>;
export declare const DeliveryDispatchSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    clientId: z.ZodString;
    opportunityId: z.ZodString;
    targetWebhookUrl: z.ZodString;
    status: z.ZodEnum<["PENDING", "SUCCESS", "FAILED"]>;
    httpStatus: z.ZodNullable<z.ZodNumber>;
    responseBody: z.ZodNullable<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    attemptCount: z.ZodNumber;
    dispatchedAt: z.ZodString;
    acknowledgedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "SUCCESS" | "FAILED";
    id: string;
    organizationId: string;
    opportunityId: string;
    clientId: string;
    targetWebhookUrl: string;
    httpStatus: number | null;
    responseBody: string | null;
    attemptCount: number;
    dispatchedAt: string;
    errorMessage?: string | null | undefined;
    acknowledgedAt?: string | null | undefined;
}, {
    status: "PENDING" | "SUCCESS" | "FAILED";
    id: string;
    organizationId: string;
    opportunityId: string;
    clientId: string;
    targetWebhookUrl: string;
    httpStatus: number | null;
    responseBody: string | null;
    attemptCount: number;
    dispatchedAt: string;
    errorMessage?: string | null | undefined;
    acknowledgedAt?: string | null | undefined;
}>;
export declare const ClientFeedbackSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    clientId: z.ZodString;
    opportunityId: z.ZodString;
    disposition: z.ZodEnum<["CONTACTED", "INVALID", "NOT_INTERESTED", "APPOINTMENT_SET", "DEAL_CLOSED"]>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    submittedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    organizationId: string;
    opportunityId: string;
    clientId: string;
    disposition: "CONTACTED" | "INVALID" | "NOT_INTERESTED" | "APPOINTMENT_SET" | "DEAL_CLOSED";
    submittedAt: string;
    notes?: string | null | undefined;
}, {
    id: string;
    organizationId: string;
    opportunityId: string;
    clientId: string;
    disposition: "CONTACTED" | "INVALID" | "NOT_INTERESTED" | "APPOINTMENT_SET" | "DEAL_CLOSED";
    submittedAt: string;
    notes?: string | null | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map