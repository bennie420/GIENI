import fs from 'node:fs';
import path from 'node:path';

const AUDIT_FILES = [
  // Architectural specifications & rules
  'AGENTS.md',
  'PLAN.Md',
  '.codescene/architecture.json',
  'docs/rules/security-and-tenancy.md',
  'package.json',

  // Web Layer & Auth Context
  'apps/web/src/middleware.ts',
  'apps/web/src/lib/tenant-context.ts',
  'apps/web/src/lib/data.ts',
  'apps/web/src/lib/actions.ts',

  // Workers & Extraction Pipeline
  'apps/workers/src/index.ts',
  'apps/workers/src/pipeline/document-intelligence.ts',
  'apps/workers/src/seed.ts',

  // Database Bounded Context
  'packages/database/src/client.ts',
  'packages/database/src/mongo-repository.ts',
  'packages/database/src/repository.ts',
  'packages/database/src/schemas.ts',

  // Authz & Tenancy Bounded Context
  'packages/authz/src/tenant.ts',
  'packages/authz/src/data-classification.ts',
  'packages/authz/src/permissions.ts',
  'packages/authz/src/schemas.ts',

  // Evidence & Claim Audit Trail Bounded Context
  'packages/evidence/src/types.ts',
  'packages/evidence/src/schemas.ts',

  // Control Bounded Context
  'packages/control/src/invariants.ts',
  'packages/control/src/schemas.ts',

  // Scoring & Governance Bounded Context
  'packages/scoring/src/engine.ts',
  'packages/scoring/src/coefficients.ts',
  'packages/scoring/src/signals.ts',

  // Resilience & Circuit Breakers Bounded Context
  'packages/resilience/src/engine.ts',
  'packages/resilience/src/schemas.ts',

  // Quality Control Bounded Context
  'packages/qc/src/routing.ts',
  'packages/qc/src/queue-health.ts',
  'packages/qc/src/schemas.ts',

  // Delivery & Dispatcher Bounded Context
  'packages/delivery/src/eligibility.ts',
  'packages/delivery/src/dispatcher.ts',

  // Workflow, Tracing & Queue Abstraction Bounded Context
  'packages/workflow/src/engine.ts',
  'packages/workflow/src/queue-adapter.ts',
  'packages/workflow/src/tracing.ts',

  // Verification Test Suites
  'tests/unit/security-boundaries.test.js',
  'tests/unit/delivery-boundaries.test.js',
  'tests/unit/control-domain.test.js',
  'tests/unit/resilience-and-tracing.test.js',
  'tests/unit/coefficients-and-governance.test.js',
  'tests/unit/scale-and-signals.test.js',
  'tests/integration/one-county-slice.test.js',
];

const header = `================================================================================
GIENI OS — COMPREHENSIVE ARCHITECTURAL AUDIT BUNDLE FOR MICROSOFT COPILOT
================================================================================
TARGET: Gieni OS (Probate Intelligence & Investigation Platform)
REVISION: post-P0-P3 Remediation Build (commit c32e605)
DATE: September 2026

INSTRUCTIONS FOR COPILOT AUDITOR:
Please conduct a rigorous, forensic Security, Architecture, Compliance, and Code Quality
Audit of this repository bundle.

Context & Remediation Background:
An earlier audit assessed the system architecture at 8.3/10, noting strong foundations
(Claim-Evidence Triad, deterministic scoring, untrusted AI boundaries) but identified
several critical and high-priority gaps (P0, P1, P2, P3).

This bundle contains the complete source code of the remediated system across all 14 workspaces.
Please evaluate whether the following requirements and remediation targets have been fully,
authentically, and securely met without shortcuts or synthetic workarounds:

1. Dynamic Clerk Tenant Binding (P0-1):
   - Is TenantScope strictly derived from authenticated Clerk session tokens (orgId, userId, role)?
   - Are county licensing checks enforced against the tenant's licensed list?
   - Have hardcoded tenant IDs been eliminated from production lifecycles?

2. Claim Audit Event Stream (P0-2):
   - Is an immutable, tamper-evident ClaimAuditEvent stream recorded on all claim transitions?
   - Are transitions (CREATED, VERIFIED, REJECTED, SUPERSEDED, DELIVERED, ROLLED_BACK) tracked with actorId and rationale?

3. Complete Extraction-to-Claim Mapping (P0-3):
   - Does Document AI / Gemini extraction map ALL fields (decedent, case, court, filing date, property clue, authority)
     atomically to Claim records with exact SHA-256 evidence links and PROPOSED status?
   - Are unverified AI outputs strictly barred from being stored as facts?

4. Centralized Delivery Eligibility Engine (P0-4):
   - Is delivery strictly gated to prevent Authority Tier 4 (unappointed/speculative fiduciaries) from delivery?
   - Are unverified PROPOSED claims and uncertified QC reviews blocked from commercial publication?

5. Fault Isolation & Circuit Breakers (P1-1):
   - Does the resilience engine provide county-level fault isolation?
   - Are failed jobs safely parked with HMAC cryptographic replay protection?

6. High-Value Ambiguity Soft-Gates (P1-2):
   - Are high-value cases (>= $500k) routed for senior review without blocking healthy county throughput?

7. Control Domain Separation (P1-3):
   - Does the architecture strictly decouple Property != Ownership != Control != Authority?
   - Is it proven that nominal deed title does NOT imply probate authority, and POA terminates upon death?

8. Correlation IDs & Distributed Tracing (P1-4):
   - Are correlationId and workflowRunId propagated across HTTP, worker pipelines, and Sentry scope tags?

9. Coefficient Governance & Health Metrics (P2-1, P2-2):
   - Do weight adjustments require human reviewer certification (certifierId) and strict sum-to-1.0 conservation?
   - Does the QC queue monitor backlog depth, latency, and SLA breach risks?

10. Webhook Security & Data Classification (P2-3, P2-4):
    - Are outbound webhooks secured with HMAC-SHA256 signatures, timestamp tolerances, and replay nonces?
    - Are domain schemas categorized into regulatory classification tiers (PUBLIC_RECORD -> REGULATED)?

11. Architectural Directionality & Infrastructure Evolution (P3-1, P3-2, P3-3):
    - Does CodeScene configuration enforce strict low-to-high package import rules?
    - Are adaptive learning signals tracked across fast (daily) vs slow (monthly) commercial feedback?
    - Is queue orchestration abstracted (IWorkflowQueueAdapter) with volume threshold gates for future Temporal/BullMQ migration?

12. Verification & Authentic Execution:
    - Are the 45 unit and integration tests authentic, testing real system logic without test-flag short-circuiting?
    - Are synthetic "Vance" family fiduciaries and fake deeds strictly eliminated?
================================================================================

`;

let output = header;

for (const relPath of AUDIT_FILES) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  output += `\n===== FILE: ${relPath} =====\n\n`;
  output += content;
  output += '\n';
}

fs.writeFileSync(path.resolve(process.cwd(), 'copilot-audit.txt'), output, 'utf-8');
console.log(`Generated copilot-audit.txt successfully. Size: ${(output.length / 1024).toFixed(1)} KB across ${AUDIT_FILES.length} files.`);
