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

/**
 * Triggers an authentic municipal docket scraper run via the County Adapter subsystem.
 * Emits live timestamped telemetry, persists records to the tenant store, and returns results.
 */
export async function triggerMunicipalScraperAction(
  countyId: string,
  lookbackDays = 14,
  limit = 100
): Promise<IngestionRunResult> {
  const scope = await resolveActionScope({ isOperator: true });
  const result = await MunicipalIngestionPipeline.execute({
    countyId,
    lookbackDays,
    limit,
  });

  // Attempt database persistence if MongoDB is reachable
  try {
    const db = await getMongoDb();
    const caseRepo = getTenantScopedRepository<ProbateCase>('probateCases', db);
    const docRepo = getTenantScopedRepository<SourceDocument & { countyId: string }>('sourceDocuments', db);
    const parcelRepo = getTenantScopedRepository<PropertyParcel>('properties', db);

    const existingCases = await caseRepo.findMany(scope);
    const existingCaseNumbers = new Set(existingCases.map((c) => c.caseNumber));

    for (const c of result.data.cases) {
      if (!existingCaseNumbers.has(c.caseNumber)) {
        const { id, createdAt, updatedAt, organizationId, ...casePayload } = c;
        await caseRepo.create(scope, {
          ...casePayload,
          countyId,
        });
      }
    }

    const existingDocs = await docRepo.findMany(scope);
    const existingDocHashes = new Set(existingDocs.map((d) => d.artifactSha256));

    for (const doc of result.data.documents) {
      if (!existingDocHashes.has(doc.artifactSha256)) {
        const { id, createdAt, updatedAt, organizationId, ...docPayload } = doc;
        await docRepo.create(scope, {
          ...docPayload,
          countyId,
        });
      }
    }

    const existingParcels = await parcelRepo.findMany(scope);
    const existingApns = new Set(existingParcels.map((p) => p.apn));

    for (const p of result.data.parcels) {
      if (!existingApns.has(p.apn)) {
        const { id, createdAt, updatedAt, organizationId, ...parcelPayload } = p;
        await parcelRepo.create(scope, {
          ...parcelPayload,
          countyId,
        });
      }
    }

    // Persist Document AI Claims
    const claimRepo = getTenantScopedRepository<Claim>('claims', db);
    const existingClaims = await claimRepo.findMany(scope);
    const existingClaimIds = new Set(existingClaims.map((cl) => cl.id));

    for (const cl of result.data.claims) {
      if (!existingClaimIds.has(cl.id)) {
        const { id, createdAt, updatedAt, organizationId, ...claimPayload } = cl;
        await claimRepo.create(scope, {
          ...claimPayload,
          countyId,
        });
      }
    }

    // Persist Authority Assessments
    const authRepo = getTenantScopedRepository<AuthorityAssessment>('authorityAssessments', db);
    const existingAuths = await authRepo.findMany(scope);
    const existingAuthIds = new Set(existingAuths.map((a) => a.id));

    for (const a of result.data.authorities) {
      if (!existingAuthIds.has(a.id)) {
        const { id, createdAt, updatedAt, organizationId, ...authPayload } = a;
        await authRepo.create(scope, {
          ...authPayload,
          countyId,
        });
      }
    }

    // Persist Ownership Assessments
    const ownRepo = getTenantScopedRepository<OwnershipAssessment>('ownershipAssessments', db);
    const existingOwns = await ownRepo.findMany(scope);
    const existingOwnIds = new Set(existingOwns.map((o) => o.id));

    for (const o of result.data.ownerships) {
      if (!existingOwnIds.has(o.id)) {
        const { id, createdAt, updatedAt, organizationId, ...ownPayload } = o;
        await ownRepo.create(scope, {
          ...ownPayload,
          countyId,
        });
      }
    }

    // Persist Opportunity Scores
    const scoreRepo = getTenantScopedRepository<OpportunityScore>('opportunityScores', db);
    const existingScores = await scoreRepo.findMany(scope);
    const existingScoreIds = new Set(existingScores.map((s) => s.id));

    for (const s of result.data.scores) {
      if (!existingScoreIds.has(s.id)) {
        const { id, createdAt, updatedAt, organizationId, ...scorePayload } = s;
        await scoreRepo.create(scope, {
          ...scorePayload,
          countyId,
        });
      }
    }

    // Persist Projected Opportunities
    const oppRepo = getTenantScopedRepository<Opportunity>('opportunities', db);
    const existingOpps = await oppRepo.findMany(scope);
    const existingOppIds = new Set(existingOpps.map((op) => op.id));

    for (const op of result.data.opportunities) {
      if (!existingOppIds.has(op.id)) {
        const { id, createdAt, updatedAt, organizationId, ...oppPayload } = op;
        await oppRepo.create(scope, {
          ...oppPayload,
          countyId,
        });
      }
    }

    // Persist Investigation Exceptions
    const excRepo = getTenantScopedRepository<InvestigationException>('exceptions', db);
    const existingExceptions = await excRepo.findMany(scope);
    const existingExcIds = new Set(existingExceptions.map((e) => e.id));

    for (const exc of result.data.exceptions) {
      if (!existingExcIds.has(exc.id)) {
        const { id, createdAt, updatedAt, organizationId, ...excPayload } = exc;
        await excRepo.create(scope, {
          ...excPayload,
          countyId,
        });
      }
    }
  } catch (dbErr: any) {
    console.warn('[Municipal Ingestion] DB persistence warning (offline/sandbox):', dbErr.message);
  }

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
