
---

## 11. Security, Compliance & Implementation Audit Backlog (Post Source-Audit Review)

### Overall Assessment
This is a stellar and validating audit review (**8.3/10** overall). It confirms that the core architectural invariants—the **Claim–Evidence Triad**, deterministic scoring, authentic delivery validation, and strict untrusted AI boundaries—are sound and in place.

Here is an analysis of the auditor's findings alongside a concrete remediation blueprint.

---

### Key Strengths Confirmed by Audit
1. **True AI Trust Boundary (Grade: A)**: Gemini extractions are stored strictly as `Claim` with `verificationStatus: 'PROPOSED'` and verified SHA-256 locator links in [document-intelligence.ts](file:///c:/Users/ben/GIENI/apps/workers/src/pipeline/document-intelligence.ts#L149-L165).
2. **Authentic Delivery Pipeline (Grade: A-)**: [dispatcher.ts](file:///c:/Users/ben/GIENI/packages/delivery/src/dispatcher.ts#L12-L25) strictly enforces live HTTP `200-299` validation before marking delivery successful.
3. **Resilient Workflows (Grade: A)**: Deterministic idempotency keys and state transition audits (`COMPLETED`, `RETRYING`, `DEAD_LETTER`) in [engine.ts](file:///c:/Users/ben/GIENI/packages/workflow/src/engine.ts).
4. **Tenant Isolation Testing**: Hard guarantees verified in [security-boundaries.test.js](file:///c:/Users/ben/GIENI/tests/unit/security-boundaries.test.js).

---

### Audit Critique & Remediation Roadmap

| Priority | Auditor Finding | Impact / Risk | Proposed Remediation |
| :--- | :--- | :--- | :--- |
| **P0** | **Hardcoded Clerk Scopes** (`OPERATOR_SCOPE`, `CLIENT_SCOPE`) in [data.ts](file:///c:/Users/ben/GIENI/apps/web/src/lib/data.ts) & [actions.ts](file:///c:/Users/ben/GIENI/apps/web/src/lib/actions.ts) | Multi-tenant leak; viewers share identical hardcoded org IDs | Derive `TenantScope` dynamically using Clerk server-side `auth()` (`orgId`, `userId`, org role) with fallback error for unauthenticated calls. |
| **P0** | **Partial Claim Extraction** | Only `authority.fiduciary` is converted to claims; `decedentName`, `caseNumber`, `filingDate`, `courtName`, `propertyClues` are discarded | Extend [document-intelligence.ts](file:///c:/Users/ben/GIENI/apps/workers/src/pipeline/document-intelligence.ts) to emit `Claim` and `ClaimEvidence` records for all extracted document fields. |
| **P0** | **Missing Evidence Audit Stream** | Evidence transitions (`PROPOSED` $\to$ `VERIFIED` $\to$ `REJECTED`) have no immutable audit log | Add `ClaimAuditEvent` collection in [`packages/evidence`](file:///c:/Users/ben/GIENI/packages/evidence) and record every transition event with actor ID, timestamp, and rationale. |
| **P0** | **Missing `packages/control` Bounded Context** | Risk of conflating Property Ownership with Legal Control / Authority | Scaffold `packages/control` to formally decouple title holding (Ownership) from managerial/legal agency (Control & Authority). |
| **P1** | **Authority Tier 4 Delivery Gate** | Tier 4 unappointed/speculative fiduciaries could slip into client publication | Add explicit guard in [`packages/qc`](file:///c:/Users/ben/GIENI/packages/qc) / [`packages/delivery`](file:///c:/Users/ben/GIENI/packages/delivery) blocking Tier 4 publication + unit tests. |
| **P1** | **Observability Tracing & Sentry** | Sentry errors lack context correlation | Inject `workflowRunId`, `correlationId`, `claimId`, and `caseId` tags into Sentry / logger scopes. |
| **P1** | **Scoring Weights Alignment** | Spec mentions Equity, Authority, Distress, Fit; implementation uses Authority, Ownership, Equity, Freshness | Align or reconcile documentation with deterministic engine weights in [engine.ts](file:///c:/Users/ben/GIENI/packages/scoring/src/engine.ts). |

---

### Critical Gaps (P0)

#### 1. Clerk Identity Binding Is Not Defined
- **Problem**: The specification requires tenant-scoped controls but does not explicitly mandate that:
  $$\text{TenantScope} \equiv \text{Derived from authenticated Clerk session}$$
  Current implementation contains hardcoded operator/client scopes (`OPERATOR_SCOPE`, `CLIENT_SCOPE`), which must never exist in production.
- **Contract Addition**:
  ```typescript
  export interface AuthenticatedTenantContext {
    clerkUserId: string;
    clerkOrgId: string;
    role: ClerkRole;
    licensedCountyIds: string[];
  }
  ```
- **Requirement**: Every API route, server action, worker task, replay operation, circuit-breaker action, exception resolution, and delivery action must derive authorization from a verified Clerk session—never trusted from client payloads or static constants.

#### 2. Missing Immutable Claim Audit Trail
- **Problem**: Workflow execution has state transition auditing, but evidence-related claim mutations currently lack immutable historical auditing (`PROPOSED` → `VERIFIED` happens without an audit trail).
- **Required Collections**:
  - `claimAuditEvents`
  - `evidenceAuditEvents`
  - `authorityAuditEvents`
  - `qcDecisionAuditEvents`
- **Tracked Events**: `CREATED`, `VERIFIED`, `REJECTED`, `SUPERSEDED`, `DELIVERED`, `ROLLED_BACK`.

#### 3. Missing Data Retention Policy
- **Problem**: The specification defines storage schemas but lacks explicit legal/contractual retention policies.
- **Required Retention Schedule**:
  - Court documents: Indefinite / Contractual
  - Evidence & Claims: Indefinite / Contractual
  - QC Reviews & Human Certifications: 7 years
  - Audit Events (`ClaimAuditEvent`, `WorkflowAuditEvent`): 7 years
  - System Logs: 90 days
  - Session Telemetry & Ephemeral Tokens: 30 days

#### 4. Missing Secrets and Key Rotation Policy
- **Problem**: The specification mentions secret storage in Secret Manager but does not define rotation lifecycles or expiration standards.
- **Required Rotation Lifecycles**:
  - MongoDB Atlas cluster credentials (auto-rotated / 90 days)
  - Webhook HMAC signing keys (active + rollover dual-key rotation)
  - Google Cloud Service Account keys (short-lived tokens / WIF preferred)
  - Sentry DSNs & Clerk Secret Keys

---

### High Priority Gaps (P1)

#### 5. Webhook Authenticity & Replay Protection
- **Problem**: Outbound client delivery sends HTTP POST requests and validates status `200-299`, but lacks cryptographic proof of authenticity for the recipient.
- **Required Headers & Safeguards**:
  - `X-Gieni-Signature`: HMAC-SHA256 signature generated over payload body
  - `X-Gieni-Timestamp`: UNIX timestamp for drift & replay rejection (5-minute tolerance)
  - Nonce validation to defeat replay attacks

#### 6. Missing PII Classification Model
- **Problem**: Structural PII masking exists in tests, but domain entities lack an explicit data classification taxonomy.
- **Taxonomy**: `PUBLIC_RECORD`, `BUSINESS`, `CONFIDENTIAL`, `PII`, `REGULATED`.
- **Entity Classification Matrix**:
  - `Person` (Heirs, Fiduciaries, Counsel): `CONFIDENTIAL` / `PII`
  - `Property` (Parcel facts, situs, tax assessments): `PUBLIC_RECORD`
  - `Contact Channels` (Phone numbers, email addresses): `PII` / `REGULATED`
  - `Court Records` (Probate petitions, letters, orders): `PUBLIC_RECORD`
  - `Client Feedback` (Notes, disposition, contact outcomes): `BUSINESS` / `CONFIDENTIAL`

#### 7. Incident Security Classification
- **Problem**: Incident taxonomy focuses only on operational/pipeline failures.
- **Taxonomy Additions**:
  - `SECURITY_INCIDENT`
  - `CREDENTIAL_COMPROMISE`
  - `TENANT_BREACH_ATTEMPT`
  - `DATA_EXFILTRATION`

#### 8. Human Override Governance
- **Problem**: Soft-gate overrides (e.g. bypassing ambiguity) require strict audit trails.
- **Required Audit Fields**: `approvedByUserId`, `reasonCode`, `rationaleNotes`, `evidenceReviewedIds`, `policyRuleVersion`, `timestamp`. No human override may execute without an auditable decision record.

---

### Medium Priority Gaps (P2)

#### 9. Model Governance & Coefficient Management
- **Problem**: Spec discusses adaptive coefficient changes without a formal promotion/rollback lifecycle.
- **Required Entities**: `ModelRegistry`, `CoefficientRegistry`, `CoefficientProposal`, `CoefficientVersion`.
- **Constraint**: No automatic promotion. All score weight/rule changes must be human-certified and versioned.

#### 10. Source Provenance Expansion
- **Current Evidence Schema**: `sourceDocumentId`, `pageNumber`, `excerpt`, `sourceLocator`, `artifactSha256`.
- **Required Reproducibility Fields**:
  - `documentProcessorVersion`
  - `ocrEngineVersion`
  - `geminiModelVersion`
  - `extractionPromptVersion`
  - `extractorSchemaVersion`
  - `workflowRunId`

#### 11. Replay Attack Protection for Circuit Breakers
- **Requirement**: Parked-work replay queues must enforce `replayNonce`, `replayExpiration`, and `replaySignature`.

---

### Compliance & Governance Invariants

- **Evidence Integrity**: SHA-256 calculation and provenance links are mandatory across all documents and extracted claims.
- **Explainability**: Every delivered score must output a full breakdown: rule version, individual component scores (Authority, Ownership, Equity, Freshness/Fit), and evidence justifications.
- **AI Transparency**: Mandatory assertion labels on all claims:
  - `AI_PROPOSED` (Raw Gemini output; unverified)
  - `HUMAN_VERIFIED` (Certified by QC operator)
  - `RULE_DERIVED` (Computed deterministically)

---

### Prioritized Implementation Backlog

#### P0 — Before Continuing Major Feature Work
- [x] **P0-1: Clerk-Derived Tenant Context**
  - **Objective**: Eliminate hardcoded `OPERATOR_SCOPE` and `CLIENT_SCOPE`.
  - **Affected Files**: `apps/web/src/lib/data.ts`, `apps/web/src/lib/actions.ts`, `apps/web/src/middleware.ts`, `packages/authz/*`
  - **Acceptance Criteria**: All queries derive tenant identity from Clerk session; county entitlements enforced; cross-tenant leaks blocked.
  - **Tests**: `tests/unit/security-boundaries.test.js`, `apps/web/src/lib/tenant-context.ts`
- [x] **P0-2: Claim Audit Event Store**
  - **Objective**: Immutable evidence and claim change history.
  - **New Module**: `packages/evidence` (`ClaimAuditEvent`, `claimAuditEvents` collection)
  - **Acceptance Criteria**: Every verification emits an append-only audit record.
  - **Tests**: `tests/unit/delivery-boundaries.test.js`
- [x] **P0-3: Complete Extraction-to-Claim Mapping**
  - **Objective**: Persist all Gemini extractions as claims, not just `authority.fiduciary`.
  - **Fields Extracted as Claims**: `decedentName`, `caseNumber`, `courtName`, `filingDate`, `propertyClues`.
  - **Acceptance Criteria**: Every extracted field generates paired `Claim` and `ClaimEvidence` records with SHA-256 and locators.
  - **Tests**: `tests/unit/workflow.test.js`
- [x] **P0-4: Delivery Eligibility Engine**
  - **Objective**: Centralize delivery gating rules into a single authoritative policy.
  - **Hard Rules**:
    1. Zero `PROPOSED` claims in client-facing Opportunity File.
    2. Zero unresolved critical exceptions.
    3. Authority Tier 4 (unappointed/speculative) **strictly blocked** from publication.
    4. Human QC certification required.
  - **Tests**: `tests/unit/delivery-boundaries.test.js`

#### P1 — End-to-End Demo Readiness
- [x] **P1-1: Circuit Breaker Engine (`packages/resilience`)**
  - **Entities**: `CircuitBreaker`, `SystemicIncident`, `ParkedWork`
  - **Tests**: `tests/unit/resilience-and-tracing.test.js` (county-level isolation, fault aggregation, cryptographic replay protection)
- [x] **P1-2: High-Value Ambiguity Routing**
  - **Exception Type**: `HIGH_VALUE_AMBIGUITY` soft-gate.
  - **Acceptance Criteria**: Ambiguity routes priority to senior reviewer without halting pipeline execution.
  - **Tests**: `tests/unit/resilience-and-tracing.test.js`
- [x] **P1-3: Control Domain (`packages/control`)**
  - **Purpose**: Formally decouple `Property Ownership` (deed holding) from `Control & Authority` (letters testamentary, court appointment, POA).
  - **Acceptance Criteria**: Authority model does not assume deed title implies personal representative power.
  - **Tests**: `tests/unit/control-domain.test.js`
- [x] **P1-4: Correlation IDs & Sentry Tracing**
  - **Scope**: Propagate `correlationId`, `workflowRunId`, `claimId`, and `caseId` across Next.js API, workers, MongoDB logs, and Sentry error captures.
  - **Tests**: `tests/unit/resilience-and-tracing.test.js`


#### P2 — Pilot Readiness
- [x] **P2-1: Coefficient Proposal Engine**: `CoefficientProposal`, `CoefficientVersion` registry (no automated promotion).
  - **Tests**: `tests/unit/coefficients-and-governance.test.js`
- [x] **P2-2: Review Queue Health Metrics**: Operator dashboard latency, backlog depth, and aging alerts.
  - **Tests**: `tests/unit/coefficients-and-governance.test.js`
- [x] **P2-3: Webhook Security**: HMAC-SHA256 signatures (`X-Gieni-Signature`), `X-Gieni-Timestamp`, and replay nonce/timestamp tolerance verification in delivery dispatcher.
  - **Tests**: `tests/unit/delivery-boundaries.test.js`
- [x] **P2-4: Data Classification Framework**: Enforce `PUBLIC_RECORD`, `BUSINESS`, `CONFIDENTIAL`, `PII`, `REGULATED` tags on domain schemas.
  - **Tests**: `tests/unit/coefficients-and-governance.test.js`

#### P3 — Scale
- [x] **P3-1: CodeScene Architectural Component Enforcement**: CI quality gates and `.codescene/architecture.json` preventing forbidden cross-package imports (e.g. `evidence` → `delivery`).
  - **Tests**: `tests/unit/coefficients-and-governance.test.js`
- [x] **P3-2: Adaptive Learning Signals**: Fast feedback (dispositions, contact rate, invalid rate) vs slow feedback (closed deals, revenue, cycle time) signal tracking generating human-certifiable coefficient proposals.
  - **Tests**: `tests/unit/scale-and-signals.test.js`
- [x] **P3-3: Infrastructure Evolution**: Abstracted queue orchestration (`IWorkflowQueueAdapter`, `CloudTasksWorkflowQueueAdapter`) with volume threshold evaluation (`evaluateScaleEvolution`) governing migration triggers (Cloud Tasks → BullMQ / Temporal) only when scale justifies.
  - **Tests**: `tests/unit/scale-and-signals.test.js`



---

## 12. Pilot Hardening Plan (Pre-Customer Go/No-Go)

**Objective**: Move from engineering-complete prototype to controlled pilot-ready platform with enterprise-grade security, governance, auditability, and operational controls.

### Required Platform Invariants (Phase 0 — Go/No-Go Criteria)
- [x] No hardcoded tenant identities in any production lifecycle.
- [x] No hardcoded licensed counties (dynamically resolved via `LicenseService` and validated on every request).
- [x] No unverified claim publication paths (enforced via `ClaimVerificationPolicy` and `DeliveryEligibilityEngine`).
- [x] No Authority Tier 4 delivery path (strictly blocked from publication).
- [x] Cryptographically tamper-evident audit trail for evidence lifecycle (hash-chained via `auditHash` and `previousAuditHash`).
- [x] Cross-tenant isolation validated across all bounded contexts.
- [x] Replay-safe webhook delivery with active nonce/signature tracking via `WebhookReplayRegistry`.
- [x] Security incident alerting and disaster recovery documented.

---

### Workstream 1: Security Hardening (SH)
- [x] **SH-001: Dynamic County Licensing** (`packages/authz/src/licensing.ts`):
  - Collections: `licensedOrganizations`, `licensedCounties`.
  - Services: `LicenseService`, `InMemoryLicenseRepository`.
  - Eliminates hardcoded `['county_travis_tx']`; loads permissions dynamically per organization; immediate revocation blocking.
  - **Tests**: `tests/unit/pilot-hardening.test.js`
- [x] **SH-002: Remove Production Fallback Scopes** (`apps/web/src/lib/tenant-context.ts`, `data.ts`, `actions.ts`):
  - Strictly enforce `throw UnauthorizedError` for any non-development environment.
  - Production never creates synthetic tenant context under any circumstances.
  - **Tests**: `tests/unit/pilot-hardening.test.js`
- [x] **SH-003: Webhook Replay Registry** (`packages/delivery/src/replay-registry.ts`):
  - Implement `WebhookReplayRegistry` storing `nonce`, `signature`, `expiration`, `firstSeen`.
  - Reject duplicate payloads, signature reuse, and expired timestamps.
  - **Tests**: `tests/unit/pilot-hardening.test.js`
- [x] **SH-004: Read Audit Logging** (`packages/evidence/src/read-audit.ts`):
  - Track reads of `CONFIDENTIAL`, `PII`, and `REGULATED` records.
  - Event types: `RECORD_VIEWED`, `EXPORT_CREATED`, `DOWNLOAD_GENERATED`, `SEARCH_EXECUTED`.
  - **Tests**: `tests/unit/pilot-hardening.test.js`

---

### Workstream 2: Evidence Integrity (EI)
- [x] **EI-001: Immutable Audit Chain** (`packages/evidence/src/audit-chain.ts`):
  - Extend `ClaimAuditEvent` with `auditHash` and `previousAuditHash` (`event1 -> hash1`, `event2 -> hash2(hash1)`).
  - Any record modification breaks chain verification (`verifyAuditChain`).
  - **Tests**: `tests/unit/pilot-hardening.test.js`
- [x] **EI-002: Claim Verification Policy Engine** (`packages/evidence/src/verification-policy.ts`):
  - Implement `ClaimVerificationPolicy` requiring: primary evidence present, SHA-256 match, title conflicts resolved, reviewer authenticated & authorized.
  - Zero claims become `VERIFIED` without passing formal policy engine.
  - **Tests**: `tests/unit/pilot-hardening.test.js`

---

### Workstream 3: Compliance & Governance (CO)
- [x] **CO-001: Data Retention Engine** (`packages/database/src/retention.ts`):
  - Implement `RetentionPolicy`, `RetentionSchedule`, `RetentionJob`.
  - Policies: Audit Events (7 yrs), QC Reviews (7 yrs), Operational Logs (90 days), Telemetry (30 days).
  - **Tests**: `tests/unit/pilot-hardening.test.js`
- [x] **CO-002: Key Rotation Registry** (`packages/authz/src/key-registry.ts`):
  - Track MongoDB credentials, Webhook keys, Clerk secrets, Sentry DSNs (`owner`, `createdAt`, `expiresAt`, `rotatedAt`).
  - **Tests**: `tests/unit/pilot-hardening.test.js`
- [x] **CO-003: Security Incident Taxonomy** (`packages/resilience/src/security-incidents.ts`):
  - Operationalize incidents: `SECURITY_INCIDENT`, `CREDENTIAL_COMPROMISE`, `TENANT_BREACH_ATTEMPT`, `DATA_EXFILTRATION`.
  - **Tests**: `tests/unit/pilot-hardening.test.js`

---

### Workstream 4: Operations & Observability (OP)
- [x] **OP-001: Sentry Context Completion** (`packages/workflow/src/tracing.ts`):
  - Wire `toSentryContext()` and `toSentryScopeTags()` for `correlationId`, `workflowRunId`, `claimId`, `caseId`, `opportunityId`.
  - **Tests**: `tests/unit/pilot-hardening.test.js`
- [x] **OP-002: Alerting & Incident Dispatcher** (`packages/resilience/src/alerting.ts`):
  - Dispatch automated alerts on: circuit open, delivery failures, tenant isolation violations, backlog SLA breaches.
  - **Tests**: `tests/unit/pilot-hardening.test.js`
- [x] **OP-003: County Health & Telemetry Dashboard** (`packages/qc/src/county-health.ts`):
  - Expose county circuit state, pipeline throughput, queue health, exception volume, and delivery SLAs.
  - **Tests**: `tests/unit/pilot-hardening.test.js`

---

### Workstream 5 & 6: Resilience Validation & Test Expansion (RV)
- [x] **RV-001: Chaos & Injected Failure Tests** (`tests/unit/resilience-and-tracing.test.js`):
  - Inject OCR failures, parser crashes, webhook timeouts, and queue backpressure.
- [x] **RV-002: Park-and-Replay Cryptographic Drill** (`tests/unit/resilience-and-tracing.test.js`):
  - Validate HMAC signature, expiration enforcement, and nonce deduplication during replay.
- [x] **RV-003: Pilot Hardening Test Suite** (`tests/unit/pilot-hardening.test.js`):
  - 100% green test coverage across all hardening modules (55/55 tests passing).

