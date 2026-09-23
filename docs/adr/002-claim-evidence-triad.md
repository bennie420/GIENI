# ADR 002: Claim–Evidence Triad & Projection Integrity

## Status
Accepted

## Context
Probate intelligence requires high evidential rigor. Automated systems that output ungrounded assertions or treat LLM extractions as authoritative facts generate severe legal liability for operators and clients.

## Decision
Every material domain assertion must strictly implement the Claim–Evidence Triad:
1. **SourceDocument**: Immutable primary document stored in Google Cloud Storage with SHA-256 hash.
2. **ClaimEvidence**: Concrete proof pointer specifying `pageNumber`, `sourceLocator`, `excerpt`, and matching `artifactSha256`.
3. **Claim**: Atomic asserted fact with `claimType: "EXTRACTED" | "MATCHED" | "DERIVED" | "HUMAN_VERIFIED"`, `confidence`, and `verificationStatus`.
   - LLM (Gemini) outputs must be stored strictly as `PROPOSED` claims.
   - Only human QC or verified deterministic rules can transition claims to `VERIFIED`.
   - Unverified claims are barred from client POF delivery.

4. **Embed vs Reference**:
   - `Opportunity.currentSnapshot` is a denormalized presentation projection rebuilt deterministically via `buildOpportunitySnapshot()`.
   - Raw document texts, large extractions, and full audit histories are strictly referenced by ID and never embedded inside opportunities.
