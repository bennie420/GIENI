# Microsoft Copilot Audit Instructions & Upload Guide

## 📄 File to Upload
Upload [copilot-audit.txt](file:///c:/Users/ben/GIENI/copilot-audit.txt) (located at the root of the repository).

---

## 📋 Copy & Paste Prompt for Microsoft Copilot

```markdown
Please conduct a rigorous follow-up Security, Architecture, Compliance, and Code Quality Review of the attached file `copilot-audit.txt`.

### Context:
In an earlier audit of Gieni OS, you evaluated the architecture at 8.3/10 and identified several critical (P0) and priority (P1–P3) remediation gaps. The engineering team has now implemented comprehensive remediations across all 14 workspaces.

### Your Objectives:
Please evaluate whether the previous gaps have been completely and genuinely resolved, specifically checking:

1. **Clerk Tenant Binding (P0-1)**: Does `tenant.ts` and `tenant-context.ts` derive `TenantScope` directly from the authenticated session, eliminate hardcoded operator/client scopes, and enforce county licensing checks?
2. **Claim Audit Event Stream (P0-2)**: Are immutable `ClaimAuditEvent` records created on all state transitions (CREATED, VERIFIED, REJECTED, SUPERSEDED, DELIVERED, ROLLED_BACK)?
3. **Document AI Extraction-to-Claim Mapping (P0-3)**: Does `document-intelligence.ts` map all extracted attributes (decedent, case number, filing date, court, property clues, fiduciaries) into atomic `Claim` records with SHA-256 evidence links and untrusted `PROPOSED` status?
4. **Centralized Delivery Eligibility Engine (P0-4)**: Does `eligibility.ts` strictly enforce publication gates, blocking Authority Tier 4 (unappointed/speculative fiduciaries), unverified `PROPOSED` claims, and uncertified QC reviews?
5. **Circuit Breakers & Fault Isolation (P1-1)**: Does `packages/resilience` isolate failures per county and safeguard parked jobs with HMAC cryptographic replay protection?
6. **High-Value Ambiguity Routing (P1-2)**: Does `packages/qc/src/routing.ts` soft-gate $\ge \$500\text{k}$ cases to senior reviewers without halting pipelines?
7. **Control Domain Decoupling (P1-3)**: Does `packages/control` strictly enforce **Property $\ne$ Ownership $\ne$ Control $\ne$ Authority**, ensuring deed holders are not assumed to have probate authority and POA terminates upon death?
8. **Correlation IDs & Sentry Tracing (P1-4)**: Are correlation IDs and Sentry tags propagated throughout workflow runs and audit logs?
9. **Scoring Coefficient Governance (P2-1, P2-2)**: Do weight changes require human certification (`certifierId`) and sum to 1.0, and does `queue-health.ts` track SLA breach risks?
10. **Webhook Security & Data Classification (P2-3, P2-4)**: Does `dispatcher.ts` use HMAC-SHA256 signatures, timestamp tolerances, and nonces, and are domain schemas mapped to data classification tiers?
11. **CodeScene Boundaries & Scale Infrastructure (P3-1, P3-2, P3-3)**: Does `.codescene/architecture.json` enforce dependency invariants, does `signals.ts` track fast vs slow learning feedback, and does `queue-adapter.ts` gate future Temporal/BullMQ migration by volume thresholds?
12. **Authenticity & Integrity**: Verify that zero synthetic "Vance" fiduciaries, fake deeds, fake delivery statuses, or test short-circuiting exists in production paths.

Please provide an updated Score (out of 10), itemized breakdown across all criteria, and any remaining recommendations before pilot launch.
```
