import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTenantScopedRepository } from '../../packages/database/dist/index.js';
import { WorkflowExecutionEngine } from '../../packages/workflow/dist/index.js';
import { runDocumentIntelligencePipeline } from '../../apps/workers/dist/pipeline/document-intelligence.js';

test('Workflow Engine: executes stage, records run, and enforces idempotency replay', async () => {
  const runRepo = new InMemoryTenantScopedRepository();
  const auditRepo = new InMemoryTenantScopedRepository();
  const engine = new WorkflowExecutionEngine(runRepo, auditRepo);

  const scope = {
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
  };

  let executionCounter = 0;
  const handler = async (input) => {
    executionCounter++;
    return { processedCount: 42, caseNumber: input.caseNumber };
  };

  // First run: executes handler
  const result1 = await engine.executeStage(scope, {
    stage: 'OCR_LAYOUT',
    idempotencyKey: 'idemp_key_test_001',
    input: { caseNumber: 'PR-2026-001' },
    handler,
  });

  assert.equal(result1.isIdempotentReplay, false);
  assert.equal(result1.run.status, 'COMPLETED');
  assert.equal(result1.output.processedCount, 42);
  assert.equal(executionCounter, 1);

  // Second run with same idempotency key: skips execution and replays cached result
  const result2 = await engine.executeStage(scope, {
    stage: 'OCR_LAYOUT',
    idempotencyKey: 'idemp_key_test_001',
    input: { caseNumber: 'PR-2026-001' },
    handler,
  });

  assert.equal(result2.isIdempotentReplay, true);
  assert.equal(result2.run.status, 'COMPLETED');
  assert.equal(result2.output.processedCount, 42);
  assert.equal(executionCounter, 1); // Handler NOT called again

  // Verify AuditEvents were recorded
  const audits = await auditRepo.findMany(scope);
  assert.ok(audits.length >= 2);
  assert.ok(audits.some((a) => a.action.includes('WORKFLOW_STAGE_COMPLETED:OCR_LAYOUT')));
});

test('Workflow Engine: fails to DEAD_LETTER when maxAttempts is reached', async () => {
  const runRepo = new InMemoryTenantScopedRepository();
  const auditRepo = new InMemoryTenantScopedRepository();
  const engine = new WorkflowExecutionEngine(runRepo, auditRepo);

  const scope = {
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
  };

  const failingHandler = async () => {
    throw new Error('Court docket portal connection timed out');
  };

  // Attempt 1: maxAttempts = 1 -> should immediately transition to DEAD_LETTER
  await assert.rejects(
    async () => {
      await engine.executeStage(scope, {
        stage: 'DOCUMENT_INGEST',
        idempotencyKey: 'idemp_fail_001',
        maxAttempts: 1,
        input: { url: 'https://broken-court.gov' },
        handler: failingHandler,
      });
    },
    /DEAD_LETTER/
  );

  const runs = await runRepo.findMany(scope);
  assert.equal(runs[0].status, 'DEAD_LETTER');
  assert.equal(runs[0].attemptCount, 1);
  assert.match(runs[0].errorMessage, /Court docket portal connection timed out/);
});

test('Document/AI Pipeline: proposals are strictly PROPOSED claims with authentic evidence', async () => {
  const docRepo = new InMemoryTenantScopedRepository();
  const claimRepo = new InMemoryTenantScopedRepository();
  const exceptionRepo = new InMemoryTenantScopedRepository();

  const scope = {
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
  };

  const sampleDocText = `
    IN THE PROBATE COURT NO. 1, TRAVIS COUNTY, TEXAS
    ESTATE OF ARTHUR JAMES JENKINS, DECEASED
    CAUSE NO. C-1-PB-26-000412
    LETTERS TESTAMENTARY
    It is ORDERED that SARAH LOUISE JENKINS be granted LETTERS TESTAMENTARY.
  `;

  const result = await runDocumentIntelligencePipeline(
    scope,
    {
      fileBuffer: Buffer.from(sampleDocText, 'utf-8'),
      filename: 'letters_testamentary.pdf',
      mimeType: 'application/pdf',
      storageUri: 'gs://gieni-evidence/test/letters.pdf',
    },
    {
      docRepo,
      claimRepo,
      exceptionRepo,
    }
  );

  // 1. Verify primary source document preserved with authentic SHA-256
  assert.ok(result.sourceDoc.artifactSha256);
  assert.equal(result.sourceDoc.artifactSha256.length, 64); // Valid SHA-256 hex length

  // 2. Verify Claims: MUST be stored as PROPOSED (LLM proposals are NOT facts)
  assert.ok(result.claims.length > 0);
  for (const claim of result.claims) {
    assert.equal(claim.claimType, 'EXTRACTED');
    assert.equal(claim.verificationStatus, 'PROPOSED');
    assert.ok(claim.evidence.length > 0);
    assert.equal(claim.evidence[0].sourceDocumentId, result.sourceDoc.id);
    assert.equal(claim.evidence[0].artifactSha256, result.sourceDoc.artifactSha256);
  }
});

test('Document/AI Pipeline: rejects synthetic Vance fiduciaries and quarantines to exception queue', async () => {
  const docRepo = new InMemoryTenantScopedRepository();
  const claimRepo = new InMemoryTenantScopedRepository();
  const exceptionRepo = new InMemoryTenantScopedRepository();

  const scope = {
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
  };

  // Simulate an OCR text with no named executor where a weak model might synthesize "Thomas Vance"
  const vagueDocText = `
    ESTATE OF JANE DOE
    CAUSE NO. 24-0099
    Notice of Hearing. No executor yet appointed.
  `;

  // Inject a mock Gemini extractor that erroneously attempts to propose "Thomas Vance"
  const mockVanceExtractor = async () => ({
    decedentName: 'Jane Doe',
    decedentConfidence: 0.95,
    caseNumber: '24-0099',
    caseNumberConfidence: 0.95,
    filingDate: '2026-01-15T00:00:00.000Z',
    courtName: 'Probate Court',
    fiduciary: {
      fullName: 'Thomas Vance', // Prohibited synthetic placeholder
      role: 'EXECUTOR',
      lettersIssued: false,
      bondAmount: null,
      confidence: 0.5,
    },
    propertyClues: [],
    evidenceExcerpts: [
      {
        fieldPath: 'authority.fiduciary',
        pageNumber: 1,
        sourceLocator: 'p1_line1',
        excerpt: 'Notice of Hearing',
      },
    ],
  });

  const result = await runDocumentIntelligencePipeline(
    scope,
    {
      fileBuffer: Buffer.from(vagueDocText, 'utf-8'),
      filename: 'vague_filing.pdf',
      mimeType: 'application/pdf',
      storageUri: 'gs://gieni-evidence/test/vague.pdf',
    },
    {
      docRepo,
      claimRepo,
      exceptionRepo,
      geminiExtractor: mockVanceExtractor,
    }
  );

  // Fiduciary must be stripped of synthetic Vance and set to null
  const fidClaim = result.claims.find((c) => c.fieldPath === 'authority.fiduciary');
  assert.ok(fidClaim);
  assert.equal(fidClaim.proposedValue, null);

  // Must trigger an InvestigationException with AUTHORITY_UNRESOLVED
  assert.ok(result.exceptions.length > 0);
  assert.equal(result.exceptions[0].type, 'AUTHORITY_UNRESOLVED');
  assert.equal(result.exceptions[0].status, 'PENDING_REVIEW');
});
