import { MunicipalIngestionPipeline } from './packages/county-adapters/dist/index.js';
import { getFileTenantScopedRepository } from './packages/database/dist/index.js';

async function seed() {
  const result = await MunicipalIngestionPipeline.execute({
    countyId: 'county_thurston_wa',
    lookbackDays: 90,
    limit: 100,
  });

  const scope = { organizationId: 'org_gieni_internal', countyId: 'county_thurston_wa' };
  const caseRepo = getFileTenantScopedRepository('probateCases');
  const docRepo = getFileTenantScopedRepository('sourceDocuments');
  const parcelRepo = getFileTenantScopedRepository('properties');
  const authRepo = getFileTenantScopedRepository('authorityAssessments');
  const ownRepo = getFileTenantScopedRepository('ownershipAssessments');
  const scoreRepo = getFileTenantScopedRepository('opportunityScores');
  const oppRepo = getFileTenantScopedRepository('opportunities');
  const excRepo = getFileTenantScopedRepository('exceptions');

  for (const c of result.data.cases) {
    const { id, createdAt, updatedAt, organizationId, ...rest } = c;
    await caseRepo.create(scope, { ...rest, countyId: 'county_thurston_wa' });
  }

  for (const doc of result.data.documents) {
    const { id, createdAt, updatedAt, organizationId, ...rest } = doc;
    await docRepo.create(scope, { ...rest, countyId: 'county_thurston_wa' });
  }

  for (const p of result.data.parcels) {
    const { id, createdAt, updatedAt, organizationId, ...rest } = p;
    await parcelRepo.create(scope, { ...rest, countyId: 'county_thurston_wa' });
  }

  for (const a of result.data.authorities) {
    const { id, createdAt, updatedAt, organizationId, ...rest } = a;
    await authRepo.create(scope, { ...rest, countyId: 'county_thurston_wa' });
  }

  for (const o of result.data.ownerships) {
    const { id, createdAt, updatedAt, organizationId, ...rest } = o;
    await ownRepo.create(scope, { ...rest, countyId: 'county_thurston_wa' });
  }

  for (const s of result.data.scores) {
    const { id, createdAt, updatedAt, organizationId, ...rest } = s;
    await scoreRepo.create(scope, { ...rest, countyId: 'county_thurston_wa' });
  }

  for (const op of result.data.opportunities) {
    const { id, createdAt, updatedAt, organizationId, ...rest } = op;
    await oppRepo.create(scope, { ...rest, countyId: 'county_thurston_wa' });
  }

  for (const e of result.data.exceptions) {
    const { id, createdAt, updatedAt, organizationId, ...rest } = e;
    await excRepo.create(scope, { ...rest, countyId: 'county_thurston_wa' });
  }

  console.log('Successfully persisted ' + result.data.cases.length + ' cases and ' + result.data.opportunities.length + ' opportunities to GIENI DB!');
}

seed().catch(console.error);
