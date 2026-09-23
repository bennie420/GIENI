"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipAssessmentSchema = exports.OwnershipStatusSchema = void 0;
const zod_1 = require("zod");
exports.OwnershipStatusSchema = zod_1.z.enum([
    'DECEDENT_SOLE_OWNER',
    'JOINT_TENANCY_WITH_SURVIVOR',
    'TENANTS_IN_COMMON',
    'TRUST_HELD',
    'TRANSFERRED_PRIOR_TO_DEATH',
    'UNRESOLVED',
]);
exports.OwnershipAssessmentSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().min(1),
    parcelId: zod_1.z.string().min(1),
    caseId: zod_1.z.string().min(1),
    countyId: zod_1.z.string().min(1),
    status: exports.OwnershipStatusSchema,
    ownerNames: zod_1.z.array(zod_1.z.string()).min(1),
    deedRecordIds: zod_1.z.array(zod_1.z.string()),
    verifiedClaimIds: zod_1.z.array(zod_1.z.string()),
    notes: zod_1.z.string().optional(),
    confidence: zod_1.z.number().min(0).max(1),
    ruleVersion: zod_1.z.string().min(1),
    evaluatedAt: zod_1.z.string().datetime(),
    evaluatorId: zod_1.z.string().min(1),
    schemaVersion: zod_1.z.number().int().min(1),
});
//# sourceMappingURL=schemas.js.map