"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorityAssessmentSchema = exports.ProbateCaseSchema = exports.FiduciaryAppointmentSchema = exports.AuthorityTierSchema = exports.AuthorityStatusSchema = exports.FiduciaryRoleSchema = void 0;
const zod_1 = require("zod");
exports.FiduciaryRoleSchema = zod_1.z.enum([
    'EXECUTOR',
    'ADMINISTRATOR',
    'PERSONAL_REPRESENTATIVE',
    'SPECIAL_ADMINISTRATOR',
    'UNAPPOINTED',
    'UNKNOWN',
]);
exports.AuthorityStatusSchema = zod_1.z.enum([
    'CONFIRMED',
    'DISPUTED',
    'UNRESOLVED',
    'NO_APPOINTMENT',
]);
exports.AuthorityTierSchema = zod_1.z.union([
    zod_1.z.literal(1),
    zod_1.z.literal(2),
    zod_1.z.literal(3),
    zod_1.z.literal(4),
]);
// Anti-pattern detector: reject synthetic Vance fiduciaries
const ProhibitedFiduciaryNames = ['thomas vance', 'theo vance', 'vance'];
exports.FiduciaryAppointmentSchema = zod_1.z.object({
    personId: zod_1.z.string().nullable(),
    fullName: zod_1.z
        .string()
        .nullable()
        .refine((val) => {
        if (!val)
            return true;
        const normalized = val.trim().toLowerCase();
        return !ProhibitedFiduciaryNames.some((prohibited) => normalized === prohibited || normalized.startsWith(prohibited + ' '));
    }, {
        message: 'Prohibited synthetic placeholder: Never default unlocated fiduciaries to Vance family placeholders. Use null.',
    }),
    role: exports.FiduciaryRoleSchema,
    appointmentDate: zod_1.z.string().datetime().nullable(),
    lettersIssued: zod_1.z.boolean(),
    bondAmount: zod_1.z.number().nullable(),
    verifiedEvidenceId: zod_1.z.string().nullable(),
});
exports.ProbateCaseSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().min(1),
    countyId: zod_1.z.string().min(1),
    caseNumber: zod_1.z.string().min(1),
    decedentName: zod_1.z.string().min(1),
    dateOfDeath: zod_1.z.string().datetime().nullable().optional(),
    filingDate: zod_1.z.string().datetime(),
    caseType: zod_1.z.string().min(1),
    courtName: zod_1.z.string().min(1),
    judgeName: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    schemaVersion: zod_1.z.number().int().min(1),
});
exports.AuthorityAssessmentSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().min(1),
    caseId: zod_1.z.string().min(1),
    countyId: zod_1.z.string().min(1),
    status: exports.AuthorityStatusSchema,
    tier: exports.AuthorityTierSchema,
    fiduciary: exports.FiduciaryAppointmentSchema.nullable(),
    verifiedClaimIds: zod_1.z.array(zod_1.z.string()),
    rejectionReason: zod_1.z.string().nullable().optional(),
    evaluatedAt: zod_1.z.string().datetime(),
    evaluatorId: zod_1.z.string().min(1),
    ruleVersion: zod_1.z.string().min(1),
    schemaVersion: zod_1.z.number().int().min(1),
});
//# sourceMappingURL=schemas.js.map