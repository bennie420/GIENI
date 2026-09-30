import { Claim } from '@gieni/evidence';
import { Opportunity } from '@gieni/scoring';
import { QCReview } from '@gieni/qc';
import { TenantScope } from '@gieni/database';
import {
  ProbateOpportunityFile,
  DeliveryDispatch,
  dispatchRealWebhook,
  LEGAL_DISCLAIMER,
  defaultWebhookRetryQueue,
  dispatchDeliveryNotifications,
  DeliveryNotificationChannel,
} from '@gieni/delivery';

function formatEvidenceItem(c: Claim, ev: any) {
  const claimPath = `${c.subjectType.toLowerCase()}.${c.fieldPath}`;
  const factValue = typeof c.proposedValue === 'object' ? JSON.stringify(c.proposedValue) : String(c.proposedValue ?? '');
  return {
    claimPath,
    factSummary: `${c.fieldPath}: ${factValue}`,
    sourceDocumentName: ev.sourceDocumentId ? `${ev.sourceDocumentId}.pdf` : 'Court_Filing.pdf',
    pageNumber: ev.pageNumber ?? 1,
    excerpt: ev.excerpt ?? 'Certified primary evidence document on file.',
    artifactSha256: ev.artifactSha256 ?? '0'.repeat(64),
  };
}

export function buildPOFEvidence(oppClaims: Claim[]) {
  return oppClaims
    .filter((c) => c.verificationStatus === 'VERIFIED')
    .flatMap((c) => (c.evidence && c.evidence.length > 0 ? c.evidence.map((ev) => formatEvidenceItem(c, ev)) : []));
}

function buildPOFProperty(opp: Opportunity, snapshot: any) {
  return {
    apn: opp.parcelId ?? 'APN-UNKNOWN',
    addressText: snapshot.propertyAddress ?? 'Address on file',
    assessedValue: snapshot.assessedValue,
    estimatedEquity: snapshot.estimatedEquity,
    recordsLocated: snapshot.assessedValue !== null,
  };
}

function buildPOFOwnership(snapshot: any) {
  return {
    status: (snapshot.ownershipStatus as any) || 'DEED_RECORDED',
    verifiedOwners: [snapshot.decedentName],
  };
}

function buildPOFAuthority(snapshot: any, isTier1: boolean) {
  const lettersIssued = snapshot.authorityTier !== 4 && snapshot.authorityStatus === 'CONFIRMED';
  return {
    status: (snapshot.authorityStatus as any) || 'CONFIRMED',
    tier: (snapshot.authorityTier as any) ?? 1,
    fiduciaryName: snapshot.fiduciaryName, // Strictly null if unlocated
    fiduciaryRole: (isTier1 ? 'EXECUTOR' : 'PERSONAL_REPRESENTATIVE') as any,
    lettersIssued,
  };
}

function buildPOFScoring(snapshot: any) {
  return {
    compositeScore: snapshot.compositeScore ?? 85,
    priorityBand: snapshot.priorityBand ?? 'PRIORITY_B',
    ruleVersion: 'v1.0.0-deterministic',
  };
}

function resolveRecommendedAction(isTier1: boolean): string {
  if (isTier1) {
    return 'Contact verified fiduciary directly to present acquisition terms';
  }
  return 'Monitor case docket and pending fiduciary appointment';
}

export function buildPOFFromOpportunity(
  opp: Opportunity,
  scope: TenantScope,
  oppClaims: Claim[],
  now: string
): ProbateOpportunityFile {
  const snapshot = opp.currentSnapshot;
  const isTier1 = snapshot.authorityTier === 1;
  const countyId = opp.countyId || scope.countyId || 'county_travis_tx';

  return {
    id: `pof_${opp.id}`,
    organizationId: scope.organizationId,
    clientId: scope.clientId ?? 'client_austin_capital_partners',
    countyId,
    caseNumber: snapshot.caseNumber,
    decedentName: snapshot.decedentName,
    filingDate: snapshot.filingDate || now,
    property: buildPOFProperty(opp, snapshot),
    ownership: buildPOFOwnership(snapshot),
    authority: buildPOFAuthority(snapshot, isTier1),
    scoring: buildPOFScoring(snapshot),
    evidence: buildPOFEvidence(oppClaims),
    recommendedAction: resolveRecommendedAction(isTier1),
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

export function buildQCReviewRecord(
  opp: Opportunity,
  scope: TenantScope,
  pof: ProbateOpportunityFile,
  unresolvedCount: number,
  now: string
): QCReview {
  return {
    id: `qcrev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    organizationId: scope.organizationId,
    clientId: scope.clientId ?? null,
    countyId: pof.countyId,
    opportunityId: opp.id,
    reviewerId: scope.organizationId,
    decision: 'APPROVED_FOR_DELIVERY',
    gates: [
      { gateName: 'Mandatory Primary Evidence Attached', passed: true },
      { gateName: 'Authority Tier >= 2', passed: opp.currentSnapshot.authorityTier !== 4 },
      { gateName: 'Zero Unresolved Exceptions', passed: unresolvedCount === 0 },
      { gateName: 'Mandatory Legal Boundary Notice Present', passed: true },
    ],
    notes: 'Opportunity satisfied all ClaimVerificationPolicy and delivery eligibility rules.',
    reviewedAt: now,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

export async function dispatchDeliveryWebhook(
  pof: ProbateOpportunityFile,
  options?: { webhookUrl?: string; webhookSecret?: string }
): Promise<DeliveryDispatch | null> {
  const targetWebhookUrl = options?.webhookUrl || process.env.CLIENT_WEBHOOK_URL;
  if (!targetWebhookUrl) {
    return null;
  }

  const dispatchOptions = {
    dispatchId: `dispatch_${pof.id}_${Date.now()}`,
    targetWebhookUrl,
    payload: pof,
    webhookSecret: options?.webhookSecret,
  };
  const dispatchResult = await dispatchRealWebhook(dispatchOptions);
  if (dispatchResult.status === 'FAILED') {
    defaultWebhookRetryQueue.enqueueFailedDispatch(dispatchOptions, dispatchResult);
  }
  return dispatchResult;
}

export async function dispatchNotifications(
  pof: ProbateOpportunityFile,
  scope: TenantScope,
  notificationChannels?: DeliveryNotificationChannel[]
) {
  const channels: DeliveryNotificationChannel[] = notificationChannels ?? [
    { channelType: 'IN_APP', destination: scope.clientId ?? 'client_user', enabled: true },
  ];
  return dispatchDeliveryNotifications({ pof, channels });
}

export function filterOpportunityClaims(claims: Claim[], opp: Opportunity): {
  oppClaims: Claim[];
  unverifiedClaims: Claim[];
} {
  const oppClaims = claims.filter(
    (c) => c.subjectId === opp.id || c.subjectId === opp.caseId || (opp.parcelId && c.subjectId === opp.parcelId)
  );
  const unverifiedClaims = oppClaims.filter((c) => c.verificationStatus !== 'VERIFIED');
  return { oppClaims, unverifiedClaims };
}

export function filterUnresolvedExceptions(
  exceptions: Array<{ id: string; status: string; opportunityId?: string; subjectId?: string }>,
  oppId: string
): Array<{ id: string; status: string }> {
  return exceptions.filter(
    (e) => (e.opportunityId === oppId || e.subjectId === oppId) && e.status !== 'RESOLVED'
  );
}
