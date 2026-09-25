Gieni OS Revised Prototype Architecture — September 2026
Executive decision

Build Gieni OS as a modular, TypeScript-first application using Google Antigravity, Next.js on Cloud Run, MongoDB Atlas, Clerk Organizations, Sentry, and CodeScene.

<style>
        :root {
        --accent: #464feb;
        --timeline-ln: linear-gradient(to bottom, transparent 0%, #b0beff 15%, #b0beff 85%, transparent 100%);
        --timeline-border: #ffffff;
        --bg-card: #f5f7fa;
        --bg-hover: #ebefff;
        --text-title: #424242;
        --text-accent: var(--accent);
        --text-sub: #424242;
        --radius: 12px;
        --border: #e0e0e0;
        --shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        --hover-shadow: 0 4px 14px rgba(39, 16, 16, 0.1);
        --font: "Segoe Sans", "Segoe UI", "Segoe UI Web (West European)", -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif;
        --overflow-wrap: break-word;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            --accent: #7385ff;
            --timeline-ln: linear-gradient(to bottom, transparent 0%, transparent 3%, #6264a7 30%, #6264a7 50%, transparent 97%, transparent 100%);
            --timeline-border: #424242;
            --bg-card: #1a1a1a;
            --bg-hover: #2a2a2a;
            --text-title: #ffffff;
            --text-sub: #ffffff;
            --shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            --hover-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
            --border: #3d3d3d;
        }
    }

    @media (prefers-contrast: more),
    (forced-colors: active) {
        :root {
            --accent: ActiveText;
            --timeline-ln: ActiveText;
            --timeline-border: Canvas;
            --bg-card: Canvas;
            --bg-hover: Canvas;
            --text-title: CanvasText;
            --text-sub: CanvasText;
            --shadow: 0 2px 10px Canvas;
            --hover-shadow: 0 4px 14px Canvas;
            --border: ButtonBorder;
        }
    }

    .insights-container {
        display: grid;
        grid-template-columns: repeat(2,minmax(240px,1fr));
        padding: 0px 16px 0px 16px;
        gap: 16px;
        margin: 0 0;
        font-family: var(--font);
    }

    .insight-card:last-child:nth-child(odd){
        grid-column: 1 / -1;
    }

    .insight-card {
        background-color: var(--bg-card);
        border-radius: var(--radius);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        min-width: 220px;
        padding: 16px 20px 16px 20px;
    }

    .insight-card:hover {
        background-color: var(--bg-hover);
    }

    .insight-card h4 {
        margin: 0px 0px 8px 0px;
        font-size: 1.1rem;
        color: var(--text-accent);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .insight-card .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        font-size: 1.1rem;
        color: var(--text-accent);
    }

    .insight-card p {
        font-size: 0.92rem;
        color: var(--text-sub);
        line-height: 1.5;
        margin: 0px;
        overflow-wrap: var(--overflow-wrap);
    }

    .insight-card p b, .insight-card p strong {
        font-weight: 600;
    }

    .metrics-container {
        display:grid;
        grid-template-columns:repeat(2,minmax(210px,1fr));
        font-family: var(--font);
        padding: 0px 16px 0px 16px;
        gap: 16px;
    }

    .metric-card:last-child:nth-child(odd){
        grid-column:1 / -1; 
    }

    .metric-card {
        flex: 1 1 210px;
        padding: 16px;
        background-color: var(--bg-card);
        border-radius: var(--radius);
        border: 1px solid var(--border);
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .metric-card:hover {
        background-color: var(--bg-hover);
    }

    .metric-card h4 {
        margin: 0px;
        font-size: 1rem;
        color: var(--text-title);
        font-weight: 600;
    }

    .metric-card .metric-card-value {
        margin: 0px;
        font-size: 1.4rem;
        font-weight: 600;
        color: var(--text-accent);
    }

    .metric-card p {
        font-size: 0.85rem;
        color: var(--text-sub);
        line-height: 1.45;
        margin: 0;
        overflow-wrap: var(--overflow-wrap);
    }

    .timeline-container {
        position: relative;
        margin: 0 0 0 0;
        padding: 0px 16px 0px 56px;
        list-style: none;
        font-family: var(--font);
        font-size: 0.9rem;
        color: var(--text-sub);
        line-height: 1.4;
    }

    .timeline-container::before {
        content: "";
        position: absolute;
        top: 0;
        left: calc(-40px + 56px);
        width: 2px;
        height: 100%;
        background: var(--timeline-ln);
    }

    .timeline-container > li {
        position: relative;
        margin-bottom: 16px;
        padding: 16px 20px 16px 20px;
        border-radius: var(--radius);
        background: var(--bg-card);
        border: 1px solid var(--border);
    }

    .timeline-container > li:last-child {
        margin-bottom: 0px;
    }

    .timeline-container > li:hover {
        background-color: var(--bg-hover);
    }

    .timeline-container > li::before {
        content: "";
        position: absolute;
        top: 18px;
        left: -40px;
        width: 14px;
        height: 14px;
        background: var(--accent);
        border: var(--timeline-border) 2px solid;
        border-radius: 50%;
        transform: translateX(-50%);
        box-shadow: 0px 0px 2px 0px #00000012, 0px 4px 8px 0px #00000014;
    }

    .timeline-container > li h4 {
        margin: 0 0 5px;
        font-size: 1rem;
        font-weight: 600;
        color: var(--accent);
    }

    .timeline-container > li h4 em {
        margin: 0 0 5px;
        font-size: 1rem;
        font-weight: 600;
        color: var(--accent);
        font-style: normal;
    }

    .timeline-container > li * {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-sub);
        line-height: 1.4;
    }

    .timeline-container > li * b, .timeline-container > li * strong {
        font-weight: 600;
    }
        @media (max-width:600px){
        .metrics-container,
        .insights-container{
            grid-template-columns:1fr;
      }
    }
</style>
<div class="insights-container">
  <div class="insight-card">
    <h4>Database winner: MongoDB Atlas</h4>
    <p>Gieni’s evidence graph, versioned assessments, many-to-many relationships, investigative queries, and future semantic search outweigh Firestore’s superior realtime/mobile simplicity.</p>
  </div>
  <div class="insight-card">
    <h4>Observability winner: Sentry</h4>
    <p>Better fit for a React/Next.js/Node stack requiring frontend and worker errors, tracing, logs, source maps, release correlation, and privacy-controlled session replay.</p>
  </div>
  <div class="insight-card">
    <h4>Architecture style</h4>
    <p>One modular monorepo and two Cloud Run deployables—not nine microservices, but also not an undifferentiated monolith.</p>
  </div>
</div>


This is a meaningful improvement over the earlier Lovable/Supabase direction. Lovable optimized for generating a disposable UI; Antigravity supports planning, coding, terminal work, browser verification, parallel subagents, and reviewable artifacts. Supabase/PostgreSQL would still be credible, but between your requested alternatives, Atlas fits the evolving evidence-document-workflow model more naturally than Firestore.

Your internal architecture already establishes the important truths: Property, Ownership, Control, and Authority are separate concepts; conclusions must retain source, schema version, ingestion time, and verifier; assessments must be temporal and versioned; and commerce must remain separate from internal intelligence.(Source: Notion)(Source: Notion) The commercial product is the evidence-backed Probate Opportunity File, not a lead row—it answers property, ownership, control, authority, equity, risk, proof, and recommended action.(Source: Notion)

1. Recommended architecture

Internal materials envision nine independently deployed production services, an event bus, graph storage, and Temporal/BullMQ.(Source: Notion) Do not reproduce that production topology in the prototype. Preserve its boundaries in code, schemas, events, and ownership, while deploying fewer components.

Prototype topology

apps/web — Next.js/TypeScript on Cloud Run

Operator Console
Client Portal
Clerk authentication
server-rendered screens and thin HTTP APIs

apps/workers — Node/TypeScript Cloud Run service/jobs

ingestion adapters
OCR/extraction
matching and assessments
workflow execution
delivery and retries

packages/ bounded contexts

jurisdiction
cases
property
identity
ownership
authority
scoring
evidence
exceptions-qc
delivery-feedback
authz
observability

Managed infrastructure

MongoDB Atlas
Google Cloud Storage
Cloud Tasks, Pub/Sub and Eventarc
Document AI and Gemini
Secret Manager
Clerk, Sentry and CodeScene

Cloud Tasks can securely push authenticated work to private Cloud Run services, apply retries/rate limits, smooth spikes, and preserve pending work; longer processing can move to Cloud Run Jobs. Google also publishes an official Antigravity workflow covering architectural planning, infrastructure generation, Cloud Run deployment, Gemini document analysis, and Walkthrough-artifact verification.

The following diagram shows the recommended runtime and development boundaries.

Figure 1: Recommended Gieni OS prototype architecture: a modular Next.js/Cloud Run application with Clerk tenancy, MongoDB Atlas evidence-centric data, Google document intelligence, deterministic workflow gates, human QC, Sentry observability, and CodeScene quality controls.

2. How to use Google Antigravity

Antigravity 2.0 is a standalone agent command center supporting projects, workspaces/worktrees, parallel local subagents, scheduled tasks, artifacts, and granular approval gates. The IDE adds MCP, skills, and deep repository context. Its strength is controlled implementation, not autonomous product governance.

Repository setup
gieni-os/
├── apps/
│   ├── web/
│   └── workers/
├── packages/
│   ├── database/
│   ├── authz/
│   ├── evidence/
│   ├── property/
│   ├── ownership/
│   ├── authority/
│   ├── scoring/
│   ├── workflow/
│   ├── qc/
│   └── delivery/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── evidence-fixtures/
│   └── e2e/
├── docs/
│   ├── adr/
│   ├── rules/
│   └── county-adapters/
├── AGENTS.md
└── package.json


Put a strict AGENTS.md at the root defining:

bounded-context dependency rules;
tenant filtering requirements;
no client-direct database access;
evidence requirements for every material claim;
deterministic scoring and transition rules;
commands for lint, type-check, unit, integration and browser tests;
prohibited shortcuts, including storing AI output directly as verified fact.

Antigravity’s own best practices recommend explore → plan → execute, writing tests before changes, running local verification, and placing repository rules in GEMINI.md or AGENTS.md. Its default permission modes can require approval for writes, commands and network calls, or execute inside a sandbox.

Practical agent loop

For every feature:

Explore: “Explain the existing evidence and tenancy boundaries. Do not edit.”
Plan: require affected files, schema changes, tests, rollback and security impact.
Approve the plan.
Execute in a feature worktree.
Verify: type-check, tests, seeded demo, browser walkthrough.
Open a small GitHub PR.
CodeScene gate and human review.
Deploy only after CI passes.
Let Antigravity generate
scaffolding and repetitive CRUD;
Zod schemas and TypeScript types;
Clerk integration;
adapters following an approved interface;
test fixtures and browser tests;
accessible UI components;
deployment manifests and documentation.
Keep human-owned and explicit
authority classifications;
score weights and thresholds;
county-specific legal rules;
tenant boundaries;
exception routing;
evidence sufficiency;
delivery eligibility;
retention/privacy policies;
legal-disclaimer language.

Antigravity should implement business rules from versioned specifications—never invent them.

3. MongoDB Atlas vs Firestore
Requirement	MongoDB Atlas	Firebase/FirestoreComplex entity relationships	References, $lookup, $graphLookup, rich aggregation	References/subcollections; more application-side joins
Investigative querying	Strong aggregation, text, geospatial and vector search	Indexed document queries; count, sum, average; fewer analytical composition options
Evidence documents	Larger, richer nested documents; adaptable schemas	Excellent hierarchical documents, but document-centric access patterns dominate
Versioned assessments/history	Natural append-only collections and aggregations	Feasible, but cross-collection analysis is less comfortable
Transactions	Multi-document ACID	ACID transactions and atomic batches; transactions retry under contention
Realtime operator screens	Change streams require server glue	Excellent realtime listeners and offline sync
Multi-cloud/migration	Atlas runs on AWS, Azure or GCP	Primarily Google ecosystem; Enterprise offers Mongo-compatible API
Search/vector	Integrated lexical, geospatial and vector search	KNN vector indexes supported; embeddings generated separately
Local development	MongoDB/Atlas Local in Docker	Strong Firebase Emulator Suite
Prototype pricing	Atlas Flex: $8–$30/month, 5 GB and up to 500 ops/sec tiers	1 GiB free; usage billed by documents, index reads, storage and bandwidth
Best fit	Evidence-rich operational intelligence	Mobile/realtime apps with comparatively simple query paths
Decisive recommendation: MongoDB Atlas

Gieni has:

independent people, parcels, cases and organizations;
many-to-many relationships;
append-only claims and evidence links;
versioned ownership/authority/score assessments;
operator queues and longitudinal audits;
complex filters such as “unresolved Tier 4 authority, Priority A potential, missing one required artifact, assigned to this QC reviewer”;
future dossier search and semantic retrieval.

MongoDB’s official schema guidance recommends references for complex many-to-many relationships, large hierarchies, independently queried entities, and frequently changing shared data. Its official document-intelligence reference architecture separately stores documents, chunks, assessments and workflows, demonstrating a close analogue for Gieni’s provenance and processing state.

Firestore wins if realtime mobile/offline behavior is the primary product. That is not Gieni’s core requirement. Its per-document and index-read billing also makes investigation-heavy dashboards less intuitive to forecast.

Tradeoff: Atlas will not provide Firestore-style client synchronization for free. Use server actions/API routes plus polling initially, then Server-Sent Events or change-stream fanout only where genuinely useful.

4. Recommended MongoDB data model

Every persisted record carries:

{
  _id,
  organizationId,     // internal operator organization
  clientId?,          // commercial tenant where applicable
  countyId,
  createdAt,
  updatedAt,
  schemaVersion
}

Core collections
Collection	Key purposeorganizations, clients, counties	tenancy, exclusivity and jurisdiction
probateCases, estates	filing and estate identity
people, organizationsExternal, relationships	heirs, fiduciaries, counsel and graph edges
properties, ownershipEvents	parcel facts and title history
sourceDocuments	immutable file metadata, hash, source URL and retrieval facts
claims, claimEvidence	atomic asserted fact and exact proof
ownershipAssessments, authorityAssessments	versioned intelligence
opportunityScores	versioned rule/weight output
opportunities	current operational projection
exceptions, qcReviews	human work and certification
deliveries, clientFeedback	commercial publication and outcomes
workflowRuns, auditEvents	execution and immutable activity history
Claim/evidence pattern
Claim {
  _id, tenantId, subjectType, subjectId,
  fieldPath: "authority.fiduciaryPersonId",
  proposedValue,
  normalizedValue,
  claimType: "EXTRACTED" | "MATCHED" | "DERIVED" | "HUMAN_VERIFIED",
  confidence: 0.92,
  verificationStatus: "PROPOSED" | "VERIFIED" | "REJECTED" | "SUPERSEDED",
  modelVersion?, ruleVersion?,
  createdBy, createdAt
}

ClaimEvidence {
  _id, claimId, sourceDocumentId,
  pageNumber, boundingBox?, excerpt,
  sourceLocator, artifactSha256,
  extractionRunId
}


This directly implements the internal Claim–Evidence triad, which requires an atomic claim, immutable primary evidence, and an explicit link identifying page, paragraph and hash.(Source: Notion)

Embed versus reference

Embed: bounded snapshots that are read together—normalized addresses, small confidence summaries, current queue status, score component summaries.

Reference: people, properties, documents, claims, relationships, assessments, exceptions, reviews, events and deliveries. They change independently, may be shared, or grow without bound. Never embed full audit histories or document text inside an opportunity.

Maintain a denormalized currentSnapshot in opportunities for fast dashboards, but rebuild it from canonical assessments. The snapshot is a projection, not the evidence system of record.

5. Clerk tenancy and authorization

Use one Clerk Organization per client company. Maintain a separate internal Gieni operator organization. Clerk Organizations provide active-organization context, roles and permissions, and users may belong to multiple organizations. Clerk explicitly recommends storing the Organization ID beside each application resource and filtering by it.

Role	Permissionsorg:operator_admin	counties, assignments, models, users, delivery configuration
org:researcher	ingest, investigate, propose claims, resolve assigned exceptions
org:qc_reviewer	review evidence, reject/approve assessments, certify delivery
org:client_user	read only delivered opportunities for licensed counties; submit feedback
Enforcement rules
Verify Clerk tokens server-side on every route, action and worker-triggered user request.
Derive orgId, role and permissions from verified auth—not request bodies.
Add {clientId, countyId} to every commercial query.
Build repository methods that require a tenant scope argument.
Never expose a general findById(id) for tenant data; use findById({id, clientId}).
Validate county entitlement before returning an opportunity or signed file URL.
Use short-lived Cloud Storage signed URLs after authorization.
Write audit events for reads of high-risk evidence and all mutations/publications.

Clerk warns that background calls across multiple browser tabs must not rely only on the session cookie; obtain a token for the active organization and pass it in the Authorization header. UI hiding is not security—Clerk recommends server-side authorization checks for sensitive content.

6. Sentry vs Honeybadger
Dimension	Sentry	HoneybadgerNext.js coverage	Deep client/server/edge integration	Official App Router integration, breadcrumbs and source maps
Errors/releases/source maps	Excellent	Excellent
Tracing/performance	Broader full-stack tracing and profiling	Simpler “Just Enough APM”
Logs	Integrated logs and issue context	BadgerQL and developer-friendly event querying
Session replay	Mature; error-connected; privacy masking	Available, but Sentry has the stronger integrated story
AI debugging	Seer add-on	Simpler observability emphasis
Complexity	Higher	Lower
Best fit	Product + workers + distributed workflow debugging	Small team wanting minimal operational overhead
Recommendation: Sentry

Gieni’s failures will cross browser, API, worker, OCR, queue, database and external adapter boundaries. Sentry’s Team plan lists $26/month annually and includes 50,000 errors, 5 million spans, 5 GB logs and 50 replays; Seer is a separate $40 per active contributor monthly add-on. Its Next.js replay masks DOM text, images and inputs by default and connects user actions, network requests, console activity and errors.

Use: errors, tracing, releases, source maps, worker spans, queue correlation IDs and failed county-adapter alerts. Disable or aggressively mask replay on evidence, PII, contact, probate-file and document-review pages.

Honeybadger remains a credible simplification fallback: its Next.js package supports App Router, uncaught exceptions, breadcrumbs and source-map upload. Do not run both in the prototype.

7. CodeScene operating model

CodeScene is the correct guardrail for Antigravity-generated volume. It combines repository behavior with Code Health, hotspots and architectural analysis; its CLI, MCP server and PR integration provide local and merge-time checks.

Lightweight workflow
Connect the GitHub repository using the CodeScene GitHub App.
Run a baseline after scaffolding.
Define architectural components from the packages/* boundaries.
Enable the Bare Minimum PR profile first.
Block:
new God/Brain modules;
deep nesting and low cohesion;
worsening hotspot health;
forbidden cross-context imports.
Run CodeScene CLI before commits.
Give Antigravity CodeScene MCP feedback during refactors.
Review top hotspots weekly—not every warning.

CodeScene’s architectural analysis applies hotspots, coupling and Code Health at component level, making it useful for detecting a “modular monolith” collapsing into one coupled module. Its PR gates are specifically designed to prevent health decline and new technical debt.

8. Workflow, document intelligence and demo surfaces
Orchestration

Do not use n8n as the core state machine. Use:

Cloud Tasks for reliable one-case/one-stage work;
Pub/Sub for domain events and fanout;
Cloud Run Jobs for batches and long processing;
MongoDB workflowRuns for stage, attempt, idempotency key, input/output references and error state.

Keep n8n only for low-risk adapters—CRM webhook experiments, email formatting or temporary county-source connectors. It must never own opportunity state, scoring rules or evidence provenance.

Document/AI pipeline
Preserve raw file in Cloud Storage; hash it.
Document AI OCR returns text/layout.
Gemini proposes schema-validated fields.
Store each proposed field as a Claim with page/excerpt evidence.
Deterministic validators check formats, conflicts, required evidence and county rules.
Low confidence/conflicts create exceptions.
Human reviewer verifies or rejects.
Only verified claims feed delivery eligibility.

Document AI OCR currently includes the first 1,000 pages free, then lists $1.50 per 1,000 pages; its custom extractor lists $30 per 1,000 pages. Gemini can process PDFs, interpret tables/images, and return structured output, but generated values must remain proposals rather than facts.

Minimum screens

Operator: Dashboard; Intake; Document Review; Opportunity Investigation; Exceptions/Tasks; QC & Delivery.

Client: Opportunity Feed; Probate Opportunity File; evidence viewer; feedback/disposition.

The internal system requires any failed QC gate to enter the exception queue, while Authority Unresolved cases remain quarantined until research establishes an actionable pathway.(Source: Notion)(Source: Notion)

One-county vertical slice
Upload one representative probate PDF.
Simulate the county adapter but label it clearly.
OCR and extract decedent, case number, petitioner and property clues.
Match one seeded assessor parcel.
create ownership and authority findings with evidence.
score through a versioned deterministic rule set.
force one ambiguity into an exception.
resolve it manually.
complete QC.
publish to one Clerk client organization.
capture contacted/invalid/not-interested/appointment feedback.

Prototype claim: one controlled workflow proves traceability and usability.
 Not yet proven: legal completeness, statewide coverage, autonomous scraping reliability, title accuracy or production-grade contact compliance.

9. Security and production boundaries
Separate public records, enriched PII, internal intelligence and client-confidential data.
Encrypt storage and transport; place secrets in Secret Manager, which Google recommends for Cloud Run secrets.
Maintain source URL, retrieval timestamp, license/terms note and content hash.
Never let an LLM make final legal-authority or title conclusions.
Display: “research finding—not legal opinion or title guarantee,” matching your internal ARE boundary.(Source: Notion)
Use idempotency keys, retries, dead-letter states and immutable audits.
Test cross-tenant access negatively in every bounded context.
Keep county adapters isolated because source markup, terms and anti-bot controls change.
Enable Atlas backups before real client data; Atlas cloud backups are immutable by default on supported paid tiers, with continuous backup/PIT recovery available on qualifying clusters.
Lessons from current examples
Google’s official Antigravity deployment lab validates the plan/design/build/deploy/Walkthrough pattern on Cloud Run.
MongoDB’s financial document-intelligence architecture separates source documents, chunks, assessments and workflow state—supporting Gieni’s provenance-first model.
CodeScene’s ACE research found unguarded LLM refactoring unreliable and improved retained suggestions through syntactic, Code Health and semantic validation—exactly the approach needed for AI-generated Gieni code.
Honeybadger’s ClickFunnels case illustrates the benefit of operational simplicity, but Gieni’s distributed pipeline creates a stronger case for Sentry’s broader tracing/replay toolset.
10. Exact build sequence
Freeze Notion terminology, states, evidence and role contracts.
Create GitHub monorepo, AGENTS.md, CI and branch protection.
Scaffold Next.js, workers, shared types and bounded contexts.
Connect CodeScene and record baseline.
Configure Clerk Organizations, roles and server authorization.
Provision Atlas, indexes, local seed environment and tenant-scoped repositories.
Build evidence, claims, audit and versioned-assessment collections.
Seed one county/case/property/people/POF vertical slice.
Build operator investigation and evidence screens.
Build exception and QC transitions.
Implement deterministic scoring and score-version storage.
Build client portal and tenant-isolation tests.
Add Cloud Storage upload, Document AI and Gemini proposal extraction.
Add Cloud Tasks/Pub/Sub workflow execution and idempotency.
Add delivery, signed evidence links and client feedback.
Add Sentry errors, traces, release tags and carefully scoped replay.
Deploy web and workers to Cloud Run.
Run expert review for security, scraping terms, PII/contact compliance, title/legal boundaries and recovery.
Final stack and first actions
Layer	DecisionDevelopment	Google Antigravity 2.0 + IDE/CLI
Repository	GitHub monorepo
App	Next.js + React + TypeScript
Runtime	Cloud Run web + worker service/jobs
Database	MongoDB Atlas
Authentication	Clerk Organizations
Observability	Sentry
Code quality	CodeScene
Workflow	Cloud Tasks + Pub/Sub + Eventarc
OCR	Google Document AI
LLM	Gemini structured output via paid API/Vertex AI
Files	Google Cloud Storage
Secrets	Google Secret Manager
Notifications	SendGrid/email first; Twilio only for approved alerts
Integrations	isolated county adapters; n8n only at edges

Configure first: GitHub, Antigravity, Clerk, Atlas, Google Cloud project, Cloud Storage, Secret Manager, Document AI, Sentry and CodeScene.

Postpone: graph database, Temporal, Kafka, separate microservices, automated model retraining, broad CRM integrations, autonomous outbound communication, multi-county scraping fleet, and vector search until the evidence-backed one-county workflow works end to end.