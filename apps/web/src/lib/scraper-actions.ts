import { getMongoDb, TenantScope } from '@gieni/database';
import {
  MunicipalIngestionPipeline,
  defaultCountyAdapterRegistry,
  IngestionRunResult,
} from '@gieni/county-adapters';
import { persistIngestionRunData } from './ingestion-persistence';

export interface TriggerMunicipalScraperInput {
  countyId: string;
  lookbackDays?: number;
  limit?: number;
}

export async function executeMunicipalScraper(
  scope: TenantScope,
  input: TriggerMunicipalScraperInput
): Promise<IngestionRunResult> {
  const { countyId, lookbackDays = 14, limit = 100 } = input;
  const result = await MunicipalIngestionPipeline.execute({
    countyId,
    lookbackDays,
    limit,
  });

  let persistenceSucceeded = false;
  let persistenceError: string | null = null;
  try {
    let db: any = undefined;
    try {
      db = await getMongoDb();
    } catch {
      // Atlas unreachable in local/sandbox, will persist to local store
    }
    await persistIngestionRunData(db, scope, countyId, result.data);
    persistenceSucceeded = true;
  } catch (dbErr: any) {
    persistenceError = dbErr instanceof Error ? dbErr.message : String(dbErr);
    console.warn('[Municipal Ingestion] DB persistence warning:', persistenceError);
  }

  result.persistenceStatus = persistenceSucceeded ? 'SUCCESS' : 'FAILED';
  result.persistenceError = persistenceError;

  result.telemetry.push({
    timestamp: new Date().toISOString(),
    stage: 'COMPLETE',
    level: persistenceSucceeded ? 'SUCCESS' : 'WARN',
    message: persistenceSucceeded
      ? `Ingestion run persisted successfully to tenant storage (${scope.organizationId})`
      : `Ingestion run memory-only: Storage persistence failed: ${persistenceError}`,
    details: { persistenceSucceeded, persistenceError },
  });

  return result;
}

export async function queryCountyHealthTelemetry() {
  const supported = defaultCountyAdapterRegistry.listSupportedCounties();
  const records = [];

  for (const c of supported) {
    const adapter = defaultCountyAdapterRegistry.getAdapter(c.countyId);
    if (!adapter) continue;
    const health = await adapter.getHealthStatus();
    records.push({
      ...health,
      state: adapter.stateCode,
    });
  }

  return records;
}
