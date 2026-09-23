"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientFeedbackSchema = exports.DeliveryDispatchSchema = exports.ProbateOpportunityFileSchema = exports.EvidencePointerSchema = exports.ScoringSummarySchema = exports.AuthoritySummarySchema = exports.OwnershipSummarySchema = exports.PropertySummarySchema = void 0;
const zod_1 = require("zod");
const types_js_1 = require("./types.js");
exports.PropertySummarySchema = zod_1.z.object({
    apn: zod_1.z.string().min(1),
    addressText: zod_1.z.string().min(1),
    assessedValue: zod_1.z.number().nullable(),
    estimatedEquity: zod_1.z.number().nullable(),
    recordsLocated: zod_1.z.boolean(),
});
exports.OwnershipSummarySchema = zod_1.z.object({
    status: zod_1.z.enum([
        'DECEDENT_SOLE_OWNER',
        'JOINT_TENANCY_WITH_SURVIVOR',
        'TENANTS_IN_COMMON',
        'TRUST_HELD',
        'TRANSFERRED_PRIOR_TO_DEATH',
        'UNRESOLVED',
    ]),
    verifiedOwners: zod_1.z.array(zod_1.z.string()).min(1),
});
exports.AuthoritySummarySchema = zod_1.z.object({
    status: zod_1.z.enum(['CONFIRMED', 'DISPUTED', 'UNRESOLVED', 'NO_APPOINTMENT']),
    tier: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4)]),
    fiduciaryName: zod_1.z.string().nullable(),
    fiduciaryRole: zod_1.z.enum([
        'EXECUTOR',
        'ADMINISTRATOR',
        'PERSONAL_REPRESENTATIVE',
        'SPECIAL_ADMINISTRATOR',
        'UNAPPOINTED',
        'UNKNOWN',
    ]),
    lettersIssued: zod_1.z.boolean(),
});
exports.ScoringSummarySchema = zod_1.z.object({
    compositeScore: zod_1.z.number().min(0).max(100),
    priorityBand: zod_1.z.enum(['PRIORITY_A', 'PRIORITY_B', 'PRIORITY_C', 'DISQUALIFIED']),
    ruleVersion: zod_1.z.string().min(1),
});
exports.EvidencePointerSchema = zod_1.z.object({
    claimPath: zod_1.z.string().min(1),
    factSummary: zod_1.z.string().min(1),
    sourceDocumentName: zod_1.z.string().min(1),
    pageNumber: zod_1.z.number().int().min(1),
    excerpt: zod_1.z.string().min(1),
    artifactSha256: zod_1.z.string().length(64),
    signedViewUrl: zod_1.z.string().url().optional(),
});
exports.ProbateOpportunityFileSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().min(1),
    clientId: zod_1.z.string().optional(),
    countyId: zod_1.z.string().min(1),
    caseNumber: zod_1.z.string().min(1),
    decedentName: zod_1.z.string().min(1),
    filingDate: zod_1.z.string().datetime(),
    property: exports.PropertySummarySchema,
    ownership: exports.OwnershipSummarySchema,
    authority: exports.AuthoritySummarySchema,
    scoring: exports.ScoringSummarySchema,
    evidence: zod_1.z.array(exports.EvidencePointerSchema).min(1),
    recommendedAction: zod_1.z.string().min(1),
    disclaimer: zod_1.z.literal(types_js_1.LEGAL_DISCLAIMER),
    publishedAt: zod_1.z.string().datetime(),
    schemaVersion: zod_1.z.number().int().min(1),
});
exports.DeliveryDispatchSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().min(1),
    clientId: zod_1.z.string().min(1),
    opportunityId: zod_1.z.string().min(1),
    targetWebhookUrl: zod_1.z.string().url(),
    status: zod_1.z.enum(['PENDING', 'SUCCESS', 'FAILED']),
    httpStatus: zod_1.z.number().nullable(),
    responseBody: zod_1.z.string().nullable(),
    errorMessage: zod_1.z.string().nullable().optional(),
    attemptCount: zod_1.z.number().int().min(1),
    dispatchedAt: zod_1.z.string().datetime(),
    acknowledgedAt: zod_1.z.string().datetime().nullable().optional(),
});
exports.ClientFeedbackSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().min(1),
    clientId: zod_1.z.string().min(1),
    opportunityId: zod_1.z.string().min(1),
    disposition: zod_1.z.enum([
        'CONTACTED',
        'INVALID',
        'NOT_INTERESTED',
        'APPOINTMENT_SET',
        'DEAL_CLOSED',
    ]),
    notes: zod_1.z.string().nullable().optional(),
    submittedAt: zod_1.z.string().datetime(),
});
//# sourceMappingURL=schemas.js.map