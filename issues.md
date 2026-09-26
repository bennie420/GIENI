# Issues & Project Action Backlog

This document tracks all active technical debt, architectural risks, customer journey friction points, and automation gaps across Gieni OS.

---

## 🚨 Critical (P0) — Showstoppers & Integrity Hazards

- [x] **ISSUE-001 (Persistence Feedback)**: `apps/web/src/lib/actions.ts:triggerMunicipalScraperAction` now records persistence status directly in telemetry events and prevents silent failure illusions.
- [x] **ISSUE-002 (Web Type-Check Maintenance)**: Verified clean JSDoc/TS structure and FiduciaryRole domain types; `npm run type-check` passes cleanly across all 15 workspaces.

---

## ⚠️ High (P1) — Resilience & Customer Lifecycle Gaps

- [x] **ISSUE-003 (Webhook Delivery Retry Queue)**: Implemented `WebhookRetryQueue` in `packages/delivery/src/retry-queue.ts` with exponential backoff and dead-letter progression. Unit test passing.
- [x] **ISSUE-004 (Client Portal Empty State Dead-End)**: Added `OnboardingHero` in `apps/web/src/app/client/components/OnboardingHero.tsx` rendering interactive county preview, verified sample dossier, and setup CTAs.
- [x] **ISSUE-005 (Self-Service Webhook Management)**: Added `WebhookSetupModal` in `apps/web/src/app/client/components/WebhookSetupModal.tsx` allowing client organizations to configure webhook targets, regenerate HMAC keys, and dispatch signed test pings.
- [x] **ISSUE-006 (Automated Delivery Notification)**: Implemented `dispatchDeliveryNotifications` in `packages/delivery/src/notification-dispatcher.ts` supporting Email, Slack webhooks, and in-app banners. Unit tested.

---

## ⚙️ Medium (P2) — Workflow & Operational Automation

- [x] **ISSUE-007 (Operator Morning Briefing Digest)**: Implemented `generateOperatorMorningBriefing` in `packages/qc/src/morning-briefing.ts` aggregating SLA breaches, layout drift flags, and active county volumes.
- [x] **ISSUE-008 (Abandoned Review Re-Engagement)**: Implemented `scanStalledHighValueReviews` in `packages/qc/src/stalled-review-watchdog.ts` alerting researchers and escalation paths when high-value cases remain in review for $> 24\text{h}$. Unit tested.
- [x] **ISSUE-009 (Client Feedback Loop Analytics)**: Implemented `analyzeClientFeedbackDispositions` in `packages/delivery/src/analytics.ts` computing conversion rates, county expansion triggers, and scoring tuning cues. Unit tested.

---

## 🟢 Low (P3) — Ergonomics & Polish

- [x] **ISSUE-010 (Queue Health Dashboard Badging)**: Display active SLA breach counter badges on the Operator Console navigation bar using `packages/qc/src/queue-health.ts` in `TabNav.tsx`.
- [x] **ISSUE-011 (Interactive Audit Trail Inspector)**: Enhanced the Client Portal evidence modal with direct clickable copy and cryptographic provenance verification (`EvidenceModal.tsx`).


