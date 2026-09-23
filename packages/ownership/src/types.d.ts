export type OwnershipStatus = 'DECEDENT_SOLE_OWNER' | 'JOINT_TENANCY_WITH_SURVIVOR' | 'TENANTS_IN_COMMON' | 'TRUST_HELD' | 'TRANSFERRED_PRIOR_TO_DEATH' | 'UNRESOLVED';
export interface OwnershipAssessment {
    id: string;
    organizationId: string;
    parcelId: string;
    caseId: string;
    countyId: string;
    status: OwnershipStatus;
    ownerNames: string[];
    deedRecordIds: string[];
    verifiedClaimIds: string[];
    notes?: string;
    confidence: number;
    ruleVersion: string;
    evaluatedAt: string;
    evaluatorId: string;
    schemaVersion: number;
}
//# sourceMappingURL=types.d.ts.map