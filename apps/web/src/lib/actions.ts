'use server';

import {
  getMongoDb,
  getTenantScopedRepository,
} from '@gieni/database';
import { Claim, ClaimAuditEvent } from '@gieni/evidence';
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
  const previousStatus = existingClaim?.verificationStatus;

  const updatedClaim = await claimRepo.update(scope, claimId, {
    verificationStatus: 'VERIFIED',
    verifiedBy: verifierId || scope.organizationId,
    verifiedAt: new Date().toISOString(),
  });

  // Record immutable ClaimAuditEvent
  await auditRepo.create(scope, {
    countyId: scope.countyId || 'county_travis_tx',
    claimId,
    eventType: 'VERIFIED',
    previousStatus,
    newStatus: 'VERIFIED',
    actorId: verifierId || scope.organizationId,
    rationale: 'Operator manual verification through Operator Console',
    schemaVersion: 1,
  });


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

