import { ProbateOpportunityFile } from './types.js';

export interface DeliveryEligibilityInput {
  pof: ProbateOpportunityFile;
  unresolvedExceptionsCount?: number;
  qcCertified?: boolean;
  unverifiedClaimsCount?: number;
}

export interface DeliveryEligibilityResult {
  eligible: boolean;
  violations: string[];
}

/**
 * Delivery Eligibility Engine (Gieni OS Section 11 P0-4).
 * Enforces centralized delivery policy rules before client publication or webhook dispatch.
 *
 * Hard Rules:
 * 1. Zero PROPOSED / unverified claims in client-facing Opportunity File.
 * 2. Zero unresolved critical exceptions.
 * 3. Authority Tier 4 (unappointed/speculative) is STRICTLY BLOCKED from delivery.
 * 4. Human QC certification required.
 * 5. Legal disclaimer mandatory.
 */
export function checkDeliveryEligibility(
  input: DeliveryEligibilityInput
): DeliveryEligibilityResult {
  const violations: string[] = [];
  const {
    pof,
    unresolvedExceptionsCount = 0,
    qcCertified = true,
    unverifiedClaimsCount = 0,
  } = input;

  // Rule 1: No PROPOSED / unverified claims
  if (unverifiedClaimsCount > 0) {
    violations.push(
      `Delivery Blocked: Opportunity contains ${unverifiedClaimsCount} unverified / PROPOSED claim(s). Only VERIFIED claims may be delivered.`
    );
  }

  // Rule 2: Zero unresolved critical exceptions
  if (unresolvedExceptionsCount > 0) {
    violations.push(
      `Delivery Blocked: Opportunity has ${unresolvedExceptionsCount} unresolved investigation exception(s).`
    );
  }

  // Rule 3: Authority Tier 4 is strictly prohibited from publication
  if (pof.authority.tier === 4) {
    violations.push(
      `Delivery Blocked: Authority Tier 4 (Unappointed/Speculative Fiduciary) is ineligible for client delivery.`
    );
  }

  // Rule 4: Human QC certification required
  if (!qcCertified) {
    violations.push(
      `Delivery Blocked: Opportunity has not been certified by Human QC review.`
    );
  }

  // Rule 5: Legal disclaimer requirement
  if (!pof.disclaimer || !pof.disclaimer.includes('not legal opinion or title guarantee')) {
    violations.push(
      `Delivery Blocked: Missing mandatory legal disclaimer notice on opportunity file.`
    );
  }

  return {
    eligible: violations.length === 0,
    violations,
  };
}

export function assertDeliveryEligibility(input: DeliveryEligibilityInput): void {
  const result = checkDeliveryEligibility(input);
  if (!result.eligible) {
    throw new Error(
      `Security & Delivery Violation: Cannot publish Opportunity File '${input.pof.id}':\n` +
        result.violations.map((v) => ` - ${v}`).join('\n')
    );
  }
}
