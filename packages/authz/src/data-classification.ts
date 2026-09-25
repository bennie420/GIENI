import { z } from 'zod';

/**
 * Gieni OS Data Classification & Security Boundaries (Section 11 P2-4).
 *
 * Tiers:
 * - PUBLIC_RECORD: Raw court dockets, public property rolls, county recording instruments.
 * - BUSINESS: Commercial terms, organization profiles, feedback dispositions, subscription state.
 * - CONFIDENTIAL: Person profiles, heirship determinations, case notes, unreleased POFs.
 * - PII: Personal phone numbers, residential addresses, non-public personal identifiers.
 * - REGULATED: Bank records, SSNs, financial bonds, state-protected sensitive records.
 * - INTERNAL_INTELLIGENCE: Claims, OCR layout, model confidence, deterministic scores, exceptions.
 */
export type DataClassificationTier =
  | 'PUBLIC_RECORD'
  | 'BUSINESS'
  | 'CONFIDENTIAL'
  | 'PII'
  | 'REGULATED'
  | 'INTERNAL_INTELLIGENCE'
  | 'ENRICHED_PII';

export const DataClassificationTierSchema = z.enum([
  'PUBLIC_RECORD',
  'BUSINESS',
  'CONFIDENTIAL',
  'PII',
  'REGULATED',
  'INTERNAL_INTELLIGENCE',
  'ENRICHED_PII',
]);

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
  BUSINESS: {
    tier: 'BUSINESS',
    allowClientRead: true,
    maskInSessionReplay: true,
    encryptAtRest: true,
    auditReadEvents: true,
  },
  CONFIDENTIAL: {
    tier: 'CONFIDENTIAL',
    allowClientRead: false,
    maskInSessionReplay: true,
    encryptAtRest: true,
    auditReadEvents: true,
  },
  PII: {
    tier: 'PII',
    allowClientRead: false,
    maskInSessionReplay: true,
    encryptAtRest: true,
    auditReadEvents: true,
  },
  REGULATED: {
    tier: 'REGULATED',
    allowClientRead: false,
    maskInSessionReplay: true,
    encryptAtRest: true,
    auditReadEvents: true,
  },
  INTERNAL_INTELLIGENCE: {
    tier: 'INTERNAL_INTELLIGENCE',
    allowClientRead: false,
    maskInSessionReplay: true,
    encryptAtRest: true,
    auditReadEvents: false,
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
 * Domain entity to data classification mapping.
 */
export const ENTITY_CLASSIFICATION_MAP: Record<string, DataClassificationTier> = {
  PropertyParcel: 'PUBLIC_RECORD',
  CourtRecord: 'PUBLIC_RECORD',
  ProbateCase: 'PUBLIC_RECORD',
  PersonRecord: 'CONFIDENTIAL',
  FiduciaryContactPhone: 'PII',
  FiduciaryContactEmail: 'REGULATED',
  ClientFeedback: 'BUSINESS',
  OpportunityScore: 'INTERNAL_INTELLIGENCE',
  ClaimAuditEvent: 'CONFIDENTIAL',
};

export function getEntityClassification(entityType: string): DataClassificationTier {
  return ENTITY_CLASSIFICATION_MAP[entityType] || 'CONFIDENTIAL';
}


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
