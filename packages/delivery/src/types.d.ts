import { AuthorityStatus, AuthorityTier, FiduciaryRole } from '@gieni/authority';
import { OwnershipStatus } from '@gieni/ownership';
import { PriorityBand } from '@gieni/scoring';
export declare const LEGAL_DISCLAIMER: "research finding\u2014not legal opinion or title guarantee";
export interface PropertySummary {
    apn: string;
    addressText: string;
    assessedValue: number | null;
    estimatedEquity: number | null;
    recordsLocated: boolean;
}
export interface OwnershipSummary {
    status: OwnershipStatus;
    verifiedOwners: string[];
}
export interface AuthoritySummary {
    status: AuthorityStatus;
    tier: AuthorityTier;
    fiduciaryName: string | null;
    fiduciaryRole: FiduciaryRole;
    lettersIssued: boolean;
}
export interface ScoringSummary {
    compositeScore: number;
    priorityBand: PriorityBand;
    ruleVersion: string;
}
export interface EvidencePointer {
    claimPath: string;
    factSummary: string;
    sourceDocumentName: string;
    pageNumber: number;
    excerpt: string;
    artifactSha256: string;
    signedViewUrl?: string;
}
export interface ProbateOpportunityFile {
    id: string;
    organizationId: string;
    clientId?: string;
    countyId: string;
    caseNumber: string;
    decedentName: string;
    filingDate: string;
    property: PropertySummary;
    ownership: OwnershipSummary;
    authority: AuthoritySummary;
    scoring: ScoringSummary;
    evidence: EvidencePointer[];
    recommendedAction: string;
    disclaimer: typeof LEGAL_DISCLAIMER;
    publishedAt: string;
    schemaVersion: number;
}
export type DeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export interface DeliveryDispatch {
    id: string;
    organizationId: string;
    clientId: string;
    opportunityId: string;
    targetWebhookUrl: string;
    status: DeliveryStatus;
    httpStatus: number | null;
    responseBody: string | null;
    errorMessage?: string | null;
    attemptCount: number;
    dispatchedAt: string;
    acknowledgedAt?: string | null;
}
export type ClientDisposition = 'CONTACTED' | 'INVALID' | 'NOT_INTERESTED' | 'APPOINTMENT_SET' | 'DEAL_CLOSED';
export interface ClientFeedback {
    id: string;
    organizationId: string;
    clientId: string;
    opportunityId: string;
    disposition: ClientDisposition;
    notes?: string | null;
    submittedAt: string;
}
//# sourceMappingURL=types.d.ts.map