import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SourceRecordSchema,
} from '../../packages/evidence/dist/index.js';
import {
  defaultCountyAdapterRegistry,
  TravisCountyAdapter,
  MaricopaCountyAdapter,
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

test('County Adapters: Travis County Adapter implements complete ICountyAdapter contract', async () => {
  const adapter = new TravisCountyAdapter();
  assert.equal(adapter.countyId, 'county_travis_tx');
  assert.equal(adapter.stateCode, 'TX');

  // 1. getCourtCases
  const cases = await adapter.getCourtCases({ limit: 10 });
  assert.ok(cases.length > 0);
  assert.equal(cases[0].countyId, 'county_travis_tx');
  assert.equal(cases[0].caseNumber, 'C-1-PB-26-000412');

  // 2. getCaseDocuments
  const docs = await adapter.getCaseDocuments('C-1-PB-26-000412');
  assert.ok(docs.length > 0);
  assert.equal(docs[0].artifactSha256.length, 64);

  // 3. getParcels
  const parcels = await adapter.getParcels();
  assert.ok(parcels.length > 0);
  assert.equal(parcels[0].address.state, 'TX');
  assert.ok((parcels[0].totalAssessedValue || 0) > 0);

  // 4. getRecordedDocuments
  const recorded = await adapter.getRecordedDocuments('02040506070000');
  assert.ok(recorded.length > 0);
  assert.equal(recorded[0].sourceType, 'RECORDER');

  // 5. getTaxRecords
  const taxRecord = await adapter.getTaxRecords('02040506070000');
  assert.ok(taxRecord !== null);
  assert.equal(taxRecord.isDelinquent, false);

  // 6. getHealthStatus
  const health = await adapter.getHealthStatus();
  CountyAdapterHealthSchema.parse(health);
  assert.equal(health.status, 'HEALTHY');
  assert.ok(health.averageLatencyMs > 0);
  assert.ok(health.failureRate < 0.05);
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
