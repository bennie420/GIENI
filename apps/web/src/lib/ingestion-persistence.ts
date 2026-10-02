import { getTenantScopedRepository, TenantScope } from '@gieni/database';
import { Claim, SourceDocument } from '@gieni/evidence';
import { ProbateCase, AuthorityAssessment } from '@gieni/authority';
import { PropertyParcel } from '@gieni/property';
import { OwnershipAssessment } from '@gieni/ownership';
import { Opportunity, OpportunityScore } from '@gieni/scoring';
import { InvestigationException } from '@gieni/qc';
import { IngestionRunResult } from '@gieni/county-adapters';

interface BatchPersistOptions<T> {
  repo: any;
  scope: TenantScope;
  countyId: string;
  items: T[];
  keySelector: (item: T) => string;
}

export async function persistBatchIfMissing<T extends { id: string }>(
  options: BatchPersistOptions<T>
): Promise<void> {
  const { repo, scope, countyId, items, keySelector } = options;
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

export async function persistIngestionRunData(
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

  await persistBatchIfMissing({ repo: caseRepo, scope, countyId, items: data.cases, keySelector: (c) => c.caseNumber });
  await persistBatchIfMissing({ repo: docRepo, scope, countyId, items: data.documents, keySelector: (d) => d.artifactSha256 });
  await persistBatchIfMissing({ repo: parcelRepo, scope, countyId, items: data.parcels, keySelector: (p) => p.apn });
  await persistBatchIfMissing({ repo: claimRepo, scope, countyId, items: data.claims, keySelector: (cl) => cl.id });
  await persistBatchIfMissing({ repo: authRepo, scope, countyId, items: data.authorities, keySelector: (a) => a.id });
  await persistBatchIfMissing({ repo: ownRepo, scope, countyId, items: data.ownerships, keySelector: (o) => o.id });
  await persistBatchIfMissing({ repo: scoreRepo, scope, countyId, items: data.scores, keySelector: (s) => s.id });
  await persistBatchIfMissing({ repo: oppRepo, scope, countyId, items: data.opportunities, keySelector: (op) => op.id });
  await persistBatchIfMissing({ repo: excRepo, scope, countyId, items: data.exceptions, keySelector: (e) => e.id });
}
