import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NoRecordsLocatedResultSchema,
  PropertyParcelSchema,
} from '../../packages/property/dist/index.js';

test('Property: unindexed records fail transparently with NO_RECORDS_LOCATED', () => {
  const transparentMissing = {
    status: 'NO_RECORDS_LOCATED',
    countyId: 'county_travis_tx',
    searchType: 'DEED',
    searchQuery: { apn: '02-4412-009', grantee: 'Unknown Decedent' },
    sourcesChecked: ['Travis County Clerk Web Access', 'Travis CAD Public API'],
    searchedAt: new Date().toISOString(),
    message: 'No deeds or recorded instruments indexed for this parcel and party.',
  };

  const parsed = NoRecordsLocatedResultSchema.parse(transparentMissing);
  assert.equal(parsed.status, 'NO_RECORDS_LOCATED');
  assert.equal(parsed.sourcesChecked.length, 2);
  assert.equal(parsed.searchType, 'DEED');
});

test('Property: valid parcel with verified evidence passes validation', () => {
  const parcel = {
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
    lastSaleDate: '2019-06-12T00:00:00.000Z',
    lastSalePrice: 480000,
    verifiedEvidenceIds: ['ev_cad_tax_roll_01'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const parsed = PropertyParcelSchema.parse(parcel);
  assert.equal(parsed.totalAssessedValue, 620000);
  assert.equal(parsed.apn, '02-4412-009');
});
