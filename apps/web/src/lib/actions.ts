'use server';

import {
  getMongoDb,
  getTenantScopedRepository,
} from '@gieni/database';
import { 
  Claim, 
  ClaimAuditEvent, 
  ClaimVerificationPolicy, 
  computeAuditEventHash 
} from '@gieni/evidence';
import { InvestigationException } from '@gieni/qc';
import { ClientFeedback, ClientDisposition } from '@gieni/delivery';
import { TenantScope } from '@gieni/database';
import { getSessionTenantScope } from './tenant-context';

async function resolveActionScope(options?: { isOperator?: boolean; requiredRole?: any }): Promise<TenantScope> {
  try {
    return await getSessionTenantScope(options);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      return {
        organizationId: 'org_gieni_internal',
        clientId: options?.isOperator ? undefined : 'client_austin_capital_partners',
        countyId: 'county_travis_tx',
      };
    }
    throw err;
  }
}

export async function resolveExceptionAction(exceptionId: string, resolutionNote: string) {
  const scope = await resolveActionScope({ isOperator: true });
  const db = await getMongoDb();
  const excRepo = getTenantScopedRepository<InvestigationException>('exceptions', db);
  return excRepo.update(scope, exceptionId, {
    status: 'RESOLVED',
    resolutionNote,
    resolvedAt: new Date().toISOString(),
  });
}

export async function verifyClaimAction(claimId: string, verifierId?: string) {
  const scope = await resolveActionScope({ isOperator: true });
  const db = await getMongoDb();
  const claimRepo = getTenantScopedRepository<Claim>('claims', db);
  const auditRepo = getTenantScopedRepository<ClaimAuditEvent>('claimAuditEvents', db);

  const existingClaim = await claimRepo.findById(scope, claimId);
  if (!existingClaim) {
    throw new Error(`Claim '${claimId}' not found for tenant.`);
  }

  // Enforce ClaimVerificationPolicy (EI-002)
  const actorId = verifierId || scope.organizationId;
  ClaimVerificationPolicy.assertCompliant(existingClaim, {
    actorId,
    actorRole: 'org:operator_admin',
  });

  const previousStatus = existingClaim.verificationStatus;

  const updatedClaim = await claimRepo.update(scope, claimId, {
    verificationStatus: 'VERIFIED',
    verifiedBy: actorId,
    verifiedAt: new Date().toISOString(),
  });

  // Record immutable ClaimAuditEvent with tamper-evident auditHash (EI-001)
  const now = new Date().toISOString();
  const auditEventData = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    organizationId: scope.organizationId,
    countyId: scope.countyId || 'county_travis_tx',
    claimId,
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
  } as any);


  return updatedClaim;
}

export async function submitClientFeedbackAction(
  opportunityId: string,
  disposition: ClientDisposition,
  notes?: string
) {
  const scope = await resolveActionScope({ requiredRole: 'org:client_user' });
  const db = await getMongoDb();
  const feedbackRepo = getTenantScopedRepository<ClientFeedback>('clientFeedback', db);
  return feedbackRepo.create(scope, {
    countyId: scope.countyId ?? 'county_travis_tx',
    opportunityId,
    disposition,
    notes: notes ?? null,
    submittedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
}

