export type FiduciaryRole = 'EXECUTOR' | 'ADMINISTRATOR' | 'PERSONAL_REPRESENTATIVE' | 'SPECIAL_ADMINISTRATOR' | 'UNAPPOINTED' | 'UNKNOWN';
export type AuthorityStatus = 'CONFIRMED' | 'DISPUTED' | 'UNRESOLVED' | 'NO_APPOINTMENT';
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
    fiduciary: FiduciaryAppointment | null;
    verifiedClaimIds: string[];
    rejectionReason?: string | null;
    evaluatedAt: string;
    evaluatorId: string;
    ruleVersion: string;
    schemaVersion: number;
}
//# sourceMappingURL=types.d.ts.map