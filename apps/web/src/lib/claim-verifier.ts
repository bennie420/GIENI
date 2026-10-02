import {
  Claim,
  ClaimAuditEvent,
  ClaimVerificationPolicy,
  computeAuditEventHash,
  SourceDocument,
} from '@gieni/evidence';
import { InvestigationException } from '@gieni/qc';
import { TenantScope } from '@gieni/database';

export interface ExecuteVerificationParams {
  claim: Claim;
  actorId: string;
  scope: TenantScope;
  docs: SourceDocument[];
  exceptions: InvestigationException[];
  claimRepo: any;
  auditRepo: any;
}

export async function executeClaimVerification(params: ExecuteVerificationParams): Promise<Claim> {
  const { claim, actorId, scope, docs, exceptions, claimRepo, auditRepo } = params;

  const verifiedHashes = new Set<string>(docs.map((d: SourceDocument) => d.artifactSha256).filter(Boolean));

  ClaimVerificationPolicy.assertCompliant(claim, {
    actorId,
    actorRole: 'org:operator_admin',
    verifiedArtifactHashes: verifiedHashes.size > 0 ? verifiedHashes : undefined,
    knownExceptions: exceptions.map((e) => ({
      id: e.id,
      status: e.status,
      subjectId: (e as any).subjectId ?? e.opportunityId,
      type: e.type,
    })),
  });

  const previousStatus = claim.verificationStatus;
  const now = new Date().toISOString();

  const updatedClaim = await claimRepo.update(scope, claim.id, {
    verificationStatus: 'VERIFIED',
    verifiedBy: actorId,
    verifiedAt: now,
  });

  const auditEventData = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    organizationId: scope.organizationId,
    countyId: scope.countyId || 'county_travis_tx',
    claimId: claim.id,
    eventType: 'VERIFIED' as const,
    previousStatus,
    newStatus: 'VERIFIED' as const,
    actorId,
    rationale: 'Operator manual verification through Operator Console satisfying ClaimVerificationPolicy',
    schemaVersion: 1,
    previousAuditHash: null,
    createdAt: now,
    updatedAt: now,
  };

  const auditHash = computeAuditEventHash(auditEventData, null);

  await auditRepo.create(scope, {
    ...auditEventData,
    auditHash,
  });

  return updatedClaim;
}
