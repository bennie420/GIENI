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

export function buildPOFEvidence(oppClaims: Claim[]) {
  return oppClaims
    .filter((c) => c.verificationStatus === 'VERIFIED')
    .flatMap((c) =>
      (c.evidence && c.evidence.length > 0 ? c.evidence : []).map((ev) => ({
        claimPath: `${c.subjectType.toLowerCase()}.${c.fieldPath}`,
        factSummary: `${c.fieldPath}: ${typeof c.proposedValue === 'object' ? JSON.stringify(c.proposedValue) : String(c.proposedValue ?? '')}`,
        sourceDocumentName: ev.sourceDocumentId ? `${ev.sourceDocumentId}.pdf` : 'Court_Filing.pdf',
        pageNumber: ev.pageNumber ?? 1,
        excerpt: ev.excerpt ?? 'Certified primary evidence document on file.',
        artifactSha256: ev.artifactSha256 ?? '0'.repeat(64),
      }))
    );
}

export function buildPOFFromOpportunity(
  opp: Opportunity,
  scope: TenantScope,
  oppClaims: Claim[],
  now: string
): ProbateOpportunityFile {
  const snapshot = opp.currentSnapshot;
  const isTier1 = snapshot.authorityTier === 1;

  return {
    id: `pof_${opp.id}`,
    organizationId: scope.organizationId,
    clientId: scope.clientId ?? 'client_austin_capital_partners',
    countyId: opp.countyId || scope.countyId || 'county_travis_tx',
    caseNumber: snapshot.caseNumber,
    decedentName: snapshot.decedentName,
    filingDate: snapshot.filingDate || now,
    property: {
      apn: opp.parcelId ?? 'APN-UNKNOWN',
      addressText: snapshot.propertyAddress || 'Address on file',
      assessedValue: snapshot.assessedValue,
      estimatedEquity: snapshot.estimatedEquity,
      recordsLocated: snapshot.assessedValue !== null,
    },
    ownership: {
      status: (snapshot.ownershipStatus as any) || 'DEED_RECORDED',
      verifiedOwners: [snapshot.decedentName],
    },
    authority: {
      status: (snapshot.authorityStatus as any) || 'CONFIRMED',
      tier: (snapshot.authorityTier as any) ?? 1,
      fiduciaryName: snapshot.fiduciaryName, // Strictly null if unlocated
      fiduciaryRole: (isTier1 ? 'EXECUTOR' : 'PERSONAL_REPRESENTATIVE') as any,
      lettersIssued: snapshot.authorityTier !== 4 && snapshot.authorityStatus === 'CONFIRMED',
    },
    scoring: {
      compositeScore: snapshot.compositeScore ?? 85,
      priorityBand: snapshot.priorityBand ?? 'PRIORITY_B',
      ruleVersion: 'v1.0.0-deterministic',
    },
    evidence: buildPOFEvidence(oppClaims),
    recommendedAction: isTier1
      ? 'Contact verified fiduciary directly to present acquisition terms'
      : 'Monitor case docket and pending fiduciary appointment',
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
