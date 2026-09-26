import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ControlAssessmentSchema,
  validateConveyanceCapacity,
} from '../../packages/control/dist/index.js';

test('Control Domain: Validates ControlAssessment schema with strict Zod parsing', () => {
  const assessment = {
    id: 'ctrl_001',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    clientId: 'client_austin_capital',
    parcelId: 'prop_001',
    caseId: 'case_001',
    primaryControllerName: 'Sarah Louise Jenkins',
    controlMechanism: 'LETTERS_TESTAMENTARY',
    status: 'ESTATE_JUDICIAL_CONTROL',
    effectiveBasis: 'Probate Court No. 1 Letters Testamentary Cause C-1-PB-26-000412',
    canConveyTitle: true,
    verifiedEvidenceIds: ['ev_letters_001'],
    verifiedClaimIds: ['claim_fiduciary_001'],
    confidence: 0.98,
    ruleVersion: '2026.1-control-rules',
    evaluatedAt: new Date().toISOString(),
    evaluatorId: 'qc_operator_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  assert.doesNotThrow(() => ControlAssessmentSchema.parse(assessment));
});

test('Control Domain: Invariant Property != Ownership != Control != Authority', () => {
  // Test case 1: Nominal deed ownership of deceased person without letters cannot convey
  const deedOnlyAssessment = {
    id: 'ctrl_deed_only',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    parcelId: 'prop_001',
    caseId: 'case_001',
    primaryControllerName: 'Arthur James Jenkins', // Deceased owner on deed
    controlMechanism: 'DEED_TITLE_HOLDER',
    status: 'NO_LEGAL_CONTROL',
    effectiveBasis: 'Warranty Deed Vol 120 Page 45 (Deceased)',
    canConveyTitle: false,
    verifiedEvidenceIds: ['ev_deed_01'],
    verifiedClaimIds: ['claim_owner_01'],
    confidence: 0.95,
    ruleVersion: '2026.1-control-rules',
    evaluatedAt: new Date().toISOString(),
    evaluatorId: 'qc_operator_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const deedResult = validateConveyanceCapacity(deedOnlyAssessment);
  assert.equal(deedResult.canConvey, false);
  assert.match(deedResult.reason, /Security Violation: Nominal deed ownership/);

  // Test case 2: Power of attorney terminates on death; cannot control probate disposition
  const poaAssessment = {
    ...deedOnlyAssessment,
    id: 'ctrl_poa',
    controlMechanism: 'POWER_OF_ATTORNEY',
    primaryControllerName: 'Robert Jenkins',
  };

  const poaResult = validateConveyanceCapacity(poaAssessment);
  assert.equal(poaResult.canConvey, false);
  assert.match(poaResult.reason, /Power of Attorney terminates upon death/);

  // Test case 3: Judicial Letters Testamentary grants authority to convey
  const judicialAssessment = {
    ...deedOnlyAssessment,
    id: 'ctrl_judicial',
    controlMechanism: 'LETTERS_TESTAMENTARY',
    status: 'ESTATE_JUDICIAL_CONTROL',
    primaryControllerName: 'Sarah Louise Jenkins',
    canConveyTitle: true,
  };

  const judicialResult = validateConveyanceCapacity(judicialAssessment);
  assert.equal(judicialResult.canConvey, true);
  assert.match(judicialResult.reason, /Judicial letters confirm personal representative authority/);
});
