"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityScoreSchema = exports.ScoreComponentBreakdownSchema = exports.PriorityBandSchema = void 0;
const zod_1 = require("zod");
exports.PriorityBandSchema = zod_1.z.enum([
    'PRIORITY_A',
    'PRIORITY_B',
    'PRIORITY_C',
    'DISQUALIFIED',
]);
exports.ScoreComponentBreakdownSchema = zod_1.z.object({
    equityComponent: zod_1.z.number().min(0).max(100),
    authorityComponent: zod_1.z.number().min(0).max(100),
    ownershipComponent: zod_1.z.number().min(0).max(100),
    freshnessComponent: zod_1.z.number().min(0).max(100),
    riskPenalty: zod_1.z.number().min(0),
});
exports.OpportunityScoreSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().min(1),
    opportunityId: zod_1.z.string().min(1),
    countyId: zod_1.z.string().min(1),
    equityScore: zod_1.z.number().min(0).max(100),
    authorityScore: zod_1.z.number().min(0).max(100),
    riskScore: zod_1.z.number().min(0),
    compositeScore: zod_1.z.number().min(0).max(100),
    priorityBand: exports.PriorityBandSchema,
    breakdown: exports.ScoreComponentBreakdownSchema,
    ruleVersion: zod_1.z.string().min(1),
    evaluatedAt: zod_1.z.string().datetime(),
    schemaVersion: zod_1.z.number().int().min(1),
});
//# sourceMappingURL=schemas.js.map