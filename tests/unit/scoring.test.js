import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOpportunityScore,
  SCORING_RULE_VERSION,
} from '../../packages/scoring/dist/index.js';

test('Scoring: produces deterministic score and priority band without synthetic mocks', () => {
  const property = {
    id: 'parcel_101',
    organizationId: 'org_gieni_ops',
    countyId: 'county_travis_tx',
    apn: '02-4412-009',
    legalDescription: 'LOT 4 BLK B HIGHLAND PARK SEC 2',
    address: {
      street: '742 Evergreen Terrace',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      county: 'Travis',
    },
    assessedLandValue: 200000,
    assessedImprovementValue: 420000,
    totalAssessedValue: 620000,
    taxYear: 2025,
    lastSaleDate: null,
    lastSalePrice: null,
    verifiedEvidenceIds: ['ev_1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const authority = {
    id: 'auth_101',
    organizationId: 'org_gieni_ops',
    caseId: 'case_2026_01',
    countyId: 'county_travis_tx',
    status: 'CONFIRMED',
    tier: 1,
    fiduciary: {
      personId: 'p_101',
      fullName: 'Sarah Jenkins',
      role: 'EXECUTOR',
      appointmentDate: '2026-03-01T00:00:00.000Z',
      lettersIssued: true,
      bondAmount: null,
      verifiedEvidenceId: 'ev_order',
    },
    verifiedClaimIds: ['c_1'],
    evaluatedAt: new Date().toISOString(),
    evaluatorId: 'qc_admin',
    ruleVersion: 'v1.0.0',
    schemaVersion: 1,
  };

  const ownership = {
    id: 'own_101',
    organizationId: 'org_gieni_ops',
    parcelId: 'parcel_101',
    caseId: 'case_2026_01',
    countyId: 'county_travis_tx',
    status: 'DECEDENT_SOLE_OWNER',
    ownerNames: ['Arthur Jenkins'],
    deedRecordIds: ['deed_1'],
    verifiedClaimIds: ['c_2'],
    confidence: 1.0,
    ruleVersion: 'v1.0.0',
    evaluatedAt: new Date().toISOString(),
    evaluatorId: 'qc_admin',
    schemaVersion: 1,
  };

  const scoreResult = calculateOpportunityScore('score_101', {
    organizationId: 'org_gieni_ops',
    opportunityId: 'opp_101',
    countyId: 'county_travis_tx',
    property,
    authority,
    ownership,
    filingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days old
    estimatedLiensOrMortgageAmount: 50000,
  });

  assert.equal(scoreResult.ruleVersion, SCORING_RULE_VERSION);
  assert.equal(scoreResult.breakdown.authorityComponent, 100);
  assert.equal(scoreResult.breakdown.ownershipComponent, 100);
  assert.equal(scoreResult.breakdown.equityComponent, 100);
  assert.equal(scoreResult.breakdown.freshnessComponent, 100);
  assert.equal(scoreResult.breakdown.riskPenalty, 0);
  assert.equal(scoreResult.compositeScore, 100);
  assert.equal(scoreResult.priorityBand, 'PRIORITY_A');
});

test('Scoring: unresolved authority drops score and disqualifies priority A', () => {
  const scoreResult = calculateOpportunityScore('score_unresolved', {
    organizationId: 'org_gieni_ops',
    opportunityId: 'opp_unresolved',
    countyId: 'county_travis_tx',
    property: null,
    authority: null,
    ownership: null,
    filingDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  });

  assert.equal(scoreResult.priorityBand, 'DISQUALIFIED');
  assert.equal(scoreResult.compositeScore, 0);
});
