import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FiduciaryAppointmentSchema,
  AuthorityAssessmentSchema,
} from '../../packages/authority/dist/index.js';

test('Authority: unlocated decision maker must be represented as null', () => {
  const unlocatedFiduciary = {
    personId: null,
    fullName: null,
    role: 'UNAPPOINTED',
    appointmentDate: null,
    lettersIssued: false,
    bondAmount: null,
    verifiedEvidenceId: null,
  };

  const parsed = FiduciaryAppointmentSchema.parse(unlocatedFiduciary);
  assert.equal(parsed.fullName, null);
  assert.equal(parsed.personId, null);
  assert.equal(parsed.role, 'UNAPPOINTED');
});

test('Authority: prohibits synthetic Vance family fiduciaries', () => {
  const fakeVance = {
    personId: 'synthetic_01',
    fullName: 'Thomas Vance',
    role: 'EXECUTOR',
    appointmentDate: new Date().toISOString(),
    lettersIssued: true,
    bondAmount: 10000,
    verifiedEvidenceId: 'ev_01',
  };

  assert.throws(
    () => FiduciaryAppointmentSchema.parse(fakeVance),
    /Prohibited synthetic placeholder/
  );

  const fakeTheo = {
    ...fakeVance,
    fullName: 'Theo Vance',
  };

  assert.throws(
    () => FiduciaryAppointmentSchema.parse(fakeTheo),
    /Prohibited synthetic placeholder/
  );
});

test('Authority: legitimate fiduciary with verified evidence passes validation', () => {
  const legitimate = {
    personId: 'person_legit_42',
    fullName: 'Sarah Jenkins',
    role: 'EXECUTOR',
    appointmentDate: '2026-03-15T00:00:00.000Z',
    lettersIssued: true,
    bondAmount: 50000,
    verifiedEvidenceId: 'ev_order_99',
  };

  const parsed = FiduciaryAppointmentSchema.parse(legitimate);
  assert.equal(parsed.fullName, 'Sarah Jenkins');
  assert.equal(parsed.role, 'EXECUTOR');
  assert.equal(parsed.lettersIssued, true);
});
