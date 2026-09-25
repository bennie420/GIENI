import crypto from 'node:crypto';
import { ClaimAuditEvent } from './types.js';

export interface ChainedClaimAuditEvent extends ClaimAuditEvent {
  auditHash: string;
  previousAuditHash: string | null;
}

/**
 * Computes a cryptographically deterministic SHA-256 hash for an audit event chained to previousHash (Gieni OS Section 12 EI-001).
 * Guarantees tamper-evidence: any retrospective edit to historical events breaks chain verification.
 */
export function computeAuditEventHash(
  event: Omit<ChainedClaimAuditEvent, 'auditHash'>,
  previousAuditHash: string | null
): string {
  const normalizedPayload = {
    claimId: event.claimId,
    eventType: event.eventType,
    previousStatus: event.previousStatus ?? null,
    newStatus: event.newStatus,
    actorId: event.actorId,
    rationale: event.rationale ?? null,
    organizationId: event.organizationId,
    countyId: event.countyId,
    createdAt: event.createdAt,
    previousAuditHash,
  };

  const payloadString = JSON.stringify(normalizedPayload, Object.keys(normalizedPayload).sort());
  return crypto.createHash('sha256').update(payloadString).digest('hex');
}

/**
 * Validates the cryptographic integrity of a sequence of chained audit events.
 * Returns valid: false and the corrupted event index if tampering is detected.
 */
export function verifyAuditChain(chain: ChainedClaimAuditEvent[]): {
  valid: boolean;
  brokenIndex?: number;
  reason?: string;
} {
  if (chain.length === 0) {
    return { valid: true };
  }

  // Genesis event must have null or genesis previousAuditHash
  let previousHash: string | null = null;

  for (let i = 0; i < chain.length; i++) {
    const event = chain[i];

    if (event.previousAuditHash !== previousHash) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Broken chain pointer at index ${i}: expected previousHash '${previousHash}', found '${event.previousAuditHash}'`,
      };
    }

    const calculatedHash = computeAuditEventHash(event, previousHash);
    if (calculatedHash !== event.auditHash) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Cryptographic hash mismatch at index ${i}: recorded '${event.auditHash}' does not match computed '${calculatedHash}'`,
      };
    }

    previousHash = event.auditHash;
  }

  return { valid: true };
}
