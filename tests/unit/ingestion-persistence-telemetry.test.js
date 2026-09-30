import test from 'node:test';
import assert from 'node:assert/strict';
import { MunicipalIngestionPipeline } from '../../packages/county-adapters/dist/index.js';

test('Ingestion Persistence: IngestionRunResult reports persistenceStatus without silent swallow', async () => {
  const result = await MunicipalIngestionPipeline.execute({
    countyId: 'county_travis_tx',
    lookbackDays: 14,
    limit: 10,
  });

  assert.ok(result.runId, 'runId should be present');
  assert.ok(result.casesHarvested > 0, 'casesHarvested should be > 0');
  assert.ok(result.documentsPreserved > 0, 'documentsPreserved should be > 0');
  
  // Verify persistenceStatus field is exposed on result
  assert.ok(
    result.persistenceStatus === 'SKIPPED' ||
      result.persistenceStatus === 'SUCCESS' ||
      result.persistenceStatus === 'FAILED',
    `persistenceStatus must be defined, got ${result.persistenceStatus}`
  );

  // In standalone pipeline run without DB scope, default is SKIPPED
  assert.equal(result.persistenceStatus, 'SKIPPED');
  assert.equal(result.persistenceError, null);
});
