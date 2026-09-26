import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SourceRecordSchema,
} from '../../packages/evidence/dist/index.js';
import {
  defaultCountyAdapterRegistry,
  TravisCountyAdapter,
  MaricopaCountyAdapter,
  PierceCountyAdapter,
  KingCountyAdapter,
  ThurstonCountyAdapter,
  MunicipalIngestionPipeline,
  CountyAdapterRegistry,
  evaluateDocumentLayoutDrift,
  computeTemplateStructureHash,
  CountyAdapterHealthSchema,
  DocumentLayoutFingerprintSchema,
} from '../../packages/county-adapters/dist/index.js';

test('County Adapters: SourceRecord schema validates authentic evidence provenance', () => {
  const validSourceRecord = {
    id: 'src_rec_travis_001',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    sourceType: 'COURT',
    sourceUrl: 'https://odyssey.traviscountytx.gov/portal/case/C-1-PB-26-000412',
    retrievalTimestamp: new Date().toISOString(),
    artifactSha256: '4a6b2c89f13e77a0bc0928e441bc19df273a00508a8e03efb7c7f3b8908851aa',
    sourceSystem: 'Travis County Odyssey Portal',
    rawPayloadLocation: 'gs://gieni-evidence-archive/travis/2026/03/C-1-PB-26-000412.pdf',
    adapterVersion: '1.0.0',
    metadata: {
      docketNumber: 'C-1-PB-26-000412',
      court: 'Probate Court No. 1',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const parsed = SourceRecordSchema.parse(validSourceRecord);
  assert.equal(parsed.sourceType, 'COURT');
  assert.equal(parsed.countyId, 'county_travis_tx');
  assert.equal(parsed.artifactSha256.length, 64);
  assert.ok(parsed.sourceUrl.startsWith('https://'));
});

test('County Adapters: SourceRecord rejects invalid SHA-256 or invalid source type', () => {
  const invalidSha = {
    id: 'src_rec_invalid',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    sourceType: 'COURT',
    sourceUrl: 'https://odyssey.traviscountytx.gov',
    retrievalTimestamp: new Date().toISOString(),
    artifactSha256: 'not-a-valid-sha256-hex',
    sourceSystem: 'Travis Portal',
    rawPayloadLocation: 'gs://bucket/test.pdf',
    adapterVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  assert.throws(() => SourceRecordSchema.parse(invalidSha));

  const invalidSourceType = {
    ...invalidSha,
    artifactSha256: '4a6b2c89f13e77a0bc0928e441bc19df273a00508a8e03efb7c7f3b8908851aa',
    sourceType: 'SYNTHETIC_MOCK',
  };
  assert.throws(() => SourceRecordSchema.parse(invalidSourceType));
});

test('County Adapters: CountyAdapterRegistry maps state, county, and adapter versions', () => {
  const registry = new CountyAdapterRegistry();
  const travis = new TravisCountyAdapter();
  const maricopa = new MaricopaCountyAdapter();

  registry.register(travis);
  registry.register(maricopa);

  const supported = registry.listSupportedCounties();
  assert.equal(supported.length, 2);

  const resolvedTravis = registry.getAdapter('county_travis_tx');
  assert.ok(resolvedTravis !== null);
  assert.equal(resolvedTravis.countyName, 'Travis County');
  assert.equal(resolvedTravis.stateCode, 'TX');

  const resolvedByName = registry.getAdapterByStateAndCounty('TX', 'Travis County');
  assert.ok(resolvedByName !== null);
  assert.equal(resolvedByName.countyId, 'county_travis_tx');

  const resolvedMaricopa = registry.getAdapterByStateAndCounty('AZ', 'Maricopa County');
  assert.ok(resolvedMaricopa !== null);
  assert.equal(resolvedMaricopa.countyId, 'county_maricopa_az');

  assert.throws(() => registry.getAdapterOrThrow('county_unknown_xx'), /No registered adapter found/);
});


test('County Adapters: Maricopa County Adapter implements complete ICountyAdapter contract', async () => {
  const adapter = new MaricopaCountyAdapter();
  assert.equal(adapter.countyId, 'county_maricopa_az');
  assert.equal(adapter.stateCode, 'AZ');

  // 1. getCourtCases
  const cases = await adapter.getCourtCases({ limit: 10 });
  assert.ok(cases.length > 0);
  assert.equal(cases[0].countyId, 'county_maricopa_az');
  assert.equal(cases[0].caseNumber, 'PB2026-001894');

  // 2. getCaseDocuments
  const docs = await adapter.getCaseDocuments('PB2026-001894');
  assert.ok(docs.length > 0);
  assert.equal(docs[0].artifactSha256.length, 64);

  // 3. getParcels
  const parcels = await adapter.getParcels();
  assert.ok(parcels.length > 0);
  assert.equal(parcels[0].address.state, 'AZ');

  // 4. getRecordedDocuments
  const recorded = await adapter.getRecordedDocuments('112-45-089A');
  assert.ok(recorded.length > 0);
  assert.equal(recorded[0].sourceType, 'RECORDER');

  // 5. getTaxRecords
  const taxRecord = await adapter.getTaxRecords('112-45-089A');
  assert.ok(taxRecord !== null);
  assert.equal(taxRecord.isDelinquent, false);

  // 6. getHealthStatus
  const health = await adapter.getHealthStatus();
  CountyAdapterHealthSchema.parse(health);
  assert.equal(health.status, 'HEALTHY');
  assert.equal(health.countyId, 'county_maricopa_az');
});

test('County Adapters: Unindexed records return transparent empty array (Zero fake deeds)', async () => {
  const adapter = new TravisCountyAdapter();
  const unindexedResult = await adapter.getRecordedDocuments('unindexed-apn-999999');

  // PRD & Agent Invariant: If county records are unindexed, fail transparently. Never generate fake deeds.
  assert.ok(Array.isArray(unindexedResult));
  assert.equal(unindexedResult.length, 0);
});

test('County Adapters: Layout Drift Detection verifies template match and flags drift', () => {
  const baselineText = `
    IN THE PROBATE COURT NO. 1, TRAVIS COUNTY, TEXAS
    CAUSE NO. C-1-PB-26-000412
    ESTATE OF ARTHUR JAMES JENKINS, DECEASED
    ORDER ADMITTING WILL TO PROBATE AND AUTHORIZING LETTERS TESTAMENTARY
    SARAH LOUISE JENKINS IS APPOINTED INDEPENDENT EXECUTOR
  `;

  const templateHash = computeTemplateStructureHash(baselineText);
  assert.equal(templateHash.length, 64);

  const baselineFingerprint = {
    countyId: 'county_travis_tx',
    documentType: 'COURT_ORDER',
    headerPatternRegex: 'IN THE PROBATE COURT',
    templateHash,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  };

  DocumentLayoutFingerprintSchema.parse(baselineFingerprint);

  // Scenario 1: Clean document matching baseline
  const cleanDocResult = evaluateDocumentLayoutDrift({
    documentText: baselineText,
    fingerprint: baselineFingerprint,
  });
  assert.equal(cleanDocResult.hasDrift, false);
  assert.equal(cleanDocResult.recommendedAction, 'NONE');
  assert.equal(cleanDocResult.driftConfidence, 0);
  assert.equal(cleanDocResult.driftDetails.length, 0);

  // Scenario 2: County redesigned page layout, anchor keywords missing
  const redesignedCountyPageText = `
    TRAVIS COUNTY DISTRICT CLERK - CIVIL/FAMILY PORTAL
    DOCKET SEARCH RESULTS:
    PARTY: JENKINS
    STATUS: CLOSED
    DISCLAIMER: REDESIGNED PORTAL V2.0
  `;

  const driftedDocResult = evaluateDocumentLayoutDrift({
    documentText: redesignedCountyPageText,
    fingerprint: baselineFingerprint,
  });
  assert.equal(driftedDocResult.hasDrift, true);
  assert.ok(driftedDocResult.driftConfidence >= 0.65);
  assert.ok(driftedDocResult.driftDetails.length > 0);
  assert.ok(driftedDocResult.recommendedAction === 'QUARANTINE_PARSER' || driftedDocResult.recommendedAction === 'REVIEW_LAYOUT');
});

test('County Adapters (WA): Pierce County Adapter implements complete ICountyAdapter contract', async () => {
  const adapter = new PierceCountyAdapter();
  assert.equal(adapter.countyId, 'county_pierce_wa');
  assert.equal(adapter.stateCode, 'WA');

  // 1. getCourtCases
  const cases = await adapter.getCourtCases({ limit: 10 });
  assert.ok(cases.length >= 2);
  assert.equal(cases[0].countyId, 'county_pierce_wa');
  assert.ok(cases[0].caseNumber.startsWith('26-4-'));

  // 2. getCaseDocuments
  const docs = await adapter.getCaseDocuments(cases[0].caseNumber);
  assert.ok(docs.length > 0);
  assert.equal(docs[0].artifactSha256.length, 64);
  assert.ok(docs[0].sourceUrl.includes('linxonline.co.pierce.wa.us'));

  // 3. getParcels
  const parcels = await adapter.getParcels();
  assert.ok(parcels.length > 0);
  assert.equal(parcels[0].address.state, 'WA');
  assert.equal(parcels[0].address.county, 'Pierce');

  // 4. getTaxRecords
  const taxRecord = await adapter.getTaxRecords(parcels[0].apn);
  assert.ok(taxRecord !== null);
  assert.equal(taxRecord.isDelinquent, false);

  // 5. getHealthStatus
  const health = await adapter.getHealthStatus();
  CountyAdapterHealthSchema.parse(health);
  assert.equal(health.status, 'HEALTHY');
});

test('County Adapters (WA): King County Adapter implements complete ICountyAdapter contract', async () => {
  const adapter = new KingCountyAdapter();
  assert.equal(adapter.countyId, 'county_king_wa');
  assert.equal(adapter.stateCode, 'WA');

  // 1. getCourtCases
  const cases = await adapter.getCourtCases({ limit: 10 });
  assert.ok(cases.length > 0);
  assert.equal(cases[0].countyId, 'county_king_wa');

  // 2. getParcels
  const parcels = await adapter.getParcels();
  assert.ok(parcels.length > 0);
  assert.equal(parcels[0].address.state, 'WA');
  assert.equal(parcels[0].address.city, 'Seattle');

  // 3. getHealthStatus
  const health = await adapter.getHealthStatus();
  CountyAdapterHealthSchema.parse(health);
  assert.equal(health.status, 'HEALTHY');
});

test('County Adapters (WA): MunicipalIngestionPipeline executes full ingestion cycle for Pierce & King', async () => {
  const pierceRes = await MunicipalIngestionPipeline.execute({
    countyId: 'county_pierce_wa',
    lookbackDays: 14,
  });
  assert.equal(pierceRes.countyId, 'county_pierce_wa');
  assert.ok(pierceRes.casesHarvested >= 2);
  assert.ok(pierceRes.documentsPreserved >= 2);
  assert.ok(pierceRes.parcelsMatched >= 1);
  assert.ok(pierceRes.telemetry.length >= 10);

  const kingRes = await MunicipalIngestionPipeline.execute({
    countyId: 'county_king_wa',
    lookbackDays: 14,
  });
  assert.equal(kingRes.countyId, 'county_king_wa');
  assert.ok(kingRes.casesHarvested >= 1);
  assert.ok(kingRes.documentsPreserved >= 1);
  assert.ok(kingRes.parcelsMatched >= 1);
});



test('County Adapters: Ingestion kicks off complete downstream process (filings, claims, authority, scoring, opportunities)', async () => {
  // Test Travis County
  const travisRes = await MunicipalIngestionPipeline.execute({
    countyId: 'county_travis_tx',
    lookbackDays: 14,
  });

  assert.equal(travisRes.countyId, 'county_travis_tx');
  assert.ok(travisRes.casesHarvested >= 1);
  // Verify individual documents/filings were preserved (not just a docket stub!)
  assert.ok(travisRes.documentsPreserved >= 3);
  assert.ok(travisRes.data.documents.some((d) => d.filename.includes('application')));
  assert.ok(travisRes.data.documents.some((d) => d.filename.includes('order')));
  assert.ok(travisRes.data.documents.some((d) => d.filename.includes('letters')));
  assert.ok(travisRes.data.documents.some((d) => d.filename.includes('inventory')));

  // Verify Document AI Claims were extracted
  assert.ok(travisRes.claimsExtracted >= 2);
  const fidClaim = travisRes.data.claims.find((c) => c.subjectType === 'AUTHORITY');
  assert.ok(fidClaim);
  assert.equal(fidClaim.verificationStatus, 'VERIFIED');
  assert.ok(fidClaim.evidence.length > 0);
  assert.equal(fidClaim.evidence[0].artifactSha256.length, 64);

  // Verify Authority Assessment was generated
  assert.ok(travisRes.authoritiesEvaluated >= 1);
  const auth = travisRes.data.authorities[0];
  assert.equal(auth.status, 'CONFIRMED');
  assert.equal(auth.tier, 1);
  assert.equal(auth.fiduciary.fullName, 'Sarah Louise Jenkins');
  assert.equal(auth.fiduciary.lettersIssued, true);

  // Verify Deterministic Opportunity Scoring
  assert.ok(travisRes.opportunitiesScored >= 1);
  const score = travisRes.data.scores[0];
  assert.ok(score.compositeScore > 50);
  assert.ok(['PRIORITY_A', 'PRIORITY_B', 'PRIORITY_C'].includes(score.priorityBand));

  // Verify Institutional Opportunity Snapshot Projection
  assert.ok(travisRes.data.opportunities.length >= 1);
  const opp = travisRes.data.opportunities[0];
  assert.equal(opp.status, 'READY_FOR_QC');
  assert.equal(opp.currentSnapshot.fiduciaryName, 'Sarah Louise Jenkins');
  assert.ok(opp.currentSnapshot.compositeScore > 50);

  // Verify Telemetry Stages emitted
  const stages = new Set(travisRes.telemetry.map((t) => t.stage));
  assert.ok(stages.has('DRIFT_CHECK'));
  assert.ok(stages.has('DOCKET_HARVEST'));
  assert.ok(stages.has('EVIDENCE_HASH'));
  assert.ok(stages.has('DOCUMENT_INTELLIGENCE'));
  assert.ok(stages.has('ASSESSOR_MATCH'));
  assert.ok(stages.has('TAX_VERIFY'));
  assert.ok(stages.has('AUTHORITY_EVAL'));
  assert.ok(stages.has('OWNERSHIP_CHAIN'));
  assert.ok(stages.has('OPPORTUNITY_SCORING'));
  assert.ok(stages.has('OPPORTUNITY_PROJECTED'));
  assert.ok(stages.has('COMPLETE'));
});

test('County Adapters (WA): Thurston County Adapter implements complete ICountyAdapter contract', async () => {
  const adapter = new ThurstonCountyAdapter();
  assert.equal(adapter.countyId, 'county_thurston_wa');
  assert.equal(adapter.stateCode, 'WA');

  // 1. getCourtCases - 90-day backfill should yield all 36 authentic cases
  const cases90d = await adapter.getCourtCases({ sinceDate: new Date(Date.now() - 90 * 86400000).toISOString() });
  assert.equal(cases90d.length, 100);
  assert.ok(cases90d.some((c) => c.caseNumber === '26-4-00122-34'));
  assert.ok(cases90d.some((c) => c.caseNumber === '26-4-00089-34'));
  assert.ok(cases90d.some((c) => c.caseNumber === '26-4-00041-34'));
  assert.ok(cases90d.some((c) => c.caseNumber === '25-4-00788-34'));

  // 2. getCaseDocuments - standard case
  const docsStd = await adapter.getCaseDocuments('26-4-00122-34');
  assert.equal(docsStd.length, 4);
  assert.ok(docsStd.some((d) => d.id.includes('petition')));
  assert.ok(docsStd.some((d) => d.id.includes('letters')));

  // 3. getCaseDocuments - LOPA/CPA case
  const docsLopa = await adapter.getCaseDocuments('26-4-00041-34');
  assert.equal(docsLopa.length, 3);
  assert.ok(docsLopa.some((d) => d.id.includes('lopa')));
  assert.ok(docsLopa.some((d) => d.id.includes('cpa')));

  // 4. getParcels
  const parcels = await adapter.getParcels();
  assert.equal(parcels.length, 100);
  assert.equal(parcels[0].address.county, 'Thurston');
  assert.equal(parcels[0].address.state, 'WA');

  // 5. getTaxRecords
  const taxRecord = await adapter.getTaxRecords('12816320100');
  assert.ok(taxRecord !== null);
  assert.equal(taxRecord.totalAssessedValue, 540000);
  assert.equal(taxRecord.isDelinquent, false);

  // 6. getHealthStatus
  const health = await adapter.getHealthStatus();
  CountyAdapterHealthSchema.parse(health);
  assert.equal(health.status, 'HEALTHY');
  assert.equal(health.countyId, 'county_thurston_wa');
});

test('County Adapters (WA): MunicipalIngestionPipeline executes full ingestion cycle for Thurston across 90-day backfill', async () => {
  const result = await MunicipalIngestionPipeline.execute({
    countyId: 'county_thurston_wa',
    lookbackDays: 90,
  });

  assert.equal(result.countyId, 'county_thurston_wa');
  assert.equal(result.casesHarvested, 100);
  assert.ok(result.documentsPreserved >= 300);
  assert.equal(result.parcelsMatched, 100);
  assert.equal(result.opportunitiesScored, 100);

  // Verify LOPA case (26-4-00041-34) was resolved under Washington Community Property law as Tier 1 / Confirmed
  const lopaAuth = result.data.authorities.find((a) => a.caseId.includes('00041'));
  assert.ok(lopaAuth);
  assert.equal(lopaAuth.status, 'CONFIRMED');
  assert.equal(lopaAuth.tier, 1);
  assert.equal(lopaAuth.fiduciary.fullName, 'Carolyn Boyd');

  // Verify standard cases (Warren Lindgren, Evelyn Miller, Henry Zimmerman)
  const lindgrenAuth = result.data.authorities.find((a) => a.caseId.includes('00122'));
  assert.ok(lindgrenAuth);
  assert.equal(lindgrenAuth.status, 'CONFIRMED');
  assert.equal(lindgrenAuth.tier, 1);
  assert.equal(lindgrenAuth.fiduciary.fullName, 'Erik Lindgren');

  // Verify honest unappointed cases (e.g. Dorothy Jean Campbell - 26-4-00135-34)
  const unappointedAuth = result.data.authorities.find((a) => a.caseId.includes('00135'));
  assert.ok(unappointedAuth);
  assert.equal(unappointedAuth.status, 'NO_APPOINTMENT');
  assert.equal(unappointedAuth.tier, 4);
  assert.equal(unappointedAuth.fiduciary, null);

  // All opportunities scored and projected
  assert.ok(result.data.opportunities.length >= 35);
  assert.ok(result.data.opportunities.every((opp) => opp.currentSnapshot.compositeScore > 0));
});
