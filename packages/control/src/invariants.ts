import { ControlAssessment } from './types.js';

/**
 * Validates the core legal invariant:
 * Ownership != Authority
 *
 * Checks whether an actor attempting disposition of an asset has actual legal capacity
 * rather than mere nominal deed presence.
 */
export function validateConveyanceCapacity(assessment: ControlAssessment): {
  canConvey: boolean;
  reason: string;
} {
  switch (assessment.controlMechanism) {
    case 'LETTERS_TESTAMENTARY':
    case 'LETTERS_OF_ADMINISTRATION':
      return {
        canConvey: true,
        reason: 'Judicial letters confirm personal representative authority to convey estate property.',
      };

    case 'TRUST_AGREEMENT':
      return {
        canConvey: true,
        reason: 'Active trustee holds fiduciary conveyance power under verified trust agreement.',
      };

    case 'SURVIVORSHIP_TRANSFER':
      return {
        canConvey: true,
        reason: 'Property vested in surviving joint tenant by operation of law.',
      };

    case 'POWER_OF_ATTORNEY':
      return {
        canConvey: false,
        reason:
          'Security Violation: Power of Attorney terminates upon death of principal. Agent holds zero post-mortem authority.',
      };

    case 'DEED_TITLE_HOLDER':
      return {
        canConvey: false,
        reason:
          'Security Violation: Nominal deed ownership of deceased person does not empower heirs without probate letters.',
      };

    case 'UNRESOLVED':
    default:
      return {
        canConvey: false,
        reason: 'Control and authority remain unlocated or disputed.',
      };
  }
}
