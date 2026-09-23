import { z } from 'zod';
export declare const PriorityBandSchema: z.ZodEnum<["PRIORITY_A", "PRIORITY_B", "PRIORITY_C", "DISQUALIFIED"]>;
export declare const ScoreComponentBreakdownSchema: z.ZodObject<{
    equityComponent: z.ZodNumber;
    authorityComponent: z.ZodNumber;
    ownershipComponent: z.ZodNumber;
    freshnessComponent: z.ZodNumber;
    riskPenalty: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    equityComponent: number;
    authorityComponent: number;
    ownershipComponent: number;
    freshnessComponent: number;
    riskPenalty: number;
}, {
    equityComponent: number;
    authorityComponent: number;
    ownershipComponent: number;
    freshnessComponent: number;
    riskPenalty: number;
}>;
export declare const OpportunityScoreSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    opportunityId: z.ZodString;
    countyId: z.ZodString;
    equityScore: z.ZodNumber;
    authorityScore: z.ZodNumber;
    riskScore: z.ZodNumber;
    compositeScore: z.ZodNumber;
    priorityBand: z.ZodEnum<["PRIORITY_A", "PRIORITY_B", "PRIORITY_C", "DISQUALIFIED"]>;
    breakdown: z.ZodObject<{
        equityComponent: z.ZodNumber;
        authorityComponent: z.ZodNumber;
        ownershipComponent: z.ZodNumber;
        freshnessComponent: z.ZodNumber;
        riskPenalty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        equityComponent: number;
        authorityComponent: number;
        ownershipComponent: number;
        freshnessComponent: number;
        riskPenalty: number;
    }, {
        equityComponent: number;
        authorityComponent: number;
        ownershipComponent: number;
        freshnessComponent: number;
        riskPenalty: number;
    }>;
    ruleVersion: z.ZodString;
    evaluatedAt: z.ZodString;
    schemaVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    organizationId: string;
    countyId: string;
    schemaVersion: number;
    evaluatedAt: string;
    ruleVersion: string;
    opportunityId: string;
    equityScore: number;
    authorityScore: number;
    riskScore: number;
    compositeScore: number;
    priorityBand: "PRIORITY_A" | "PRIORITY_B" | "PRIORITY_C" | "DISQUALIFIED";
    breakdown: {
        equityComponent: number;
        authorityComponent: number;
        ownershipComponent: number;
        freshnessComponent: number;
        riskPenalty: number;
    };
}, {
    id: string;
    organizationId: string;
    countyId: string;
    schemaVersion: number;
    evaluatedAt: string;
    ruleVersion: string;
    opportunityId: string;
    equityScore: number;
    authorityScore: number;
    riskScore: number;
    compositeScore: number;
    priorityBand: "PRIORITY_A" | "PRIORITY_B" | "PRIORITY_C" | "DISQUALIFIED";
    breakdown: {
        equityComponent: number;
        authorityComponent: number;
        ownershipComponent: number;
        freshnessComponent: number;
        riskPenalty: number;
    };
}>;
//# sourceMappingURL=schemas.d.ts.map