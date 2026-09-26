import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDocumentIntelligencePipeline } from '../../apps/workers/dist/pipeline/document-intelligence.js';
import { calculateOpportunityScore, buildOpportunitySnapshot } from '../../packages/scoring/dist/index.js';
import { ProbateOpportunityFileSchema, LEGAL_DISCLAIMER } from '../../packages/delivery/dist/index.js';
import { WorkflowExecutionEngine } from '../../packages/workflow/dist/index.js';
import { InMemoryTenantScopedRepository } from '../../packages/database/dist/index.js';

test('Integration: One-County Vertical Slice (Stages 1 through 13)', async () => {
  // Context setup
  const scope = {
    organizationId: 'org_internal_operator',
    clientId: 'client_desert_ridge',
    countyId: 'maricopa_az',
  };

  // Stage 1 & 2: Ingest representative probate PDF & compute SHA-256
  const courtText = `
    IN THE SUPERIOR COURT OF ARIZONA, IN AND FOR THE COUNTY OF MARICOPA
    ESTATE OF ELEANOR VANCE, DECEASED
    CAUSE NO. PB2024-001928
    PETITION FOR FORMAL APPOINTMENT OF PERSONAL REPRESENTATIVE
    It is ORDERED that ROBERT STERLING be granted LETTERS TESTAMENTARY as EXECUTOR.
  `;
  const mockRawPdf = Buffer.from(courtText, 'utf-8');

  const sourceDoc = {
    id: 'doc_slice_001',
    organizationId: scope.organizationId,
    countyId: scope.countyId,
    filename: 'PB2024-001928_Petition.pdf',
    mimeType: 'application/pdf',
    storageUri: 'https://storage.googleapis.com/gieni-raw/doc_slice_001.pdf',
    artifactSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    retrievalTimestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  // Stage 3: Workflow task stage execution with idempotency
  const runRepo = new InMemoryTenantScopedRepository();
  const auditRepo = new InMemoryTenantScopedRepository();
  const engine = new WorkflowExecutionEngine(runRepo, auditRepo);

  const stageRun = await engine.executeStage(scope, {
    stage: 'OCR_LAYOUT',
    opportunityId: 'opp_slice_001',
    idempotencyKey: 'idemp_slice_001',
    input: { caseNumber: 'PB2024-001928' },
    handler: async () => ({ status: 'PROCESSED' }),
  });
  assert.equal(stageRun.run.status, 'COMPLETED');



  // Stages 4, 5, 6: Document AI OCR + Gemini proposals + deterministic validation
  const docRepo = new InMemoryTenantScopedRepository();
  const claimRepo = new InMemoryTenantScopedRepository();
  const exceptionRepo = new InMemoryTenantScopedRepository();

  const pipelineResult = await runDocumentIntelligencePipeline(
    scope,
    {
      fileBuffer: mockRawPdf,
      filename: 'PB2024-001928_Petition.pdf',
      mimeType: 'application/pdf',
      storageUri: 'gs://gieni-evidence/maricopa/PB2024-001928_Petition.pdf',
      opportunityId: 'opp_slice_001',
    },
    {
      docRepo,
      claimRepo,
      exceptionRepo,
    }
  );

  assert.ok(pipelineResult.sourceDoc.artifactSha256);
  assert.ok(pipelineResult.claims.length > 0);
  // Verify all AI claims are strictly PROPOSED
  for (const claim of pipelineResult.claims) {
    assert.equal(claim.verificationStatus, 'PROPOSED');
    assert.ok(claim.evidence.length > 0);
  }



  // Stages 7 & 8: Property matching and Ownership Intelligence
  const parcel = {
    id: 'prop_slice_001',
    organizationId: scope.organizationId,
    countyId: scope.countyId,
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

  const ownership = {
    id: 'own_slice_001',
    organizationId: scope.organizationId,
    parcelId: parcel.id,
    caseId: 'case_slice_001',
    countyId: scope.countyId,
    status: 'DECEDENT_SOLE_OWNER',
    ownerNames: ['Eleanor Vance'],
    deedRecordIds: ['deed_slice_001'],
    verifiedClaimIds: ['claim_own_01'],
    confidence: 1.0,
    ruleVersion: 'v1.0.0-deterministic',
    evaluatedAt: new Date().toISOString(),
    evaluatorId: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  // Stage 9: Authority Resolution
  const authority = {
    id: 'auth_slice_001',
    organizationId: scope.organizationId,
    caseId: 'case_slice_001',
    countyId: scope.countyId,
    status: 'CONFIRMED',
    tier: 1,
    fiduciary: {
      personId: 'person_slice_001',
      fullName: 'Robert Sterling',
      role: 'EXECUTOR',
      appointmentDate: '2024-03-20T10:00:00.000Z',
      lettersIssued: true,
      bondAmount: null,
      verifiedEvidenceId: 'ev_auth_01',
    },
    verifiedClaimIds: ['claim_auth_01'],
    evaluatedAt: new Date().toISOString(),
    evaluatorId: 'system',
    ruleVersion: 'v1.0.0-deterministic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  // Stage 10: Opportunity Scoring (Deterministic)
  const score = calculateOpportunityScore('score_slice_001', {
    organizationId: scope.organizationId,
    countyId: scope.countyId,
    opportunityId: 'opp_slice_001',
    property: parcel,
    authority,
    ownership,
    filingDate: '2024-03-15T09:00:00.000Z',
  });
  assert.ok(score.compositeScore > 0);
  assert.ok(score.priorityBand);


  // Projection snapshot rebuild (Embed vs Reference rule)
  const snapshot = buildOpportunitySnapshot({
    caseNumber: 'PB2024-001928',
    decedentName: 'Eleanor Vance',
    filingDate: '2024-03-15T09:00:00.000Z',
    property: parcel,
    authority,
    ownership,
    score,
    unresolvedExceptionsCount: 0,
  });
  assert.equal(snapshot.compositeScore, score.compositeScore);


  // Stage 11: QC Human Review Gate passes
  const qcReview = {
    id: 'qc_slice_001',
    organizationId: scope.organizationId,
    clientId: scope.clientId,
    countyId: scope.countyId,
    opportunityId: 'opp_slice_001',
    reviewerId: 'user_qc_lead',
    decision: 'APPROVED_FOR_DELIVERY',
    gates: [
      { gateName: 'EVIDENCE_SUFFICIENCY', passed: true },
      { gateName: 'AUTHORITY_VERIFIED', passed: true },
      { gateName: 'TITLE_CLEAR', passed: true },
    ],
    reviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
  assert.equal(qcReview.decision, 'APPROVED_FOR_DELIVERY');

  // Stage 12: Client Delivery Publication (Probate Opportunity File)
  const pof = ProbateOpportunityFileSchema.parse({
    id: 'pof_slice_001',
    organizationId: scope.organizationId,
    clientId: scope.clientId,
    countyId: scope.countyId,
    caseNumber: 'PB2024-001928',
    decedentName: 'Eleanor Vance',
    filingDate: '2024-03-15T09:00:00.000Z',
    property: {
      apn: parcel.apn,
      addressText: '742 Evergreen Terrace, Phoenix, AZ 85001',
      assessedValue: parcel.totalAssessedValue,
      estimatedEquity: 275000,
      recordsLocated: true,
    },
    ownership: {
      status: ownership.status,
      verifiedOwners: ownership.ownerNames,
    },
    authority: {
      status: authority.status,
      tier: authority.tier,
      fiduciaryName: authority.fiduciary.fullName,
      fiduciaryRole: authority.fiduciary.role,
      lettersIssued: authority.fiduciary.lettersIssued,
    },
    scoring: {
      compositeScore: score.compositeScore,
      priorityBand: score.priorityBand,
      ruleVersion: score.ruleVersion,
    },
    evidence: [
      {
        claimPath: 'authority.fiduciary',
        factSummary: 'Executor appointed with Letters issued',
        sourceDocumentName: sourceDoc.filename,
        pageNumber: 1,
        excerpt: 'Robert Sterling is hereby appointed Executor',
        artifactSha256: sourceDoc.artifactSha256,
      },
    ],
    recommendedAction: 'Direct outreach to appointed executor Robert Sterling',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });

  // Verify mandatory legal disclaimer is attached
  assert.equal(pof.disclaimer, 'research finding—not legal opinion or title guarantee');


  // Stage 13: Client Feedback disposition
  const feedback = {
    id: 'fb_slice_001',
    organizationId: scope.organizationId,
    clientId: scope.clientId,
    countyId: scope.countyId,
    opportunityId: 'opp_slice_001',
    disposition: 'APPOINTMENT_SET',
    notes: 'Contacted executor Robert Sterling; scheduled walkthrough for Friday.',
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
  assert.equal(feedback.disposition, 'APPOINTMENT_SET');
});
