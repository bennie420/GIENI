import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TenantScope,
  getTenantScopedRepository,
  getMongoDb,
  closeMongoClient,
  pingMongoDeployment,
} from '@gieni/database';
import { SourceDocument, Claim, ClaimEvidence } from '@gieni/evidence';
import { ProbateCase, AuthorityAssessment, FiduciaryAppointment } from '@gieni/authority';
import { PropertyParcel } from '@gieni/property';
import { OwnershipAssessment } from '@gieni/ownership';
import {
  calculateOpportunityScore,
  OpportunityScore,
  Opportunity,
  buildOpportunitySnapshot,
} from '@gieni/scoring';
import { InvestigationException, QCReview } from '@gieni/qc';
import { ProbateOpportunityFile, LEGAL_DISCLAIMER } from '@gieni/delivery';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if present
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/workers/.env'),
  path.resolve(__dirname, '../.env'),
];
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // ignore
    }
  }
}

interface SeedRepositories {
  docRepo: ReturnType<typeof getTenantScopedRepository<SourceDocument & { countyId: string }>>;
  caseRepo: ReturnType<typeof getTenantScopedRepository<ProbateCase>>;
  claimRepo: ReturnType<typeof getTenantScopedRepository<Claim>>;
  parcelRepo: ReturnType<typeof getTenantScopedRepository<PropertyParcel>>;
  authRepo: ReturnType<typeof getTenantScopedRepository<AuthorityAssessment>>;
  ownRepo: ReturnType<typeof getTenantScopedRepository<OwnershipAssessment>>;
  scoreRepo: ReturnType<typeof getTenantScopedRepository<OpportunityScore>>;
  oppRepo: ReturnType<typeof getTenantScopedRepository<Opportunity>>;
  excRepo: ReturnType<typeof getTenantScopedRepository<InvestigationException>>;
  qcRepo: ReturnType<typeof getTenantScopedRepository<QCReview>>;
  pofRepo: ReturnType<typeof getTenantScopedRepository<ProbateOpportunityFile>>;
}

async function connectToMongoIfAvailable() {
  if (!process.env.MONGODB_URI) {
    console.log('No MONGODB_URI found. Running with in-memory repositories.');
    return undefined;
  }

  try {
    console.log('Connecting to MongoDB Atlas cluster...');
    const pingOk = await pingMongoDeployment();
    if (pingOk) {
      const db = await getMongoDb();
      console.log(`Connected successfully to MongoDB Atlas database: "${db.databaseName}"`);
      return db;
    }
  } catch (connErr) {
    console.warn('MongoDB Atlas connection failed, falling back to in-memory repositories:', connErr);
  }
  return undefined;
}

function initSeedRepositories(db: any): SeedRepositories {
  return {
    docRepo: getTenantScopedRepository<SourceDocument & { countyId: string }>('sourceDocuments', db),
    caseRepo: getTenantScopedRepository<ProbateCase>('probateCases', db),
    claimRepo: getTenantScopedRepository<Claim>('claims', db),
    parcelRepo: getTenantScopedRepository<PropertyParcel>('properties', db),
    authRepo: getTenantScopedRepository<AuthorityAssessment>('authorityAssessments', db),
    ownRepo: getTenantScopedRepository<OwnershipAssessment>('ownershipAssessments', db),
    scoreRepo: getTenantScopedRepository<OpportunityScore>('opportunityScores', db),
    oppRepo: getTenantScopedRepository<Opportunity>('opportunities', db),
    excRepo: getTenantScopedRepository<InvestigationException>('exceptions', db),
    qcRepo: getTenantScopedRepository<QCReview>('qcReviews', db),
    pofRepo: getTenantScopedRepository<ProbateOpportunityFile>('deliveries', db),
  };
}

async function seedPrimaryDocument(docRepo: SeedRepositories['docRepo'], scope: TenantScope) {
  const fixturePath = path.resolve(
    __dirname,
    '../../../tests/evidence-fixtures/travis-county/letters_testamentary.txt'
  );
  const docText = fs.readFileSync(fixturePath, 'utf-8');
  const docHash = crypto.createHash('sha256').update(docText).digest('hex');

  console.log(`\n[1/7] Ingesting Primary Source Document...`);
  console.log(`      File: letters_testamentary.txt`);
  console.log(`      Computed Authentic SHA-256: ${docHash}`);

  const sourceDoc = await docRepo.create(scope, {
    countyId: 'county_travis_tx',
    filename: 'Cause_C-1-PB-26-000412_Letters_Testamentary.pdf',
    mimeType: 'application/pdf',
    storageUri: 'gs://gieni-evidence-pilot/travis/2026/C-1-PB-26-000412/letters.pdf',
    artifactSha256: docHash,
    sourceUrl: 'https://traviscountyclerk.org/dockets/C-1-PB-26-000412',
    retrievalTimestamp: new Date().toISOString(),
    termsNote: 'Public court record obtained under Texas Open Records Act',
    schemaVersion: 1,
  });

  return { sourceDoc, docHash };
}

async function seedProbateCase(caseRepo: SeedRepositories['caseRepo'], scope: TenantScope) {
  console.log(`\n[2/7] Ingesting Probate Court Filing...`);
  const probateCase = await caseRepo.create(scope, {
    countyId: 'county_travis_tx',
    caseNumber: 'C-1-PB-26-000412',
    decedentName: 'Arthur James Jenkins',
    filingDate: '2026-03-01T00:00:00.000Z',
    caseType: 'INDEPENDENT_ADMINISTRATION_WITH_WILL',
    courtName: 'Probate Court No. 1, Travis County, Texas',
    judgeName: 'Hon. Guy Herman',
    schemaVersion: 1,
  });
  console.log(`      Case Number: ${probateCase.caseNumber}`);
  console.log(`      Decedent: ${probateCase.decedentName}`);
  return probateCase;
}

async function seedClaimAndEvidence(
  claimRepo: SeedRepositories['claimRepo'],
  scope: TenantScope,
  sourceDocId: string,
  probateCaseId: string,
  docHash: string
) {
  console.log(`\n[3/7] Storing Gemini Extraction Proposal as Claim (Status: PROPOSED)...`);
  const evidenceRecord: ClaimEvidence = {
    id: `ev_${Date.now()}`,
    claimId: 'claim_fiduciary_001',
    sourceDocumentId: sourceDocId,
    pageNumber: 1,
    excerpt: '...granted LETTERS TESTAMENTARY upon said estate unto: SARAH LOUISE JENKINS...',
    sourceLocator: 'p1_para3_line1-4',
    artifactSha256: docHash,
    createdAt: new Date().toISOString(),
  };

  const proposedClaim = await claimRepo.create(scope, {
    countyId: 'county_travis_tx',
    subjectType: 'AUTHORITY',
    subjectId: probateCaseId,
    fieldPath: 'authority.fiduciary',
    proposedValue: {
      fullName: 'Sarah Louise Jenkins',
      role: 'EXECUTOR',
      bondAmount: null,
      lettersIssued: true,
    },
    claimType: 'EXTRACTED',
    confidence: 0.97,
    verificationStatus: 'PROPOSED',
    modelVersion: 'gemini-1.5-pro-extract-v2',
    evidence: [evidenceRecord],
    createdBy: 'agent_docai_gemini_pipeline',
    schemaVersion: 1,
  });

  console.log(`      Proposed Claim ID: ${proposedClaim.id}`);
  console.log(`      Status: ${proposedClaim.verificationStatus} (Not fact until verified)`);

  return { proposedClaim, evidenceRecord };
}

async function seedParcelRecord(parcelRepo: SeedRepositories['parcelRepo'], scope: TenantScope, sourceDocId: string) {
  const parcel = await parcelRepo.create(scope, {
    countyId: 'county_travis_tx',
    apn: '02-1408-0112',
    legalDescription: 'LOT 4 BLK B HIGHLAND PARK SEC 2',
    address: {
      street: '742 Evergreen Terrace',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      county: 'Travis',
    },
    assessedLandValue: 220000,
    assessedImprovementValue: 485000,
    totalAssessedValue: 705000,
    taxYear: 2025,
    lastSaleDate: '2018-06-15T00:00:00.000Z',
    lastSalePrice: 460000,
    verifiedEvidenceIds: [sourceDocId],
    schemaVersion: 1,
  });
  console.log(`      Parcel APN: ${parcel.apn} (Assessed: $${parcel.totalAssessedValue?.toLocaleString()})`);
  return parcel;
}

async function seedOwnershipRecord(
  ownRepo: SeedRepositories['ownRepo'],
  scope: TenantScope,
  parcelId: string,
  probateCaseId: string,
  proposedClaimId: string
) {
  return ownRepo.create(scope, {
    countyId: 'county_travis_tx',
    parcelId,
    caseId: probateCaseId,
    status: 'DECEDENT_SOLE_OWNER',
    ownerNames: ['Arthur James Jenkins'],
    deedRecordIds: ['inst_2018091428'],
    verifiedClaimIds: [proposedClaimId],
    confidence: 1.0,
    ruleVersion: 'v1.0.0',
    evaluatedAt: new Date().toISOString(),
    evaluatorId: 'qc_operator_researcher',
    schemaVersion: 1,
  });
}

async function seedAuthorityRecord(
  authRepo: SeedRepositories['authRepo'],
  scope: TenantScope,
  probateCaseId: string,
  proposedClaimId: string,
  evidenceRecordId: string
) {
  const fiduciary: FiduciaryAppointment = {
    personId: 'person_sarah_jenkins_01',
    fullName: 'Sarah Louise Jenkins',
    role: 'EXECUTOR',
    appointmentDate: '2026-03-02T00:00:00.000Z',
    lettersIssued: true,
    bondAmount: null,
    verifiedEvidenceId: evidenceRecordId,
  };

  return authRepo.create(scope, {
    countyId: 'county_travis_tx',
    caseId: probateCaseId,
    status: 'CONFIRMED',
    tier: 1,
    fiduciary,
    verifiedClaimIds: [proposedClaimId],
    evaluatedAt: new Date().toISOString(),
    evaluatorId: 'qc_operator_researcher',
    ruleVersion: 'v1.0.0',
    schemaVersion: 1,
  });
}

export interface SeedPropertyAndAssessmentsParams {
  repos: SeedRepositories;
  scope: TenantScope;
  sourceDocId: string;
  probateCaseId: string;
  proposedClaimId: string;
  evidenceRecordId: string;
}

async function seedPropertyAndAssessments(params: SeedPropertyAndAssessmentsParams) {
  const { repos, scope, sourceDocId, probateCaseId, proposedClaimId, evidenceRecordId } = params;
  console.log(`\n[4/7] Reconciling Assessor Parcel & Ownership...`);
  await repos.claimRepo.update(scope, proposedClaimId, {
    verificationStatus: 'VERIFIED',
    verifiedBy: 'qc_operator_researcher',
    verifiedAt: new Date().toISOString(),
  });

  const parcel = await seedParcelRecord(repos.parcelRepo, scope, sourceDocId);
  const ownership = await seedOwnershipRecord(repos.ownRepo, scope, parcel.id, probateCaseId, proposedClaimId);
  const authority = await seedAuthorityRecord(repos.authRepo, scope, probateCaseId, proposedClaimId, evidenceRecordId);

  return { parcel, ownership, authority };
}


async function seedScoringRecord(
  scoreRepo: SeedRepositories['scoreRepo'],
  scope: TenantScope,
  probateCase: ProbateCase,
  parcel: PropertyParcel,
  authority: AuthorityAssessment,
  ownership: OwnershipAssessment
) {
  console.log(`\n[5/7] Computing Deterministic Opportunity Score...`);
  const scoreResult = calculateOpportunityScore(`score_${Date.now()}`, {
    organizationId: scope.organizationId,
    opportunityId: probateCase.id,
    countyId: 'county_travis_tx',
    property: parcel,
    authority,
    ownership,
    filingDate: probateCase.filingDate,
    estimatedLiensOrMortgageAmount: 75000,
  });

  await scoreRepo.create(scope, {
    opportunityId: probateCase.id,
    countyId: 'county_travis_tx',
    equityScore: scoreResult.equityScore,
    authorityScore: scoreResult.authorityScore,
    riskScore: scoreResult.riskScore,
    compositeScore: scoreResult.compositeScore,
    priorityBand: scoreResult.priorityBand,
    breakdown: scoreResult.breakdown,
    ruleVersion: scoreResult.ruleVersion,
    evaluatedAt: scoreResult.evaluatedAt,
    schemaVersion: 1,
  });

  console.log(`      Rule Version: ${scoreResult.ruleVersion}`);
  console.log(`      Composite Score: ${scoreResult.compositeScore}/100`);
  console.log(`      Priority Band: ${scoreResult.priorityBand}`);

  return scoreResult;
}

async function seedExceptionAndQc(repos: SeedRepositories, scope: TenantScope, caseId: string) {
  console.log(`\n[6/7] Forcing Ambiguity Exception & Resolving via Human Review Gate...`);
  const exception = await repos.excRepo.create(scope, {
    countyId: 'county_travis_tx',
    opportunityId: caseId,
    type: 'TITLE_CONFLICT',
    status: 'PENDING_REVIEW',
    description: 'TCAD lists owner as "JENKINS ARTHUR J" while probate caption reads "Arthur James Jenkins". Confirmed middle name identity match.',
    schemaVersion: 1,
  });

  const resolved = await repos.excRepo.update(scope, exception.id, {
    status: 'RESOLVED',
    resolutionNote: 'Reviewed middle name on death certificate attachment; identity affirmed.',
    resolvedAt: new Date().toISOString(),
  });
  console.log(`      Exception ${resolved?.id} resolved: ${resolved?.status}`);

  const qcReview = await repos.qcRepo.create(scope, {
    countyId: 'county_travis_tx',
    opportunityId: caseId,
    reviewerId: 'user_qc_lead_01',
    decision: 'APPROVED_FOR_DELIVERY',
    gates: [
      { gateName: 'Mandatory Primary Evidence Attached', passed: true },
      { gateName: 'Authority Tier >= 2', passed: true },
      { gateName: 'Zero Unresolved Exceptions', passed: true },
      { gateName: 'Legal Disclaimer Present', passed: true },
    ],
    reviewedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
  console.log(`      QC Decision: ${qcReview.decision}`);
}

async function seedOpportunityRecord(
  oppRepo: SeedRepositories['oppRepo'],
  scope: TenantScope,
  probateCase: ProbateCase,
  parcel: PropertyParcel,
  authority: AuthorityAssessment,
  ownership: OwnershipAssessment,
  scoreResult: OpportunityScore
) {
  const currentSnapshot = buildOpportunitySnapshot({
    caseNumber: probateCase.caseNumber,
    decedentName: probateCase.decedentName,
    filingDate: probateCase.filingDate,
    property: parcel,
    authority,
    ownership,
    score: scoreResult,
    unresolvedExceptionsCount: 0,
  });

  const opportunity = await oppRepo.create(scope, {
    countyId: 'county_travis_tx',
    caseId: probateCase.id,
    parcelId: parcel.id,
    status: 'QC_APPROVED',
    currentSnapshot,
    schemaVersion: 1,
  });
  console.log(`      Operational Opportunity Projection created: ${opportunity.id} (Status: ${opportunity.status})`);
  return opportunity;
}

export interface SeedScoringAndExceptionsParams {
  repos: SeedRepositories;
  scope: TenantScope;
  probateCase: ProbateCase;
  parcel: PropertyParcel;
  authority: AuthorityAssessment;
  ownership: OwnershipAssessment;
}

async function seedScoringAndExceptions(params: SeedScoringAndExceptionsParams) {
  const { repos, scope, probateCase, parcel, authority, ownership } = params;
  const scoreResult = await seedScoringRecord(repos.scoreRepo, scope, probateCase, parcel, authority, ownership);
  await seedExceptionAndQc(repos, scope, probateCase.id);
  await seedOpportunityRecord(repos.oppRepo, scope, probateCase, parcel, authority, ownership, scoreResult);
  return scoreResult;
}

export interface BuildPofPayloadParams {
  clientScope: TenantScope;
  probateCase: ProbateCase;
  parcel: PropertyParcel;
  authority: AuthorityAssessment;
  ownership: OwnershipAssessment;
  scoreResult: OpportunityScore;
  sourceDoc: SourceDocument;
  evidenceRecord: ClaimEvidence;
}

function buildPofPayload(params: BuildPofPayloadParams) {
  const {
    probateCase,
    parcel,
    authority,
    ownership,
    scoreResult,
    sourceDoc,
    evidenceRecord,
  } = params;

  return {
    countyId: 'county_travis_tx',
    caseNumber: probateCase.caseNumber,
    decedentName: probateCase.decedentName,
    filingDate: probateCase.filingDate,
    property: {
      apn: parcel.apn,
      addressText: `${parcel.address.street}, ${parcel.address.city}, ${parcel.address.state} ${parcel.address.zipCode}`,
      assessedValue: parcel.totalAssessedValue,
      estimatedEquity: 630000,
      recordsLocated: true,
    },
    ownership: {
      status: ownership.status,
      verifiedOwners: ownership.ownerNames,
    },
    authority: {
      status: authority.status,
      tier: authority.tier,
      fiduciaryName: authority.fiduciary?.fullName ?? null,
      fiduciaryRole: authority.fiduciary?.role ?? 'UNAPPOINTED',
      lettersIssued: authority.fiduciary?.lettersIssued ?? false,
    },
    scoring: {
      compositeScore: scoreResult.compositeScore,
      priorityBand: scoreResult.priorityBand,
      ruleVersion: scoreResult.ruleVersion,
    },
    evidence: [
      {
        claimPath: 'authority.fiduciary',
        factSummary: 'Letters Testamentary issued to Sarah Louise Jenkins',
        sourceDocumentName: sourceDoc.filename,
        pageNumber: 1,
        excerpt: evidenceRecord.excerpt,
        artifactSha256: sourceDoc.artifactSha256,
        signedViewUrl: `https://storage.googleapis.com/signed-viewer/travis/${sourceDoc.artifactSha256}?exp=3600`,
      },
    ],
    recommendedAction: 'Engage Executor directly. Title is clear and letters are issued.',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

export interface PublishPofDeliveryParams extends BuildPofPayloadParams {
  pofRepo: SeedRepositories['pofRepo'];
}

async function publishPofDelivery(params: PublishPofDeliveryParams) {
  const { pofRepo, clientScope } = params;
  console.log(`\n[7/7] Publishing Probate Opportunity File (POF) to Client Organization...`);
  const payload = buildPofPayload(params);
  const pof = await pofRepo.create(clientScope, payload);

  console.log(`\n===============================================================`);
  console.log(`  PROBATE OPPORTUNITY FILE PUBLISHED SUCCESSFULLY`);
  console.log(`  POF ID:         ${pof.id}`);
  console.log(`  Client Org:     ${clientScope.clientId}`);
  console.log(`  Case / County:  ${pof.caseNumber} / Travis County, TX`);
  console.log(`  Fiduciary:      ${pof.authority.fiduciaryName} (${pof.authority.fiduciaryRole})`);
  console.log(`  Priority:       ${pof.scoring.priorityBand} (Score: ${pof.scoring.compositeScore}/100)`);
  console.log(`  Disclaimer:     "${pof.disclaimer}"`);
  console.log(`===============================================================\n`);

  return pof;
}

export async function runOneCountyVerticalSlice() {
  console.log('===============================================================');
  console.log('  GIENI OS: ONE-COUNTY VERTICAL SLICE SEEDER (TRAVIS COUNTY, TX)');
  console.log('===============================================================');

  const db = await connectToMongoIfAvailable();

  const operatorScope: TenantScope = {
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
  };
  const clientScope: TenantScope = {
    organizationId: 'org_gieni_internal',
    clientId: 'client_austin_capital_partners',
    countyId: 'county_travis_tx',
  };

  const repos = initSeedRepositories(db);

  const { sourceDoc, docHash } = await seedPrimaryDocument(repos.docRepo, operatorScope);
  const probateCase = await seedProbateCase(repos.caseRepo, operatorScope);
  const { proposedClaim, evidenceRecord } = await seedClaimAndEvidence(
    repos.claimRepo,
    operatorScope,
    sourceDoc.id,
    probateCase.id,
    docHash
  );

  const { parcel, ownership, authority } = await seedPropertyAndAssessments({
    repos,
    scope: operatorScope,
    sourceDocId: sourceDoc.id,
    probateCaseId: probateCase.id,
    proposedClaimId: proposedClaim.id,
    evidenceRecordId: evidenceRecord.id,
  });

  const scoreResult = await seedScoringAndExceptions({
    repos,
    scope: operatorScope,
    probateCase,
    parcel,
    authority,
    ownership,
  });

  const pof = await publishPofDelivery({
    pofRepo: repos.pofRepo,
    clientScope,
    probateCase,
    parcel,
    authority,
    ownership,
    scoreResult,
    sourceDoc,
    evidenceRecord,
  });

  await closeMongoClient();
  return { sourceDoc, probateCase, pof, scoreResult };
}


// Auto-run if executed directly via node
runOneCountyVerticalSlice().catch(async (err) => {
  console.error('[Seeder Error]', err);
  await closeMongoClient();
  process.exit(1);
});
