import { Claim } from './types.js';

export interface VerificationPolicyContext {
  actorId: string;
  actorRole: string;
  knownExceptions?: Array<{ id: string; status: string; subjectId: string; type: string }>;
  verifiedArtifactHashes?: Set<string>;
}

export interface VerificationPolicyResult {
  allowed: boolean;
  violations: string[];
}

/**
 * ClaimVerificationPolicy enforces evidence sufficiency, cryptographic integrity,
 * and actor authorization before any claim may transition to VERIFIED (Gieni OS Section 12 EI-002).
 */
export class ClaimVerificationPolicy {
  public static readonly ALLOWED_VERIFIER_ROLES = new Set([
    'org:operator_admin',
    'org:qc_reviewer',
    'org:senior_qc_lead',
  ]);

  /**
   * Evaluates a proposed claim against mandatory policy invariants.
   */
  public static evaluate(
    claim: Claim,
    context: VerificationPolicyContext
  ): VerificationPolicyResult {
    const violations: string[] = [];

    // 1. Reviewer Authentication & Authorization Check
    if (!context.actorId || context.actorId.trim().length === 0) {
      violations.push('Policy Violation: Reviewer must be authenticated with a non-empty actorId.');
    }

    if (!this.ALLOWED_VERIFIER_ROLES.has(context.actorRole)) {
      violations.push(
        `Policy Violation: Role '${context.actorRole}' is not authorized to certify claims. Required: operator_admin or qc_reviewer.`
      );
    }

    // 2. Primary Evidence Presence Check
    if (!claim.evidence || claim.evidence.length === 0) {
      violations.push(
        'Policy Violation: Claim cannot be verified without at least one primary source evidence link.'
      );
    } else {
      // 3. Evidence SHA-256 Format and Verification Check
      for (let i = 0; i < claim.evidence.length; i++) {
        const ev = claim.evidence[i];
        if (!ev.artifactSha256 || ev.artifactSha256.length !== 64) {
          violations.push(
            `Policy Violation: Evidence item ${i} has invalid or missing SHA-256 fingerprint.`
          );
        } else if (
          context.verifiedArtifactHashes &&
          !context.verifiedArtifactHashes.has(ev.artifactSha256)
        ) {
          violations.push(
            `Policy Violation: Evidence artifact SHA-256 '${ev.artifactSha256.slice(0, 8)}...' does not match authentic verified document store.`
          );
        }
      }
    }

    // 4. Blocking Conflicts Check
    if (context.knownExceptions && context.knownExceptions.length > 0) {
      const blocking = context.knownExceptions.filter(
        (exc) =>
          exc.subjectId === claim.subjectId &&
          (exc.status === 'PENDING_REVIEW' || exc.status === 'OPEN')
      );
      if (blocking.length > 0) {
        violations.push(
          `Policy Violation: Subject '${claim.subjectId}' has ${blocking.length} unresolved investigation exception(s). Exceptions must be resolved prior to claim verification.`
        );
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
    };
  }

  /**
   * Asserts policy compliance and throws an explicit error if any violation exists.
   */
  public static assertCompliant(claim: Claim, context: VerificationPolicyContext): void {
    const result = this.evaluate(claim, context);
    if (!result.allowed) {
      throw new Error(`Verification Policy Rejected Claim '${claim.id}':\n- ${result.violations.join('\n- ')}`);
    }
  }
}
