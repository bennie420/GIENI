# ADR 001: Modular Monorepo Prototype Architecture

## Status
Accepted

## Context
Internal planning materials envisioned nine independently deployed production microservices, an external message bus, graph database, and Temporal/BullMQ. Reproducing this full topology in an early prototype introduces premature distributed-systems overhead without adding intelligence or validation value.

## Decision
We consolidate the runtime into two Cloud Run deployable artifacts while strictly preserving bounded-context domain separation:
1. **`apps/web`**: Next.js 15 App Router providing Operator Console and Client Portal with Clerk Organizations authentication.
2. **`apps/workers`**: Node/TypeScript background runner handling Document AI OCR, Gemini proposal extraction, deterministic validation, scoring, and authentic webhook delivery.
3. **`packages/*`**: 10 decoupled domain packages enforcing strict dependency boundaries (`database`, `authz`, `evidence`, `property`, `ownership`, `authority`, `scoring`, `workflow`, `qc`, `delivery`).

## Consequences
- Single monorepo with fast local verification (`npm test`, `npm run type-check`).
- Shared domain contracts and Zod schemas across web and workers.
- High developer velocity while maintaining zero leakage between bounded contexts.
