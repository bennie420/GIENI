import crypto from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDeliveryEligibility,
  assertDeliveryEligibility,
  verifyWebhookSignature,
  LEGAL_DISCLAIMER,
} from '../../packages/delivery/dist/index.js';
import { ClaimAuditEventSchema } from '../../packages/evidence/dist/index.js';


function createSamplePof(overrides = {}) {
  return {
    id: 'pof_valid_001',
    organizationId: 'org_gieni_internal',
    clientId: 'client_austin_capital',
    countyId: 'county_travis_tx',
    caseNumber: 'C-1-PB-26-000412',
    decedentName: 'Arthur James Jenkins',
    filingDate: '2026-03-01T00:00:00.000Z',
    property: {
      apn: '0204050607',
      addressText: '742 Evergreen Terrace, Austin, TX 78701',
      assessedValue: 485000,
      estimatedEquity: 340000,
      recordsLocated: true,
    },
    ownership: {
      status: 'CONFIRMED_SOLE',
      verifiedOwners: ['Arthur James Jenkins'],
    },
    authority: {
      status: 'CONFIRMED',
      tier: 1, // Tier 1: Independent Executor
      fiduciaryName: 'Sarah Louise Jenkins',
      fiduciaryRole: 'EXECUTOR',
      lettersIssued: true,
    },
    scoring: {
      compositeScore: 88,
      priorityBand: 'A',
      ruleVersion: '2026.1-probate-score',
    },
    evidence: [
      {
        claimPath: 'authority.fiduciary',
        factSummary: 'Letters testamentary issued to Sarah Jenkins',
        sourceDocumentName: 'letters_testamentary.pdf',
        pageNumber: 1,
        excerpt: 'SARAH LOUISE JENKINS be granted LETTERS TESTAMENTARY',
        artifactSha256: 'a'.repeat(64),
      },
    ],
    recommendedAction: 'Immediate Priority A Outbound',
    disclaimer: LEGAL_DISCLAIMER,
    publishedAt: '2026-03-02T12:00:00.000Z',
    createdAt: '2026-03-02T12:00:00.000Z',
    updatedAt: '2026-03-02T12:00:00.000Z',
    schemaVersion: 1,
    ...overrides,
  };
}

test('Delivery Eligibility: Valid opportunity with verified QC passes publication gate', () => {
  const pof = createSamplePof();
  const result = checkDeliveryEligibility({
    pof,
    unresolvedExceptionsCount: 0,
    qcCertified: true,
    unverifiedClaimsCount: 0,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.violations.length, 0);
  assert.doesNotThrow(() =>
    assertDeliveryEligibility({
      pof,
      unresolvedExceptionsCount: 0,
      qcCertified: true,
      unverifiedClaimsCount: 0,
    })
  );
});

test('Delivery Eligibility: Authority Tier 4 (Unappointed/Speculative Fiduciary) is strictly blocked', () => {
  const pof = createSamplePof({
    authority: {
      status: 'UNRESOLVED',
      tier: 4, // Tier 4
      fiduciaryName: null,
      fiduciaryRole: 'UNAPPOINTED',
      lettersIssued: false,
    },
  });

  const result = checkDeliveryEligibility({
    pof,
    unresolvedExceptionsCount: 0,
    qcCertified: true,
    unverifiedClaimsCount: 0,
  });

  assert.equal(result.eligible, false);
  assert.ok(
    result.violations.some((v) => v.includes('Authority Tier 4')),
    'Expected Tier 4 violation'
  );

  assert.throws(
    () =>
      assertDeliveryEligibility({
        pof,
        unresolvedExceptionsCount: 0,
        qcCertified: true,
        unverifiedClaimsCount: 0,
      }),
    /Authority Tier 4/
  );
});


test('Delivery Eligibility: Uncertified Human QC blocks publication', () => {
  const pof = createSamplePof();
  const result = checkDeliveryEligibility({
    pof,
    unresolvedExceptionsCount: 0,
    qcCertified: false,
    unverifiedClaimsCount: 0,
  });

  assert.equal(result.eligible, false);
  assert.ok(
    result.violations.some((v) => v.includes('Human QC review')),
    'Expected QC certification violation'
  );
});

test('Delivery Webhook: HMAC signatures and replay protection validation', () => {
  const secret = 'whsec_test_secret_0123456789abcdef';
  const payload = JSON.stringify({ event: 'delivery.published', opportunityId: 'opp_123' });
  const nowTs = Math.floor(Date.now() / 1000).toString();

  const validSig = crypto
    .createHmac('sha256', secret)
    .update(`${nowTs}.${payload}`)
    .digest('hex');


  // Valid signature and fresh timestamp passes
  const validResult = verifyWebhookSignature({
    payload,
    signature: `sha256=${validSig}`,
    timestamp: nowTs,
    secret,
    toleranceSeconds: 300,
  });
  assert.equal(validResult, true, 'Valid signature must verify');

  // Tampered payload fails
  const tamperedResult = verifyWebhookSignature({
    payload: payload + 'tampered',
    signature: `sha256=${validSig}`,
    timestamp: nowTs,
    secret,
    toleranceSeconds: 300,
  });
  assert.equal(tamperedResult, false, 'Tampered payload must fail');

  // Replay attack / expired timestamp fails
  const staleTs = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes old
  const staleSig = crypto
    .createHmac('sha256', secret)
    .update(`${staleTs}.${payload}`)
    .digest('hex');

  const replayResult = verifyWebhookSignature({
    payload,
    signature: `sha256=${staleSig}`,
    timestamp: staleTs,
    secret,
    toleranceSeconds: 300, // 5 min tolerance
  });
  assert.equal(replayResult, false, 'Replayed/expired timestamp must fail');
});

test('Audit Trail: ClaimAuditEvent schema validates immutable state transitions', () => {
  const validAuditEvent = {
    id: 'audit_ev_001',
    organizationId: 'org_gieni_internal',
    countyId: 'county_travis_tx',
    claimId: 'claim_123',
    eventType: 'VERIFIED',
    previousStatus: 'PROPOSED',
    newStatus: 'VERIFIED',
    actorId: 'operator_reviewer_42',
    rationale: 'Verified against stamped court order page 1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  assert.doesNotThrow(() => ClaimAuditEventSchema.parse(validAuditEvent));

  const invalidEvent = {
    ...validAuditEvent,
    eventType: 'INVALID_EVENT_TYPE',
  };

  assert.throws(() => ClaimAuditEventSchema.parse(invalidEvent));
});
