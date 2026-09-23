import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseEntitySchema,
  OrganizationEntitySchema,
  ClientTenantSchema,
  CountyJurisdictionSchema,
} from '../../packages/database/dist/index.js';
import {
  ProbateCaseSchema,
  EstateRecordSchema,
  PersonRecordSchema,
  OrganizationExternalSchema,
  PersonRelationshipSchema,
  AuthorityAssessmentSchema,
} from '../../packages/authority/dist/index.js';
import { PropertyParcelSchema } from '../../packages/property/dist/index.js';
import {
  OwnershipAssessmentSchema,
  OwnershipEventSchema,
} from '../../packages/ownership/dist/index.js';
import {
  SourceDocumentSchema,
  ClaimSchema,
  ClaimEvidenceSchema,
} from '../../packages/evidence/dist/index.js';
import {
  OpportunityScoreSchema,
  buildOpportunitySnapshot,
} from '../../packages/scoring/dist/index.js';
import {
  InvestigationExceptionSchema,
  QCReviewSchema,
} from '../../packages/qc/dist/index.js';
import {
  ProbateOpportunityFileSchema,
  ClientFeedbackSchema,
} from '../../packages/delivery/dist/index.js';
import {
  WorkflowRunSchema,
  AuditEventSchema,
} from '../../packages/workflow/dist/index.js';

test('Data Model: Every record envelope carries _id, organizationId, clientId?, countyId, timestamps, schemaVersion', () => {
  const sampleBase = {
    id: 'rec_1001',
    organizationId: 'org_internal_operator',
    clientId: 'client_maricopa_corp',
    countyId: 'maricopa_az',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const parsed = BaseEntitySchema.parse(sampleBase);
  assert.equal(parsed.id, 'rec_1001');
  assert.equal(parsed.organizationId, 'org_internal_operator');
  assert.equal(parsed.countyId, 'maricopa_az');
  assert.equal(parsed.schemaVersion, 1);
});

test('Data Model: Tenancy collections (organizations, clients, counties) validate with Zod', () => {
  const org = OrganizationEntitySchema.parse({
    id: 'org_001',
    organizationId: 'org_internal_operator',
    countyId: 'all',
    clerkOrgId: 'org_2tQh...operator',
    name: 'Gieni Internal Operator',
    orgType: 'OPERATOR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(org.orgType, 'OPERATOR');

  const client = ClientTenantSchema.parse({
    id: 'client_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    name: 'Desert Ridge Capital',
    contactEmail: 'acquisitions@desertridge.com',
    webhookUrl: 'https://webhook.site/test',
    licensedCounties: ['maricopa_az'],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(client.status, 'ACTIVE');

  const county = CountyJurisdictionSchema.parse({
    id: 'county_maricopa_az',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    countyName: 'Maricopa County',
    stateCode: 'AZ',
    fipsCode: '04013',
    courtSystem: 'Maricopa County Superior Court',
    assessorSystem: 'Maricopa County Assessor Parcel Viewer',
    recorderSystem: 'Maricopa County Recorder Online Search',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(county.fipsCode, '04013');
});

test('Data Model: Identity & graph collections (probateCases, estates, people, organizationsExternal, relationships) validate with Zod', () => {
  const pcase = ProbateCaseSchema.parse({
    id: 'case_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    caseNumber: 'PB2024-001928',
    decedentName: 'Eleanor Vance',
    filingDate: '2024-03-15T09:00:00.000Z',
    caseType: 'Supervised Administration',
    courtName: 'Maricopa County Superior Court',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(pcase.caseNumber, 'PB2024-001928');

  const estate = EstateRecordSchema.parse({
    id: 'estate_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    caseId: 'case_001',
    estateName: 'Estate of Eleanor Vance',
    status: 'OPEN',
    estimatedGrossValue: 450000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(estate.status, 'OPEN');

  const person = PersonRecordSchema.parse({
    id: 'person_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    fullName: 'Robert Sterling',
    isDecedent: false,
    isHeir: true,
    isFiduciary: true,
    isCounsel: false,
    verifiedEvidenceIds: ['ev_pet_01'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(person.isFiduciary, true);

  const orgExt = OrganizationExternalSchema.parse({
    id: 'org_ext_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    name: 'Sterling Probate Law Group',
    orgType: 'LAW_FIRM',
    phone: '602-555-0199',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(orgExt.orgType, 'LAW_FIRM');

  const rel = PersonRelationshipSchema.parse({
    id: 'rel_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    subjectType: 'PERSON',
    subjectId: 'person_001',
    predicate: 'FIDUCIARY_FOR',
    targetType: 'ESTATE',
    targetId: 'estate_001',
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(rel.predicate, 'FIDUCIARY_FOR');
});

test('Data Model: Claim–Evidence Triad requires atomic claim, immutable source document, and exact proof', () => {
  const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const doc = SourceDocumentSchema.parse({
    id: 'doc_pet_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    filename: 'PB2024-001928_Petition_for_Letters.pdf',
    mimeType: 'application/pdf',
    storageUri: 'https://storage.googleapis.com/gieni-raw-docs/doc_pet_001.pdf',
    artifactSha256: sha256,
    retrievalTimestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(doc.artifactSha256, sha256);

  const evidence = ClaimEvidenceSchema.parse({
    id: 'ev_001',
    claimId: 'claim_001',
    sourceDocumentId: 'doc_pet_001',
    pageNumber: 2,
    sourceLocator: 'page_2_paragraph_3',
    excerpt: 'Petitioner Robert Sterling is the named executor under said Will...',
    artifactSha256: sha256,
    createdAt: new Date().toISOString(),
  });
  assert.equal(evidence.pageNumber, 2);

  const claim = ClaimSchema.parse({
    id: 'claim_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    subjectType: 'AUTHORITY',
    subjectId: 'case_001',
    fieldPath: 'authority.fiduciaryPersonId',
    proposedValue: 'Robert Sterling',
    normalizedValue: 'Robert Sterling',
    claimType: 'EXTRACTED',
    confidence: 0.95,
    verificationStatus: 'PROPOSED',
    ruleVersion: 'v1.0.0-deterministic',
    evidence: [evidence],
    createdBy: 'gemini-1.5-pro',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  assert.equal(claim.claimType, 'EXTRACTED');
  assert.equal(claim.verificationStatus, 'PROPOSED');
});

test('Data Model: Embed vs Reference rules are preserved with Opportunity projection rebuild', () => {
  const property = {
    id: 'prop_001',
    organizationId: 'org_internal_operator',
    countyId: 'maricopa_az',
    apn: '123-45-678',
    legalDescription: 'LOT 12 BLK 4 SUN VALLEY ESTATES',
    address: {
      street: '742 Evergreen Terrace',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      county: 'Maricopa',
    },
    assessedLandValue: 80000,
    assessedImprovementValue: 270000,
    totalAssessedValue: 350000,
    taxYear: 2024,
    lastSaleDate: '2012-05-10',
    lastSalePrice: 190000,
    verifiedEvidenceIds: ['ev_parcel_01'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const snapshot = buildOpportunitySnapshot({
    caseNumber: 'PB2024-001928',
    decedentName: 'Eleanor Vance',
    filingDate: '2024-03-15T09:00:00.000Z',
    property: property,
    authority: {
      id: 'auth_001',
      organizationId: 'org_internal_operator',
      caseId: 'case_001',
      countyId: 'maricopa_az',
      status: 'CONFIRMED',
      tier: 1,
      fiduciary: {
        personId: 'person_001',
        fullName: 'Robert Sterling',
        role: 'EXECUTOR',
        appointmentDate: '2024-03-20T10:00:00.000Z',
        lettersIssued: true,
        bondAmount: null,
        verifiedEvidenceId: 'ev_001',
      },
      verifiedClaimIds: ['claim_001'],
      evaluatedAt: new Date().toISOString(),
      evaluatorId: 'system',
      ruleVersion: 'v1.0.0-deterministic',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    ownership: {
      id: 'own_001',
      organizationId: 'org_internal_operator',
      parcelId: 'prop_001',
      caseId: 'case_001',
      countyId: 'maricopa_az',
      status: 'DECEDENT_SOLE_OWNER',
      ownerNames: ['Eleanor Vance'],
      deedRecordIds: ['deed_001'],
      verifiedClaimIds: ['claim_002'],
      confidence: 1.0,
      ruleVersion: 'v1.0.0-deterministic',
      evaluatedAt: new Date().toISOString(),
      evaluatorId: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    score: {
      id: 'score_001',
      organizationId: 'org_internal_operator',
      countyId: 'maricopa_az',
      opportunityId: 'opp_001',
      ruleVersion: 'v1.0.0-deterministic',
      equityScore: 75,
      authorityScore: 100,
      readinessScore: 80,
      compositeScore: 88,
      priorityBand: 'A',
      reasons: ['Substantial assessed equity', 'Letters testamentary confirmed'],
      computedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    unresolvedExceptionsCount: 0,
  });

  // Verify the denormalized snapshot is a projection, not an evidence system of record
  assert.equal(snapshot.caseNumber, 'PB2024-001928');
  assert.equal(snapshot.fiduciaryName, 'Robert Sterling');
  assert.equal(snapshot.compositeScore, 88);
  assert.equal(snapshot.priorityBand, 'A');
  assert.equal(snapshot.propertyAddress, '742 Evergreen Terrace, Phoenix, AZ 85001');
  assert.equal(snapshot.unresolvedExceptionsCount, 0);
  assert.ok(snapshot.lastProjectedAt);
});
