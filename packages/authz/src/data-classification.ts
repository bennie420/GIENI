/**
 * Gieni OS Data Classification & Security Boundaries.
 *
 * Tiers:
 * - PUBLIC_RECORD: Raw court dockets, public property rolls, county recording instruments.
 * - INTERNAL_INTELLIGENCE: Claims, OCR layout, model confidence, deterministic scores, exceptions.
 * - CLIENT_CONFIDENTIAL: Delivery files, tenant feedback, notes, contract status.
 * - ENRICHED_PII: Phone numbers, personal email addresses, skip-trace findings.
 */
export type DataClassificationTier =
  | 'PUBLIC_RECORD'
  | 'INTERNAL_INTELLIGENCE'
  | 'CLIENT_CONFIDENTIAL'
  | 'ENRICHED_PII';

export interface DataClassificationPolicy {
  tier: DataClassificationTier;
  allowClientRead: boolean;
  maskInSessionReplay: boolean;
  encryptAtRest: boolean;
  auditReadEvents: boolean;
}

export const CLASSIFICATION_POLICIES: Record<DataClassificationTier, DataClassificationPolicy> = {
  PUBLIC_RECORD: {
    tier: 'PUBLIC_RECORD',
    allowClientRead: true,
    maskInSessionReplay: false,
    encryptAtRest: true,
    auditReadEvents: false,
  },
  INTERNAL_INTELLIGENCE: {
    tier: 'INTERNAL_INTELLIGENCE',
    allowClientRead: false,
    maskInSessionReplay: true,
    encryptAtRest: true,
    auditReadEvents: false,
  },
  CLIENT_CONFIDENTIAL: {
    tier: 'CLIENT_CONFIDENTIAL',
    allowClientRead: true,
    maskInSessionReplay: true,
    encryptAtRest: true,
    auditReadEvents: true,
  },
  ENRICHED_PII: {
    tier: 'ENRICHED_PII',
    allowClientRead: false,
    maskInSessionReplay: true,
    encryptAtRest: true,
    auditReadEvents: true,
  },
};

/**
 * Aggressive PII masking for Sentry Session Replay, client exports, and logs.
 * Masks email addresses, phone numbers, and Social Security / Tax IDs.
 */
export function maskPii(text: string): string {
  if (!text) return text;

  // Mask email addresses (e.g. j***@domain.com)
  const maskedEmail = text.replace(/([a-zA-Z0-9_\.-])[a-zA-Z0-9_\.-]+(@[a-zA-Z0-9\.-]+\.[a-zA-Z]{2,})/g, '$1***$2');

  // Mask phone numbers (e.g. ***-***-1234)
  const maskedPhone = maskedEmail.replace(/(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-](\d{4})/g, '***-***-$3');

  // Mask SSN / Tax IDs (e.g. ***-**-1234)
  const maskedSsn = maskedPhone.replace(/\b\d{3}-\d{2}-(\d{4})\b/g, '***-**-$1');

  return maskedSsn;
}

/**
 * Validates that an unverified AI claim is never published to client tenants.
 */
export function assertClaimEligibleForDelivery(claim: {
  verificationStatus: string;
  claimType: string;
}): void {
  if (claim.verificationStatus !== 'VERIFIED') {
    throw new Error(
      `Security Violation: AI Claim with status '${claim.verificationStatus}' cannot be published to client. Only VERIFIED claims are delivery eligible.`
    );
  }
}
