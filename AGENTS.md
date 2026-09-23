# AGENTS.md — Gieni OS Repository Operating Manual

## 1. System Vision & Architecture Topology

Gieni OS is an evidence-first probate intelligence and investigation platform.
The architecture is structured as a modular TypeScript monorepo deploying two runtime artifacts on Google Cloud Run:
- **`apps/web`**: Next.js App Router application hosting the Operator Console and Client Portal with Clerk Organizations authentication.
- **`apps/workers`**: Node/TypeScript background service/jobs processing ingestion, Document AI OCR, Gemini structured extraction proposals, deterministic scoring, and webhook delivery.

### Bounded Contexts (`packages/*`)
1. **`packages/database`**: MongoDB Atlas client and `TenantScopedRepository` base enforcing tenant filters.
2. **`packages/authz`**: Clerk Organizations token verification, role permissions (`org:operator_admin`, `org:researcher`, `org:qc_reviewer`, `org:client_user`), and server authorization guards.
3. **`packages/evidence`**: Foundational Claim–Evidence Triad (`SourceDocument`, `Claim`, `ClaimEvidence`).
4. **`packages/property`**: Parcel facts, legal descriptions, situs address normalization, assessor matches, and transparent missing record handlers.
5. **`packages/ownership`**: Chain of title events, ownership assessments, deed classifications.
6. **`packages/authority`**: Probate case representation, petitioner, letters testamentary/administration status, fiduciary appointment models.
7. **`packages/scoring`**: Versioned deterministic scoring engine (`ruleVersion`), equity, authority, and composite score computation.
8. **`packages/workflow`**: Cloud Tasks/PubSub workflow runs, idempotency, state transitions, and audit events.
9. **`packages/qc`**: Quality Control review gates, exception queues, human certification.
10. **`packages/delivery`**: Probate Opportunity File (POF) publication, signed link generation, real webhook dispatching, client feedback.

---

## 2. Mandatory Rules & Non-Negotiables ("Stop Doing This")

All agents and contributors must strictly adhere to these anti-pattern prohibitions without exception:

### ❌ 1. Zero Synthetic / Mock Fallback Data in Production Models
- If data is unindexed, missing, or unresolved, mark the field as `null` (`None`) or raise an explicit error.
- **Never Ingest Fictional "Vance" Family Fiduciaries**: Never default an unlocated decision maker to "Thomas Vance", "Theo Vance", or any placeholder. Represent them honestly as `null`.
- **Never Generate Fake Deeds & Mortgages**: Never generate synthetic warranty deeds or fake JPMorgan Chase deeds of trust. If county records are unindexed, fail transparently with `NO_RECORDS_LOCATED`.

### ❌ 2. Zero Fake Deliveries
- Never return `status="SUCCESS"` or `200 OK` unless an authentic HTTP request has been transmitted and acknowledged by the target webhook endpoint.

### ❌ 3. Zero Test Short-Circuiting
- Never bypass or disable validation/security logic during tests (e.g. checking test flags like `PYTEST_CURRENT_TEST` or `NODE_ENV === 'test'`). Tests must validate real system behavior.

### ❌ 4. Cryptographic & Security Honesty
- Never refer to Base64 or simple encoding as "AES-256" or "encryption". Use actual Node `crypto` / Google KMS / Secret Manager standards.

### ❌ 5. No Orphaned Code
- Do not create orphaned security or workflow services. Every policy enforcer or validator must be wired into the HTTP or worker lifecycle or removed.

### ❌ 6. LLM Proposals are Not Facts
- LLM (Gemini) outputs must be stored strictly as `Claim` with `claimType: "EXTRACTED"` and `verificationStatus: "PROPOSED"`.
- Proposals must include raw primary evidence links (document ID, page, excerpt, artifact SHA256).
- Only human QC or verified deterministic rules can transition claims to `VERIFIED`.

### 7. Legal Disclaimer Requirement
- Every commercial presentation and opportunity file must carry the legal boundary notice:
  > *"Research finding—not legal opinion or title guarantee."*

---

## 3. Tenancy & Isolation Rules

- Every operational record carries `{ organizationId, clientId?, countyId, createdAt, updatedAt, schemaVersion }`.
- Every database query for tenant data MUST include `{ organizationId, countyId }` or `{ clientId, countyId }`.
- Never expose a generic `findById(id)`. Always enforce tenant-scoped lookups: `findById({ id, organizationId, clientId? })`.
- Clerk Organization IDs must be verified cryptographically on the server from the session token, never trusted from client request bodies.

---

## 4. Code Health & Dependency Invariants

1. **Dependency Direction**:
   - `apps/*` may import from `packages/*`.
   - `packages/*` must **never** import from `apps/*`.
   - Low-level packages (`evidence`, `database`, `authz`) must never import from high-level orchestration packages (`delivery`, `qc`, `workflow`).
2. **Type Safety**:
   - Strict TypeScript everywhere (`noImplicitAny: true`, `strictNullChecks: true`).
   - Every domain contract must have a paired **Zod schema** for runtime validation.
3. **No God / Brain Modules**:
   - Keep functions focused and cohesive.
   - Do not bundle multi-domain logic into giant single files.

---

## 5. Development & Verification Commands

```bash
# Type checking across all workspaces
npm run type-check

# Run unit and integration tests
npm test

# Run build across all workspaces
npm run build

# Run linting
npm run lint
```
