/**
 * Control Bounded Context (Gieni OS Section 10 & 11 P1-3).
 *
 * Enforces the core domain invariant:
 * Property != Ownership != Control != Authority
 *
 * Ownership denotes title/deed holding on real property.
 * Control denotes practical management and possessory agency over the asset.
 * Authority denotes statutory and judicial legal empowerment (Letters Testamentary, Letters of Administration).
 *
 * CRITICAL RULE:
 * Ownership NEVER implies Authority. A deed record showing ownership does NOT empower an
 * heir, attorney-in-fact, or third party to execute disposition of a deceased estate without
 * explicit judicial appointment.
 */

export type ControlMechanism =
  | 'LETTERS_TESTAMENTARY'      // Judicial personal representative of testate estate
  | 'LETTERS_OF_ADMINISTRATION'  // Judicial administrator of intestate estate
  | 'TRUST_AGREEMENT'            // Active trustee under recorded or verified trust
  | 'SURVIVORSHIP_TRANSFER'      // Operation of law via joint tenancy deed with survivorship
  | 'DEED_TITLE_HOLDER'          // Direct title record (valid only during lifetime)
  | 'POWER_OF_ATTORNEY'          // Extinguished upon death of principal
  | 'UNRESOLVED';

export type ControlStatus =
  | 'ESTATE_JUDICIAL_CONTROL'
  | 'TRUSTEE_CONTROL'
  | 'SURVIVOR_OPERATION_OF_LAW'
  | 'DISPUTED_CONTROL'
  | 'NO_LEGAL_CONTROL'
  | 'UNRESOLVED';

export interface ControlAssessment {
  id: string;
  organizationId: string;
  countyId: string;
  clientId?: string | null;
  parcelId: string;
  caseId?: string | null;
  primaryControllerName: string | null;
  controlMechanism: ControlMechanism;
  status: ControlStatus;
  effectiveBasis: string;
  canConveyTitle: boolean;
  verifiedEvidenceIds: string[];
  verifiedClaimIds: string[];
  notes?: string;
  confidence: number;
  ruleVersion: string;
  evaluatedAt: string;
  evaluatorId: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
