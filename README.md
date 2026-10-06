# GIENI (Gieni OS)

[![Sponsorship Badge](https://readmepay.com/badge/bennie420/GIENI.svg)](https://readmepay.com/click/active/49)
Gieni OS is an evidence-first probate intelligence and investigation platform.
It is a TypeScript monorepo with a web app, background workers, and domain packages for probate research workflows.

## Repository Layout

- `apps/web` — Next.js Operator Console and Client Portal
- `apps/workers` — background jobs (ingestion, OCR, extraction proposals, scoring, delivery)
- `packages/*` — shared domain and platform modules (database, authz, evidence, property, ownership, authority, scoring, workflow, qc, delivery, and others)
- `docs/` — architecture, workflow, and planning documentation

## Prerequisites

- Node.js `>=20`
- npm `>=10`

## Getting Started

```bash
npm install
npm run dev
```

By default, `npm run dev` starts the web app workspace (`@gieni/web`).

## Common Commands

```bash
# Build all workspaces
npm run build

# Type-check all workspaces
npm run type-check

# Run root unit/integration tests
npm test

# Lint all workspaces
npm run lint

# Seed worker data
npm run seed
```

## Workspace Notes

- Root uses npm workspaces: `apps/*` and `packages/*`.
- Domain packages are designed to be consumed by apps and other packages.
- Tenant boundaries, evidence requirements, and deterministic scoring rules are core platform constraints.

## Legal Boundary

All outputs should respect this platform boundary:

> Research finding—not legal opinion or title guarantee.
