import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTenantScopedRepository } from '../../packages/database/dist/index.js';

test('Database: enforces tenant scoping and prevents cross-tenant access', async () => {
  const repo = new InMemoryTenantScopedRepository();

  const tenantA = { organizationId: 'org_client_A', countyId: 'county_travis' };
  const tenantB = { organizationId: 'org_client_B', countyId: 'county_travis' };

  // Create record under Tenant A
  const entityA = await repo.create(tenantA, {
    countyId: 'county_travis',
    payloadName: 'Confidential Lead A',
    schemaVersion: 1,
  });

  // Tenant A can retrieve it
  const foundByA = await repo.findById(tenantA, entityA.id);
  assert.notEqual(foundByA, null);
  assert.equal(foundByA?.payloadName, 'Confidential Lead A');

  // Tenant B CANNOT retrieve Tenant A's record
  const foundByB = await repo.findById(tenantB, entityA.id);
  assert.equal(foundByB, null);

  // Tenant B findMany does NOT include Tenant A's record
  const listB = await repo.findMany(tenantB);
  assert.equal(listB.length, 0);

  // Unscoped query throws security exception
  await assert.rejects(
    () => repo.findById({ organizationId: '' }, entityA.id),
    /Security Violation: Database queries must carry a valid non-empty organizationId/
  );
});

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

test('Database: FileTenantScopedRepository persists records to disk across reloads', async () => {
  const { FileTenantScopedRepository } = await import('../../packages/database/dist/index.js');
  const tempDir = path.join(os.tmpdir(), 'test_db_' + Date.now());
  
  const repo1 = new FileTenantScopedRepository('testCollection', tempDir);
  const scope = { organizationId: 'org_test', countyId: 'county_thurston_wa' };
  
  const created = await repo1.create(scope, {
    countyId: 'county_thurston_wa',
    title: 'Test Estate Case',
  });
  
  // Create a second repository instance pointing to the same disk directory (simulating server reload)
  const repo2 = new FileTenantScopedRepository('testCollection', tempDir);
  const found = await repo2.findById(scope, created.id);
  assert.notEqual(found, null);
  assert.equal(found.title, 'Test Estate Case');
  
  // Clean up
  fs.rmSync(tempDir, { recursive: true, force: true });
});
