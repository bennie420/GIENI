'use server';

import {
  getMongoDb,
  getTenantScopedRepository,
} from '@gieni/database';
import { 
  Claim, 
  ClaimAuditEvent, 
  ClaimVerificationPolicy, 
  computeAuditEventHash,
  SourceDocument,
} from '@gieni/evidence';
import { ProbateCase, AuthorityAssessment } from '@gieni/authority';
import { PropertyParcel } from '@gieni/property';
import { OwnershipAssessment } from '@gieni/ownership';
import { Opportunity, OpportunityScore } from '@gieni/scoring';
import { InvestigationException } from '@gieni/qc';
import { ClientFeedback, ClientDisposition } from '@gieni/delivery';
import {
  MunicipalIngestionPipeline,
  defaultCountyAdapterRegistry,
  IngestionRunResult,
} from '@gieni/county-adapters';
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
        countyId: options?.isOperator ? undefined : 'county_travis_tx',
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

  const docRepo = getTenantScopedRepository<SourceDocument>('sourceDocuments', db);
  const excRepo = getTenantScopedRepository<InvestigationException>('exceptions', db);

  const [docs, exceptions] = await Promise.all([
    docRepo.findMany(scope),
    excRepo.findMany(scope),
  ]);

  const verifiedHashes = new Set<string>(docs.map((d: SourceDocument) => d.artifactSha256).filter(Boolean));

  // Enforce ClaimVerificationPolicy (EI-002)
  const actorId = verifierId || scope.organizationId;
  ClaimVerificationPolicy.assertCompliant(existingClaim, {
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

/**
 * Triggers an authentic municipal docket scraper run via the County Adapter subsystem.
 */
async function persistBatchIfMissing<T extends { id: string }>(
  repo: any,
  scope: TenantScope,
  countyId: string,
  items: T[],
  keySelector: (item: T) => string
): Promise<void> {
  const existing = await repo.findMany(scope);
  const existingKeys = new Set(existing.map(keySelector));

  for (const item of items) {
    if (!existingKeys.has(keySelector(item))) {
      const { id, createdAt, updatedAt, organizationId, ...payload } = item as any;
      await repo.create(scope, {
        ...payload,
        countyId,
      });
    }
  }
}

async function persistIngestionRunData(
  db: any,
  scope: TenantScope,
  countyId: string,
  data: IngestionRunResult['data']
): Promise<void> {
  const caseRepo = getTenantScopedRepository<ProbateCase>('probateCases', db);
  const docRepo = getTenantScopedRepository<SourceDocument & { countyId: string }>('sourceDocuments', db);
  const parcelRepo = getTenantScopedRepository<PropertyParcel>('properties', db);
  const claimRepo = getTenantScopedRepository<Claim>('claims', db);
  const authRepo = getTenantScopedRepository<AuthorityAssessment>('authorityAssessments', db);
  const ownRepo = getTenantScopedRepository<OwnershipAssessment>('ownershipAssessments', db);
  const scoreRepo = getTenantScopedRepository<OpportunityScore>('opportunityScores', db);
  const oppRepo = getTenantScopedRepository<Opportunity>('opportunities', db);
  const excRepo = getTenantScopedRepository<InvestigationException>('exceptions', db);

  await persistBatchIfMissing(caseRepo, scope, countyId, data.cases, (c) => c.caseNumber);
  await persistBatchIfMissing(docRepo, scope, countyId, data.documents, (d) => d.artifactSha256);
  await persistBatchIfMissing(parcelRepo, scope, countyId, data.parcels, (p) => p.apn);
  await persistBatchIfMissing(claimRepo, scope, countyId, data.claims, (cl) => cl.id);
  await persistBatchIfMissing(authRepo, scope, countyId, data.authorities, (a) => a.id);
  await persistBatchIfMissing(ownRepo, scope, countyId, data.ownerships, (o) => o.id);
  await persistBatchIfMissing(scoreRepo, scope, countyId, data.scores, (s) => s.id);
  await persistBatchIfMissing(oppRepo, scope, countyId, data.opportunities, (op) => op.id);
  await persistBatchIfMissing(excRepo, scope, countyId, data.exceptions, (e) => e.id);
}

/**
 * Triggers a live municipal scraper execution for a specified county jurisdiction.
 * Emits live timestamped telemetry, persists records to the tenant store, and returns results.
 */
export async function triggerMunicipalScraperAction(
  countyId: string,
  lookbackDays = 14,
  limit = 100
): Promise<IngestionRunResult> {
  const baseScope = await resolveActionScope({ isOperator: true });
  const scope = { ...baseScope, countyId };
  const result = await MunicipalIngestionPipeline.execute({
    countyId,
    lookbackDays,
    limit,
  });

  // Attempt database persistence (MongoDB Atlas or persistent local store)
  let persistenceSucceeded = false;
  let persistenceError: string | null = null;
  try {
    let db: any = undefined;
    try {
      db = await getMongoDb();
    } catch {
      // Atlas unreachable in local/sandbox, will persist to local store
    }
    await persistIngestionRunData(db, scope, countyId, result.data);
    persistenceSucceeded = true;
  } catch (dbErr: any) {
    persistenceError = dbErr instanceof Error ? dbErr.message : String(dbErr);
    console.warn('[Municipal Ingestion] DB persistence warning:', persistenceError);
  }

  // Record persistence outcome in telemetry event stream
  result.telemetry.push({
    timestamp: new Date().toISOString(),
    stage: 'COMPLETE',
    level: persistenceSucceeded ? 'SUCCESS' : 'WARN',
    message: persistenceSucceeded
      ? `Ingestion run persisted successfully to tenant storage (${scope.organizationId})`
      : `Ingestion run memory-only: Storage persistence failed: ${persistenceError}`,
    details: { persistenceSucceeded, persistenceError },
  });

  return result;
}


/**
 * Queries real-time health, circuit breaker state, and layout drift for all registered county adapters.
 */
export async function getCountyHealthTelemetryAction() {
  const supported = defaultCountyAdapterRegistry.listSupportedCounties();
  const records = [];

  for (const c of supported) {
    const adapter = defaultCountyAdapterRegistry.getAdapter(c.countyId);
    if (!adapter) continue;
    const health = await adapter.getHealthStatus();
    records.push({
      ...health,
      state: adapter.stateCode,
    });
  }

  return records;
}
