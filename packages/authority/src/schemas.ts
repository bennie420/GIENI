import { z } from 'zod';

export const FiduciaryRoleSchema = z.enum([
  'EXECUTOR',
  'ADMINISTRATOR',
  'PERSONAL_REPRESENTATIVE',
  'SPECIAL_ADMINISTRATOR',
  'UNAPPOINTED',
  'UNKNOWN',
]);

export const AuthorityStatusSchema = z.enum([
  'CONFIRMED',
  'DISPUTED',
  'UNRESOLVED',
  'NO_APPOINTMENT',
]);

export const AuthorityTierSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

// Anti-pattern detector: reject synthetic Vance fiduciaries
const ProhibitedFiduciaryNames = ['thomas vance', 'theo vance', 'vance'];

export const FiduciaryAppointmentSchema = z.object({
  personId: z.string().nullable(),
  fullName: z
    .string()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const normalized = val.trim().toLowerCase();
        return !ProhibitedFiduciaryNames.some((prohibited) =>
          normalized === prohibited || normalized.startsWith(prohibited + ' ')
        );
      },
      {
        message:
          'Prohibited synthetic placeholder: Never default unlocated fiduciaries to Vance family placeholders. Use null.',
      }
    ),
  role: FiduciaryRoleSchema,
  appointmentDate: z.string().datetime().nullable(),
  lettersIssued: z.boolean(),
  bondAmount: z.number().nullable(),
  verifiedEvidenceId: z.string().nullable(),
});

export const ProbateCaseSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  caseNumber: z.string().min(1),
  decedentName: z.string().min(1),
  dateOfDeath: z.string().datetime().nullable().optional(),
  filingDate: z.string().datetime(),
  caseType: z.string().min(1),
  courtName: z.string().min(1),
  judgeName: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const AuthorityAssessmentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  caseId: z.string().min(1),
  countyId: z.string().min(1),
  status: AuthorityStatusSchema,
  tier: AuthorityTierSchema,
  fiduciary: FiduciaryAppointmentSchema.nullable(),
  verifiedClaimIds: z.array(z.string()),
  rejectionReason: z.string().nullable().optional(),
  evaluatedAt: z.string().datetime(),
  evaluatorId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const EstateRecordSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  caseId: z.string().min(1),
  estateName: z.string().min(1),
  decedentPersonId: z.string().nullable().optional(),
  estimatedGrossValue: z.number().nullable().optional(),
  status: z.enum(['OPEN', 'PROBATE_PENDING', 'CLOSED']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const PersonRecordSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  fullName: z
    .string()
    .min(1)
    .refine(
      (val) => {
        const normalized = val.trim().toLowerCase();
        return !ProhibitedFiduciaryNames.some(
          (prohibited) =>
            normalized === prohibited || normalized.startsWith(prohibited + ' ')
        );
      },
      {
        message:
          'Prohibited synthetic placeholder: Never ingest fictional Vance family names. Represent unlocated persons honestly as null.',
      }
    ),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  isDecedent: z.boolean(),
  isHeir: z.boolean(),
  isFiduciary: z.boolean(),
  isCounsel: z.boolean(),
  verifiedEvidenceIds: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const OrganizationExternalSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  name: z.string().min(1),
  orgType: z.enum([
    'LAW_FIRM',
    'BANK',
    'CORPORATE_FIDUCIARY',
    'TITLE_COMPANY',
    'OTHER',
  ]),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  contactPersonId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const PersonRelationshipSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  subjectType: z.enum(['PERSON', 'ORGANIZATION_EXTERNAL']),
  subjectId: z.string().min(1),
  predicate: z.enum([
    'HEIR_OF',
    'PETITIONER_FOR',
    'ATTORNEY_FOR',
    'FIDUCIARY_FOR',
    'SPOUSE_OF',
    'CHILD_OF',
    'CREDITOR_OF',
  ]),
  targetType: z.enum(['PERSON', 'ESTATE', 'PROBATE_CASE']),
  targetId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  verifiedClaimId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

