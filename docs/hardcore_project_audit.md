# Hardcore Project Audit: Gieni OS Platform

> **Audit Date**: September 26, 2026  
> **Target Scope**: Full Monorepo (`apps/web`, `apps/workers`, `packages/*`, deployment manifests)  
> **Auditor Lens**: Adversarial Production Hardening, Zero-Tolerance Authenticity, Customer Lifecycle Friction  

---

## 1. Executive Summary & The Unvarnished Truth

Gieni OS presents a well-architected claim-evidence probate intelligence platform. The bounded contexts (`packages/authority`, `evidence`, `property`, `control`, `scoring`, `resilience`, `delivery`) demonstrate compliance with zero-synthetic invariants (e.g., explicit nulling of missing fiduciaries, rejecting Vance family mocks, authentic webhook dispatches). All 72 unit/integration tests pass with 0 short-circuit flags.

However, beneath the architectural model lies a set of **critical operational and customer lifecycle chasms**:
1. **The Client Cold-Start Dead-End**: When a client logs in via Clerk to `apps/web/src/app/client`, if their tenant has 0 delivered records or if the backend worker pipeline hasn't run publication, the UI renders a silent dead-end card (*"No published Probate Opportunity Files delivered yet"*). There is zero onboarding guidance, no automated sample request trigger, no notification preferences setup, and no webhook destination configuration UI.
2. **Ingestion-to-Delivery Isolation**: The operator can trigger scrapers in `apps/web/src/lib/actions.ts`, but pipeline persistence to MongoDB Atlas swallows failures with a `console.warn` when offline, silently failing to hydrate client views if the worker daemon or local database is disconnected.
3. **Absence of Customer Automation Loops**: The delivery layer contains an authentic HTTP webhook dispatcher (`packages/delivery/src/dispatcher.ts`), but lacks automated event subscriptions (no automated delivery digests, no email delivery receipts, no customer re-engagement sequences when claims remain unreviewed).

### Overall Scorecard

| Dimension | Score (0-100) | Grade | Status Summary |
| :--- | :---: | :---: | :--- |
| **1. Architecture & Design** | 92 | **A** | Strict bounded contexts, tenant scoped repositories, clean separation of concerns. |
| **2. Reliability & Resilience** | 88 | **B+** | County-level circuit breakers, HMAC replay protection, soft-gating high value cases. |
| **3. Security & Data Hygiene** | 94 | **A** | Clerk session token scoping, PII masking, cryptographic audit hashing, strict Zod schemas. |
| **4. Performance & Economics** | 84 | **B** | In-memory queues work well for low volume; needs external queueing for concurrent scrapers. |
| **5. Observability & Testing** | 87 | **B+** | Correlation IDs, Sentry context propagation, 72 automated test cases. |
| **6. Pragmatism & Tech Debt** | 81 | **B-** | Disconnect between worker Cloud Tasks and web UI triggers; manual operator steps required. |
| **COMPOSITE SCORE** | **88 / 100** | **B+** | **Solid with Caveats (Production-Ready Architecture, Lifecycle Automation Needed)** |

---

## 2. Top 3 "Detonation Scenarios" (How This Fails in Production)

1. **Scenario A: Unhandled Worker Outage During Webhook Publication**
   - **Trigger**: Webhook receiver responds with 500 or network drops during batch delivery.
   - **Impact**: While the dispatcher correctly returns `status="FAILED"`, there is no automatic exponential backoff retry worker or customer notification channel configured in the web UI. Deliveries remain indefinitely stalled in `FAILED`.
   - **Root Cause**: `packages/delivery/src/dispatcher.ts` does not auto-enqueue retries into a durable dead-letter queue.

2. **Scenario B: Client Portal Onboarding Abandonment**
   - **Trigger**: New Clerk organization user signs in for the first time without pre-seeded data in Travis or King County.
   - **Impact**: Blank/empty screen with no call to action, leading to immediate client churn.
   - **Root Cause**: `apps/web/src/app/client/ClientPortal.tsx` lacks empty-state CTA, sandbox previews, or automated county request triggers.

3. **Scenario C: Ingestion Persistence Warning Swallowing in Web Actions**
   - **Trigger**: Database connectivity flicker while running `triggerMunicipalScraperAction`.
   - **Impact**: Scraped records are returned in memory to the caller, but database insertion fails silently inside a swallowed `console.warn` block (`apps/web/src/lib/actions.ts:220`). Telemetry indicates success, but database stores nothing.
   - **Root Cause**: Swallowed catch block in web action without retry or explicit failure surface.

---

## 3. Detailed Forensic Findings & Prescriptions

### [P0] Critical & Fatal Flaws

#### 🚨 [P0-1]: Swallowed Database Persistence in Web Scraper Action
- **File / Component**: `apps/web/src/lib/actions.ts:211-222`
- **The Defect**: If MongoDB Atlas or the repository fails during `persistIngestionRunData`, the error is caught and logged as a warning (`console.warn`), but `triggerMunicipalScraperAction` still returns a successful run result without warning the operator that zero records were persisted.
- **Why It's Dangerous**: Operators assume cases have entered the workflow and QC queue, but no records exist in the database.
- **The Fix**: Return a persistence error status in `IngestionRunResult` and surface an explicit alert banner in the Operator Console.

---

### [P1] High Architectural & Resilience Risks

#### ⚠️ [P1-1]: Lack of Automated Retry Queue for Failed Webhook Deliveries
- **File / Component**: `packages/delivery/src/dispatcher.ts`
- **The Defect**: When `dispatchRealWebhook` encounters a network timeout or 5xx response, it logs `status: "FAILED"`. It does not enqueue a Cloud Task or worker retry with exponential backoff.
- **The Fix**: Integrate `packages/workflow` retry engine or Cloud Tasks queue to schedule retries at $T+5m, T+30m, T+2h$.

#### ⚠️ [P1-2]: Missing Dynamic Webhook Configuration Endpoint in Client Portal
- **File / Component**: `apps/web/src/app/client/ClientPortal.tsx`
- **The Defect**: Clients cannot view, configure, or test their webhook target URL from the portal interface.
- **The Fix**: Add a Webhook Settings modal in the Client Portal enabling clients to set endpoint URLs, regenerate HMAC secrets, and dispatch a test ping.

---

### [P2] Performance & Operational Gaps

#### ⚙️ [P2-1]: Empty State Friction on Client Opportunity Feed
- **File / Component**: `apps/web/src/app/client/ClientPortal.tsx:97-100`
- **The Defect**: Renders a passive `<p>No published Probate Opportunity Files delivered yet...</p>`.
- **The Fix**: Replace with an interactive empty-state component offering sample data previews, county subscription selectors, and onboarding guidance.

---

## 4. The "Stop Doing This" List (Anti-Patterns to Cut)

- ❌ **Stop swallowing persistence errors in web actions**: Never treat failed DB persistence as a warning when the user initiated an ingestion action.
- ❌ **Stop presenting dead-end empty states**: Never display an empty table without a Next Action button or proactive status tracker.
- ❌ **Stop requiring manual webhook coordination**: Clients should self-service their webhook endpoints and HMAC tokens directly in the portal.

---

## 5. Surgical Remediation Roadmap

### ⏱️ Immediate Triage (Next 24 - 48 Hours)
- [ ] Fix P0-1: Explicitly report database persistence failure in `triggerMunicipalScraperAction`.
- [ ] Add empty-state onboarding and county activation prompt in `ClientPortal.tsx`.

### 🔨 Phase 1: Structural Stabilization (Week 1)
- [ ] Implement self-service webhook configuration in `apps/web/src/app/client`.
- [ ] Add durable retry scheduling for failed webhook dispatches in `packages/delivery`.

### 🛡️ Phase 2: Production Hardening & Observability (Week 2)
- [ ] Implement automated morning briefing digest for operators.
- [ ] Connect delivery notifications with email/SMS webhooks for client engagement.
