'use server';

import {
  getMongoDb,
  getTenantScopedRepository,
} from '@gieni/database';
import { Claim } from '@gieni/evidence';
import { InvestigationException } from '@gieni/qc';
import { ClientFeedback, ClientDisposition } from '@gieni/delivery';
import { OPERATOR_SCOPE, CLIENT_SCOPE } from './data';

export async function resolveExceptionAction(exceptionId: string, resolutionNote: string) {
  const db = await getMongoDb();
  const excRepo = getTenantScopedRepository<InvestigationException>('exceptions', db);
  return excRepo.update(OPERATOR_SCOPE, exceptionId, {
    status: 'RESOLVED',
    resolutionNote,
    resolvedAt: new Date().toISOString(),
  });
}

export async function verifyClaimAction(claimId: string, verifierId = 'operator_user') {
  const db = await getMongoDb();
  const claimRepo = getTenantScopedRepository<Claim>('claims', db);
  return claimRepo.update(OPERATOR_SCOPE, claimId, {
    verificationStatus: 'VERIFIED',
    verifiedBy: verifierId,
    verifiedAt: new Date().toISOString(),
  });
}

export async function submitClientFeedbackAction(
  opportunityId: string,
  disposition: ClientDisposition,
  notes?: string
) {
  const db = await getMongoDb();
  const feedbackRepo = getTenantScopedRepository<ClientFeedback>('clientFeedback', db);
  return feedbackRepo.create(CLIENT_SCOPE, {
    countyId: CLIENT_SCOPE.countyId ?? 'county_travis_tx',
    opportunityId,
    disposition,
    notes: notes ?? null,
    submittedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
}
