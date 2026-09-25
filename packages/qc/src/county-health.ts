import { z } from 'zod';
import { ReviewQueueHealth } from './queue-health.js';

export const CountyOperationalStatusSchema = z.enum(['HEALTHY', 'DEGRADED', 'CIRCUIT_TRIPPED', 'OFFLINE']);
export type CountyOperationalStatus = z.infer<typeof CountyOperationalStatusSchema>;

export const CountyHealthTelemetrySchema = z.object({
  countyId: z.string().min(1),
  countyName: z.string().min(1),
  operationalStatus: CountyOperationalStatusSchema,
  circuitState: z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']),
  pipelineThroughputPerHour: z.number().int().min(0),
  activeCaseCount: z.number().int().min(0),
  queueHealth: z.object({
    backlogDepth: z.number().int().min(0),
    oldestPendingHours: z.number().min(0),
    healthStatus: z.enum(['HEALTHY', 'DEGRADED', 'CRITICAL']),
  }),
  exceptions: z.object({
    openCount: z.number().int().min(0),
    highValueCount: z.number().int().min(0),
    resolvedCount: z.number().int().min(0),
  }),
  deliveryMetrics: z.object({
    publishedToday: z.number().int().min(0),
    successfulWebhooks: z.number().int().min(0),
    failedWebhooks: z.number().int().min(0),
    deliverySlaPercentage: z.number().min(0).max(100),
  }),
  evaluatedAt: z.string().datetime(),
});
export type CountyHealthTelemetry = z.infer<typeof CountyHealthTelemetrySchema>;

/**
 * Aggregates multi-source telemetry into an authoritative County Health Dashboard view (Gieni OS Section 12 OP-003).
 */
export function buildCountyHealthTelemetry(params: {
  countyId: string;
  countyName: string;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  queueHealth: ReviewQueueHealth;
  activeCaseCount: number;
  openExceptions: number;
  highValueExceptions: number;
  resolvedExceptions: number;
  publishedToday: number;
  successfulDeliveries: number;
  failedDeliveries: number;
}): CountyHealthTelemetry {
  const totalDeliveries = params.successfulDeliveries + params.failedDeliveries;
  const deliverySla = totalDeliveries > 0
    ? Math.round((params.successfulDeliveries / totalDeliveries) * 100)
    : 100;

  let operationalStatus: CountyOperationalStatus = 'HEALTHY';

  if (params.circuitState === 'OPEN') {
    operationalStatus = 'CIRCUIT_TRIPPED';
  } else if (params.circuitState === 'HALF_OPEN' || params.queueHealth.healthStatus === 'CRITICAL' || deliverySla < 90) {
    operationalStatus = 'DEGRADED';
  }

  const telemetry: CountyHealthTelemetry = {
    countyId: params.countyId,
    countyName: params.countyName,
    operationalStatus,
    circuitState: params.circuitState,
    pipelineThroughputPerHour: Math.max(0, params.publishedToday * 4),
    activeCaseCount: params.activeCaseCount,
    queueHealth: {
      backlogDepth: params.queueHealth.totalPendingExceptions,
      oldestPendingHours: params.queueHealth.oldestPendingHours,
      healthStatus: params.queueHealth.healthStatus,
    },
    exceptions: {
      openCount: params.openExceptions,
      highValueCount: params.highValueExceptions,
      resolvedCount: params.resolvedExceptions,
    },
    deliveryMetrics: {
      publishedToday: params.publishedToday,
      successfulWebhooks: params.successfulDeliveries,
      failedWebhooks: params.failedDeliveries,
      deliverySlaPercentage: deliverySla,
    },
    evaluatedAt: new Date().toISOString(),
  };

  return CountyHealthTelemetrySchema.parse(telemetry);
}
