# Automated Workflow Registry & Design Spec — Gieni OS

> **Spec Date**: September 26, 2026  
> **Framework**: TAC Primitives (`TRIGGER → ACTION → CONDITION`)  
> **System Context**: Probate Intelligence Ingestion, QC Review, POF Publication & Delivery  

---

## 1. Master Workflow Registry

| ID | Workflow Name | Lifecycle Stage | Trigger Type | Implementation Target | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **W01** | Client Onboarding & Sample Dossier | Activation | User Signup Event | `apps/web/src/app/client` | **P0** |
| **W02** | Real-Time Delivery Alert (Email/Webhook) | Retention | State-Change (`PUBLISHED`) | `packages/delivery/src/dispatcher.ts` | **P1** |
| **W03** | Webhook Delivery Retry with Backoff | Resilience | External Event (`5xx/Timeout`) | `packages/delivery/src/retry-queue.ts` | **P1** |
| **W04** | High-Value Case SLA Watchdog | Operations | Time-Based ($> 24\text{h}$ in QC) | `packages/qc/src/queue-health.ts` | **P2** |
| **W05** | County Expansion Trigger | Expansion | Behavior ($\ge 3$ `PURCHASED`) | `apps/web/src/lib/actions.ts` | **P2** |
| **W06** | Inactivity Win-Back Loop | Win-back | Silence (14 days no portal login) | Background Worker / Cron | **P3** |
| **W07** | Operator Morning Health Briefing | Operations | Time-Based (07:00 AM Daily) | `packages/county-adapters/telemetry` | **P2** |

---

## 2. Detailed Workflow Blueprints

### Blueprint W01: Client Onboarding & County Selection
- **Purpose**: Prevent empty-state churn when a new Clerk organization logs into the Client Portal.
- **TAC**:
  - **Trigger**: User visits `/client` with 0 active POF records.
  - **Condition**: `initialData.deliveries.length === 0`.
  - **Action**: Render interactive onboarding banner:
    1. Display supported jurisdictions (Travis TX, Pierce WA, King WA, Thurston WA, Maricopa AZ).
    2. Provide an instant "Explore Verified Sample Opportunity" modal.
    3. Allow one-click webhook configuration.

### Blueprint W02: Delivery Publication Notification
- **Purpose**: Notify client stakeholders immediately when a time-sensitive probate filing passes QC and publication gates.
- **TAC**:
  - **Trigger**: `publishEligibleOpportunity()` transitions opportunity to `PUBLISHED`.
  - **Condition**: Client organization has active notification channels enabled.
  - **Action**:
    1. Dispatch payload to authenticated client webhook with HMAC-SHA256 signature.
    2. Queue an instant email dispatch with summary details (Jurisdiction, Equity Band, Authority Tier).

### Blueprint W03: Resilient Webhook Retry with Exponential Backoff
- **Purpose**: Prevent delivery loss when client receiver endpoints experience temporary downtime.
- **TAC**:
  - **Trigger**: `dispatchRealWebhook()` returns `httpStatus >= 500` or network timeout.
  - **Condition**: `attemptCount < 5`.
  - **Action**: Enqueue retry task with jittered exponential delay ($T_1=2\text{m}, T_2=10\text{m}, T_3=30\text{m}, T_4=2\text{h}, T_5=12\text{h}$). If exhausted, mark `DEAD_LETTER` and notify operator.

### Blueprint W04: High-Value QC SLA Watchdog
- **Purpose**: Ensure cases with estimated equity $\ge \$500\text{k}$ do not stall in queue.
- **TAC**:
  - **Trigger**: Cron job runs every 30 minutes.
  - **Condition**: Active exception priority is `EXPEDITE_SENIOR_REVIEW` and `ageHours > 12`.
  - **Action**: Send priority escalation alert to operator Slack/email and flag in Operator Console header.

### Blueprint W05: Automated County Expansion Prompt
- **Purpose**: Expand client organization LTV when they achieve deal success.
- **TAC**:
  - **Trigger**: Client logs feedback disposition `PURCHASED` or `UNDER_CONTRACT`.
  - **Condition**: Total positive dispositions for client $\ge 3$ and client is licensed for $< 3$ counties.
  - **Action**: Display an in-portal milestone banner offering adjacent county feed provisioning at preferred pilot pricing.
