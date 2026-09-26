# Security, Data Classification & Multi-Tenancy Rules

## 1. Multi-Tenant Scoping Invariants
- Every operational record carries `{ organizationId, clientId?, countyId, createdAt, updatedAt, schemaVersion }`.
- Client-direct database access is strictly prohibited. All queries must flow through server-side authorization guards using `TenantScopedRepository`.
- Cross-tenant negative isolation tests are required across all bounded contexts.

## 2. Data Classification
All data managed by Gieni OS is classified into four distinct boundaries:
1. `PUBLIC_RECORD`: County docket dockets, court records, recorded deeds, property assessor data.
2. `ENRICHED_PII`: Heirs, contact details, phone numbers, addresses (requires masking in logs/replays).
3. `INTERNAL_INTELLIGENCE`: Proprietary scoring rules, algorithm weights, exception logs, research notes.
4. `CLIENT_CONFIDENTIAL`: Delivery status, client webhook URLs, client feedback, CRM integration tokens.

## 3. "Stop Doing This" Anti-Patterns
- ❌ No synthetic "Vance" family fiduciaries (unlocated must be `null`).
- ❌ No fake deeds or mortgages (unindexed must be `NO_RECORDS_LOCATED`).
- ❌ No fake deliveries (status=SUCCESS requires authenticated HTTP acknowledgment).
- ❌ Mandatory legal disclaimer on all client presentations: *"research finding—not legal opinion or title guarantee"*.
