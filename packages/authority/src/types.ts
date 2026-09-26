export type FiduciaryRole =
  | 'EXECUTOR'
  | 'ADMINISTRATOR'
  | 'PERSONAL_REPRESENTATIVE'
  | 'SPECIAL_ADMINISTRATOR'
  | 'UNAPPOINTED'
  | 'UNKNOWN';

export type AuthorityStatus =
  | 'CONFIRMED'
  | 'DISPUTED'
  | 'UNRESOLVED'
  | 'NO_APPOINTMENT';

export type AuthorityTier = 1 | 2 | 3 | 4;

export interface FiduciaryAppointment {
  personId: string | null;
  fullName: string | null;
  role: FiduciaryRole;
  appointmentDate: string | null;
  lettersIssued: boolean;
  bondAmount: number | null;
  verifiedEvidenceId: string | null;
}

export interface ProbateCase {
  id: string;
  organizationId: string;
  countyId: string;
  caseNumber: string;
  decedentName: string;
  dateOfDeath?: string | null;
  filingDate: string;
  caseType: string;
  courtName: string;
  judgeName?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface AuthorityAssessment {
  id: string;
  organizationId: string;
  caseId: string;
  countyId: string;
  status: AuthorityStatus;
  tier: AuthorityTier;
  // If unlocated or unappointed, fiduciary MUST be null. Never synthetic placeholders.
  fiduciary: FiduciaryAppointment | null;
  verifiedClaimIds: string[];
  rejectionReason?: string | null;
  evaluatedAt: string;
  evaluatorId: string;
  ruleVersion: string;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface EstateRecord {
  id: string;
  organizationId: string;
  clientId?: string | null;
  countyId: string;
  caseId: string;
  estateName: string;
  decedentPersonId?: string | null;
  estimatedGrossValue?: number | null;
  status: 'OPEN' | 'PROBATE_PENDING' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface PersonRecord {
  id: string;
  organizationId: string;
  clientId?: string | null;
  countyId: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  isDecedent: boolean;
  isHeir: boolean;
  isFiduciary: boolean;
  isCounsel: boolean;
  verifiedEvidenceIds: string[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface OrganizationExternal {
  id: string;
  organizationId: string;
  clientId?: string | null;
  countyId: string;
  name: string;
  orgType: 'LAW_FIRM' | 'BANK' | 'CORPORATE_FIDUCIARY' | 'TITLE_COMPANY' | 'OTHER';
  address?: string | null;
  phone?: string | null;
  contactPersonId?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface PersonRelationship {
  id: string;
  organizationId: string;
  clientId?: string | null;
  countyId: string;
  subjectType: 'PERSON' | 'ORGANIZATION_EXTERNAL';
  subjectId: string;
  predicate:
    | 'HEIR_OF'
    | 'PETITIONER_FOR'
    | 'ATTORNEY_FOR'
    | 'FIDUCIARY_FOR'
    | 'SPOUSE_OF'
    | 'CHILD_OF'
    | 'CREDITOR_OF';
  targetType: 'PERSON' | 'ESTATE' | 'PROBATE_CASE';
  targetId: string;
  confidence: number;
  verifiedClaimId?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

