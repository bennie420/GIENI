# Customer Journey Audit Report — Gieni OS

> **Audit Date**: September 26, 2026  
> **Auditor Lens**: Full-Lifecycle Customer Friction, Conversion Mechanics, Trust Signals, Dead-End Detection  

---

## Executive Summary

Gieni OS delivers an evidence-first probate intelligence architecture designed for institutional buyers and title researchers. While the backend data pipeline satisfies strict verification invariants, the **customer-facing experience currently suffers from onboarding friction and dead-ends**:
- Prospects and newly onboarded client organizations entering the portal with no delivered records face a blank screen with no clear next action.
- There are no automated delivery receipts or digest sequences notifying clients when high-priority opportunities are verified.
- The feedback loop is present but one-way; client dispositions do not trigger automated follow-up workflows.

**Overall Conversion & Retention Arc Score**: **6.8 / 10 (C+)**

---

## Stage-by-Stage Scores

| Stage | Score | Grade | Top Issue |
| :--- | :---: | :---: | :--- |
| **Discovery** | 7/10 | B- | Landing page lacks interactive sandbox or instant county sample preview. |
| **Activation** | 6/10 | C+ | Clerk sign-up does not seed demo records or guide county selection; dead-ends on empty feed. |
| **Conversion** | 7/10 | B- | No clear self-serve tier upgrade or webhook configuration interface. |
| **Retention** | 7/10 | B- | Authentic webhooks exist, but zero automated email/digest alerts when POF files are delivered. |
| **Expansion** | 5/10 | D | No automated prompts to expand county coverage after positive disposition feedback. |
| **Win-back** | 4/10 | F | Zero churn signal monitoring or re-engagement sequence for inactive clients. |
| **Referral** | 5/10 | D | No automated referral mechanism or partner incentive after successful acquisitions. |
| **Overall** | **6.8 / 10** | **C+** | **Solid engine, but client lifecycle relies too heavily on manual out-of-band touchpoints.** |

---

## Critical Friction Points (Fix First)

1. **🔴 Empty Feed Dead-End upon Client First Login**:
   - In `apps/web/src/app/client/ClientPortal.tsx`, if the organization has not received a batch delivery yet, the user sees an unhelpful message: *"No published Probate Opportunity Files delivered yet for this client organization."*
   - There is no CTA to request initial county ingestion, no sample opportunity preview, and no webhook setup guide.

2. **🟠 Absence of Real-Time Delivery Notifications**:
   - Clients must manually visit `/client` to see if new probate cases were published. If they don't have webhooks connected, they have no way of knowing a time-sensitive opportunity was published.

---

## Narrative Analysis

### 1. Discovery & Awareness
- **Current State**: The homepage ([page.tsx](file:///c:/Users/ben/GIENI/apps/web/src/app/page.tsx)) clearly displays the legal boundary disclaimer (*"Research finding—not legal opinion or title guarantee"*) and separates the Operator Console and Client Portal.
- **Friction**: It does not explain what counties are supported, nor does it let a prospective client preview an anonymized verified dossier.

### 2. Activation & First Value
- **Current State**: Users authenticate via Clerk. Once authenticated, `getSessionTenantScope` scopes them to their licensed counties.
- **Friction**: If the background worker hasn't completed a publication run for their county, their first experience is completely barren.

### 3. Retention & Expansion
- **Current State**: Clients can review primary evidence documents, inspect the claim chain, and submit dispositions (`PURCHASED`, `DISQUALIFIED`, `UNDER_CONTRACT`).
- **Friction**: Positive dispositions do not trigger expansion workflows (e.g. *"You converted 2 Travis County deals; want to add Williamson and Hays counties?"*).

---

## Recommended Action Plan

1. **Interactive Onboarding Card**: Replace the empty feed state in `ClientPortal.tsx` with a setup wizard (Select Target Counties $\to$ Configure Webhook $\to$ Review Sample Dossier).
2. **Delivery Alert Trigger**: Hook `packages/delivery` into an automated email/digest dispatch when new POF records are published.
3. **Automated Expansion Prompts**: Trigger county expansion offers when client feedback logs $\ge 3$ positive dispositions.
