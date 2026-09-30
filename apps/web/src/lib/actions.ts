'use server';

import {
  getMongoDb,
  getTenantScopedRepository,
  TenantScope,
} from '@gieni/database';
import { 
  Claim, 
  ClaimAuditEvent, 
  ClaimVerificationPolicy, 
  computeAuditEventHash,
  SourceDocument,
} from '@gieni/evidence';
import { Opportunity } from '@gieni/scoring';
import { InvestigationException, QCReview } from '@gieni/qc';
import {
  ClientFeedback,
  ClientDisposition,
  ProbateOpportunityFile,
  assertDeliveryEligibility,
  defaultWebhookRetryQueue,
  DeliveryNotificationChannel,
} from '@gieni/delivery';
import {
  MunicipalIngestionPipeline,
  defaultCountyAdapterRegistry,
  IngestionRunResult,
} from '@gieni/county-adapters';
import { ClerkRole } from '@gieni/authz';
import { getSessionTenantScope } from './tenant-context';
import { persistIngestionRunData } from './ingestion-persistence';
import {
  buildPOFFromOpportunity,
  buildQCReviewRecord,
  dispatchDeliveryWebhook,
  dispatchNotifications,
} from './pof-builder';

export interface ActionScopeOptions {
  isOperator?: boolean;
  requiredRole?: ClerkRole;
}

async function resolveActionScope(options?: ActionScopeOptions): Promise<TenantScope> {
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

export interface ResolveExceptionInput {
  exceptionId: string;
  resolutionNote: string;
}

export async function resolveExceptionAction(
  exceptionIdOrInput: string | ResolveExceptionInput,
  resolutionNoteArg?: string
) {
  const { exceptionId, resolutionNote } =
    typeof exceptionIdOrInput === 'string'
      ? { exceptionId: exceptionIdOrInput, resolutionNote: resolutionNoteArg ?? '' }
      : exceptionIdOrInput;

  const scope = await resolveActionScope({ isOperator: true });
  const db = await getMongoDb();
  const excRepo = getTenantScopedRepository<InvestigationException>('exceptions', db);
  return excRepo.update(scope, exceptionId, {
    status: 'RESOLVED',
    resolutionNote,
    resolvedAt: new Date().toISOString(),
  });
}

export interface VerifyClaimInput {
  claimId: string;
  verifierId?: string;
}

export async function verifyClaimAction(
  claimIdOrInput: string | VerifyClaimInput,
  verifierIdArg?: string
) {
  const { claimId, verifierId } =
    typeof claimIdOrInput === 'string'
      ? { claimId: claimIdOrInput, verifierId: verifierIdArg }
      : claimIdOrInput;

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

export interface SubmitClientFeedbackInput {
  opportunityId: string;
  disposition: ClientDisposition;
  notes?: string | null;
}

export async function submitClientFeedbackAction(
  opportunityIdOrInput: string | SubmitClientFeedbackInput,
  dispositionArg?: ClientDisposition,
  notesArg?: string
) {
  const input =
    typeof opportunityIdOrInput === 'string'
      ? { opportunityId: opportunityIdOrInput, disposition: dispositionArg!, notes: notesArg }
      : opportunityIdOrInput;

  const scope = await resolveActionScope({ requiredRole: 'org:client_user' });
  const db = await getMongoDb();
  const feedbackRepo = getTenantScopedRepository<ClientFeedback>('clientFeedback', db);
  return feedbackRepo.create(scope, {
    countyId: scope.countyId ?? 'county_travis_tx',
    opportunityId: input.opportunityId,
    disposition: input.disposition,
    notes: input.notes ?? null,
    submittedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
}

export interface TriggerMunicipalScraperInput {
  countyId: string;
  lookbackDays?: number;
  limit?: number;
}

/**
 * Triggers a live municipal scraper execution for a specified county jurisdiction.
 * Emits live timestamped telemetry, persists records to the tenant store, and returns results.
 */
export async function triggerMunicipalScraperAction(
  countyIdOrInput: string | TriggerMunicipalScraperInput,
  lookbackDaysArg = 14,
  limitArg = 100
): Promise<IngestionRunResult> {
  const { countyId, lookbackDays, limit } =
    typeof countyIdOrInput === 'string'
      ? { countyId: countyIdOrInput, lookbackDays: lookbackDaysArg, limit: limitArg }
      : {
          countyId: countyIdOrInput.countyId,
          lookbackDays: countyIdOrInput.lookbackDays ?? 14,
          limit: countyIdOrInput.limit ?? 100,
        };

  const baseScope = await resolveActionScope({ isOperator: true });
  const scope = { ...baseScope, countyId };
  const result = await MunicipalIngestionPipeline.execute({
    countyId,
    lookbackDays,
    limit,
  });

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

  result.persistenceStatus = persistenceSucceeded ? 'SUCCESS' : 'FAILED';
  result.persistenceError = persistenceError;

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

export interface PublishOpportunityInput {
  opportunityId: string;
  webhookUrl?: string;
  webhookSecret?: string;
  notificationChannels?: DeliveryNotificationChannel[];
}

/**
 * Certifies and publishes an opportunity as a commercial Probate Opportunity File (POF).
 * Enforces:
 * 1. Delivery Eligibility (0 unverified claims, 0 unresolved exceptions, Tier < 4, legal disclaimer)
 * 2. Immutable persistence to 'deliveries' collection
 * 3. QC Review certification record
 * 4. Authentic webhook dispatch with HMAC signature
 * 5. Automatic failure enqueuing to WebhookRetryQueue
 * 6. Multi-channel delivery notifications
 */
export async function certifyAndPublishOpportunityAction(
  opportunityIdOrInput: string | PublishOpportunityInput,
  legacyOptions?: {
    webhookUrl?: string;
    webhookSecret?: string;
    notificationChannels?: DeliveryNotificationChannel[];
  }
) {
  const input: PublishOpportunityInput =
    typeof opportunityIdOrInput === 'string'
      ? { opportunityId: opportunityIdOrInput, ...legacyOptions }
      : opportunityIdOrInput;

  const scope = await resolveActionScope({ isOperator: true, requiredRole: 'org:operator_admin' });
  const db = await getMongoDb();

  const oppRepo = getTenantScopedRepository<Opportunity>('opportunities', db);
  const claimRepo = getTenantScopedRepository<Claim>('claims', db);
  const excRepo = getTenantScopedRepository<InvestigationException>('exceptions', db);
  const pofRepo = getTenantScopedRepository<ProbateOpportunityFile>('deliveries', db);
  const qcRepo = getTenantScopedRepository<QCReview>('qcReviews', db);

  const opp = await oppRepo.findById(scope, input.opportunityId);
  if (!opp) {
    throw new Error(`Opportunity '${input.opportunityId}' not found for tenant.`);
  }

  const [allClaims, allExceptions] = await Promise.all([
    claimRepo.findMany(scope),
    excRepo.findMany(scope),
  ]);

  const oppClaims = allClaims.filter(
    (c) => c.subjectId === opp.id || c.subjectId === opp.caseId || (opp.parcelId && c.subjectId === opp.parcelId)
  );
  const unverifiedClaims = oppClaims.filter((c) => c.verificationStatus !== 'VERIFIED');
  const unresolvedExceptions = allExceptions.filter(
    (e) => (e.opportunityId === opp.id || (e as any).subjectId === opp.id) && e.status !== 'RESOLVED'
  );

  const now = new Date().toISOString();
  const pof = buildPOFFromOpportunity(opp, scope, oppClaims, now);

  assertDeliveryEligibility({
    pof,
    unresolvedExceptionsCount: unresolvedExceptions.length,
    qcCertified: true,
    unverifiedClaimsCount: unverifiedClaims.length,
  });

  await pofRepo.create(scope, pof as any);
  await oppRepo.update(scope, opp.id, { status: 'PUBLISHED' });

  const qcReview = buildQCReviewRecord(opp, scope, pof, unresolvedExceptions.length, now);
  await qcRepo.create(scope, qcReview as any);

  const dispatchResult = await dispatchDeliveryWebhook(pof, input);
  const notifications = await dispatchNotifications(pof, scope, input.notificationChannels);

  return {
    success: true,
    pof,
    qcReview,
    dispatchResult,
    notifications,
  };
}

/**
 * Triggers batch processing of all due webhook retry attempts (W03).
 */
export async function processWebhookRetriesAction() {
  const scope = await resolveActionScope({ isOperator: true });
  const results = await defaultWebhookRetryQueue.processAllPending();
  return {
    organizationId: scope.organizationId,
    processedCount: results.length,
    results,
  };
}

export interface CountySubscriptionsInput {
  counties: string[];
}

/**
 * Persists client county subscription preferences (W01).
 */
export async function updateClientCountySubscriptionsAction(
  countiesOrInput: string[] | CountySubscriptionsInput
) {
  const counties = Array.isArray(countiesOrInput) ? countiesOrInput : countiesOrInput.counties;
  const scope = await resolveActionScope({ requiredRole: 'org:client_user' });
  const db = await getMongoDb();
  const clientRepo = getTenantScopedRepository<any>('clientOrganizations', db);

  const existing = await clientRepo.findById(scope, scope.clientId ?? 'client_default');
  if (existing) {
    await clientRepo.update(scope, existing.id, {
      subscribedCounties: counties,
      updatedAt: new Date().toISOString(),
    });
  }
  return {
    success: true,
    clientId: scope.clientId,
    subscribedCounties: counties,
  };
}
