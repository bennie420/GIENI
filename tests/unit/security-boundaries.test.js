import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTenantScopedRepository } from '../../packages/database/dist/index.js';
import { maskPii, assertClaimEligibleForDelivery } from '../../packages/authz/dist/index.js';

test('Security Boundaries: Negative cross-tenant isolation across all bounded contexts', async () => {
  const tenantA = { organizationId: 'org_austin_cap', countyId: 'county_travis_tx' };
  const tenantB = { organizationId: 'org_dallas_inv', countyId: 'county_travis_tx' };

  // 1. Evidence (SourceDocument & Claim)
  const docRepo = new InMemoryTenantScopedRepository();
  const claimRepo = new InMemoryTenantScopedRepository();

  const docA = await docRepo.create(tenantA, {
    countyId: 'county_travis_tx',
    filename: 'will_travis.pdf',
    mimeType: 'application/pdf',
    storageUri: 'gs://gieni/will.pdf',
    artifactSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    retrievalTimestamp: new Date().toISOString(),
    schemaVersion: 1,
  });

  assert.equal(await docRepo.findById(tenantB, docA.id), null);
  assert.equal((await docRepo.findMany(tenantB)).length, 0);

  const claimA = await claimRepo.create(tenantA, {
    countyId: 'county_travis_tx',
    subjectType: 'AUTHORITY',
    subjectId: docA.id,
    fieldPath: 'authority.fiduciary',
    proposedValue: { fullName: 'Sarah Louise Jenkins' },
    claimType: 'EXTRACTED',
    confidence: 0.95,
    verificationStatus: 'PROPOSED',
    evidence: [],
    createdBy: 'agent',
    schemaVersion: 1,
  });

  assert.equal(await claimRepo.findById(tenantB, claimA.id), null);

  // 2. Authority & Cases
  const caseRepo = new InMemoryTenantScopedRepository();
  const authRepo = new InMemoryTenantScopedRepository();

  const caseA = await caseRepo.create(tenantA, {
    countyId: 'county_travis_tx',
    caseNumber: 'C-1-PB-26-000412',
    decedentName: 'Arthur Jenkins',
    filingDate: '2026-03-01T00:00:00.000Z',
    caseType: 'PROBATE_WILL',
    courtName: 'Probate Court No 1',
    judgeName: 'Judge Herman',
    schemaVersion: 1,
  });

  assert.equal(await caseRepo.findById(tenantB, caseA.id), null);

  // 3. Property & Ownership
  const parcelRepo = new InMemoryTenantScopedRepository();
  const ownRepo = new InMemoryTenantScopedRepository();

  const parcelA = await parcelRepo.create(tenantA, {
    countyId: 'county_travis_tx',
    apn: '02-1408-0112',
    legalDescription: 'LOT 4 BLK B HIGHLAND PARK',
    address: { street: '742 Evergreen', city: 'Austin', state: 'TX', zipCode: '78701', county: 'Travis' },
    assessedLandValue: 200000,
    assessedImprovementValue: 400000,
    totalAssessedValue: 600000,
    taxYear: 2025,
    lastSaleDate: null,
    lastSalePrice: null,
    verifiedEvidenceIds: [],
    schemaVersion: 1,
  });

  assert.equal(await parcelRepo.findById(tenantB, parcelA.id), null);

  // 4. Scoring & Operational Opportunities
  const scoreRepo = new InMemoryTenantScopedRepository();
  const oppRepo = new InMemoryTenantScopedRepository();

  const oppA = await oppRepo.create(tenantA, {
    countyId: 'county_travis_tx',
    caseId: caseA.id,
    parcelId: parcelA.id,
    status: 'QC_APPROVED',
    currentSnapshot: {
      caseNumber: 'C-1-PB-26-000412',
      decedentName: 'Arthur Jenkins',
      filingDate: '2026-03-01T00:00:00.000Z',
      propertyAddress: '742 Evergreen, Austin TX',
      assessedValue: 600000,
      estimatedEquity: 525000,
      ownershipStatus: 'DECEDENT_SOLE_OWNER',
      authorityStatus: 'CONFIRMED',
      authorityTier: 1,
      fiduciaryName: 'Sarah Jenkins',
      compositeScore: 88,
      priorityBand: 'PRIORITY_A',
      unresolvedExceptionsCount: 0,
      lastProjectedAt: new Date().toISOString(),
    },
    schemaVersion: 1,
  });

  assert.equal(await oppRepo.findById(tenantB, oppA.id), null);
  assert.equal((await oppRepo.findMany(tenantB)).length, 0);

  // 5. QC Reviews & Exceptions
  const excRepo = new InMemoryTenantScopedRepository();
  const qcRepo = new InMemoryTenantScopedRepository();

  const excA = await excRepo.create(tenantA, {
    countyId: 'county_travis_tx',
    opportunityId: oppA.id,
    type: 'TITLE_CONFLICT',
    status: 'PENDING_REVIEW',
    description: 'TCAD name mismatch',
    schemaVersion: 1,
  });

  assert.equal(await excRepo.findById(tenantB, excA.id), null);

  // 6. Deliveries & Client Feedback
  const pofRepo = new InMemoryTenantScopedRepository();
  const feedbackRepo = new InMemoryTenantScopedRepository();

  const pofA = await pofRepo.create(tenantA, {
    countyId: 'county_travis_tx',
    caseNumber: 'C-1-PB-26-000412',
    decedentName: 'Arthur Jenkins',
    filingDate: '2026-03-01T00:00:00.000Z',
    property: { apn: '02-1408-0112', addressText: '742 Evergreen', assessedValue: 600000, estimatedEquity: 525000, recordsLocated: true },
    ownership: { status: 'DECEDENT_SOLE_OWNER', verifiedOwners: ['Arthur Jenkins'] },
    authority: { status: 'CONFIRMED', tier: 1, fiduciaryName: 'Sarah Jenkins', fiduciaryRole: 'EXECUTOR', lettersIssued: true },
    scoring: { compositeScore: 88, priorityBand: 'PRIORITY_A', ruleVersion: 'v1.0.0' },
    evidence: [],
    recommendedAction: 'Engage Executor',
    disclaimer: 'research finding—not legal opinion or title guarantee',
    publishedAt: new Date().toISOString(),
    schemaVersion: 1,
  });

  assert.equal(await pofRepo.findById(tenantB, pofA.id), null);
  assert.equal((await pofRepo.findMany(tenantB)).length, 0);
});

test('Security Boundaries: PII Masking protects sensitive contact data for session replays', () => {
  const sensitiveText = 'Contact executor at sarah.jenkins@example.com or phone 512-555-0199, SSN 123-45-6789.';
  const masked = maskPii(sensitiveText);

  assert.ok(!masked.includes('512-555-0199'));
  assert.ok(!masked.includes('123-45-6789'));
  assert.ok(!masked.includes('sarah.jenkins@example.com'));
  assert.match(masked, /\*\*\*-\*\*-6789/);
  assert.match(masked, /\*\*\*-\*\*\*-0199/);
});

test('Security Boundaries: Unverified AI Claims are rejected from delivery publication', () => {
  const unverifiedClaim = {
    claimType: 'EXTRACTED',
    verificationStatus: 'PROPOSED',
  };

  assert.throws(
    () => assertClaimEligibleForDelivery(unverifiedClaim),
    /Security Violation: AI Claim with status 'PROPOSED' cannot be published to client/
  );

  const verifiedClaim = {
    claimType: 'EXTRACTED',
    verificationStatus: 'VERIFIED',
  };

  assert.doesNotThrow(() => assertClaimEligibleForDelivery(verifiedClaim));
});
