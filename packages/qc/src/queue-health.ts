import { InvestigationException } from './types.js';

export type QueueHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

export interface ReviewQueueHealth {
  countyId: string;
  organizationId: string;
  totalPendingExceptions: number;
  expeditedSeniorCount: number;
  standardCount: number;
  oldestPendingHours: number;
  averageResolutionMinutes: number;
  breachedSlaCount: number;
  healthStatus: QueueHealthStatus;
  alerts: string[];
  evaluatedAt: string;
}

export interface QueueHealthComputationParams {
  countyId: string;
  organizationId: string;
  activeExceptions: InvestigationException[];
  recentlyResolvedExceptions?: InvestigationException[];
  slaThresholdHours?: number; // Defaults to 24 hours
}

interface PendingExceptionMetrics {
  expeditedSeniorCount: number;
  standardCount: number;
  oldestPendingHours: number;
  breachedSlaCount: number;
}

function computePendingMetrics(
  pendingExceptions: InvestigationException[],
  now: number,
  slaThresholdHours: number
): PendingExceptionMetrics {
  let expeditedSeniorCount = 0;
  let standardCount = 0;
  let oldestPendingHours = 0;
  let breachedSlaCount = 0;

  for (const exc of pendingExceptions) {
    if (exc.priority === 'EXPEDITE_SENIOR_REVIEW') {
      expeditedSeniorCount += 1;
    } else {
      standardCount += 1;
    }

    const createdTime = new Date(exc.createdAt).getTime();
    const ageHours = (now - createdTime) / (1000 * 60 * 60);

    if (ageHours > oldestPendingHours) {
      oldestPendingHours = Math.round(ageHours * 10) / 10;
    }

    if (ageHours > slaThresholdHours) {
      breachedSlaCount += 1;
    }
  }

  return { expeditedSeniorCount, standardCount, oldestPendingHours, breachedSlaCount };
}

function computeAverageResolutionMinutes(
  resolvedExceptions: InvestigationException[]
): number {
  let totalMinutes = 0;
  let count = 0;

  for (const exc of resolvedExceptions) {
    if (!exc.resolvedAt || !exc.createdAt) continue;
    const durationMin =
      (new Date(exc.resolvedAt).getTime() - new Date(exc.createdAt).getTime()) / (1000 * 60);
    if (durationMin > 0) {
      totalMinutes += durationMin;
      count += 1;
    }
  }

  return count > 0 ? Math.round(totalMinutes / count) : 0;
}

interface HealthEvaluationInput {
  breachedSlaCount: number;
  oldestPendingHours: number;
  slaThresholdHours: number;
  expeditedSeniorCount: number;
}

function evaluateQueueHealthStatus(input: HealthEvaluationInput): {
  healthStatus: QueueHealthStatus;
  alerts: string[];
} {
  const alerts: string[] = [];
  let healthStatus: QueueHealthStatus = 'HEALTHY';

  if (input.breachedSlaCount >= 5 || input.oldestPendingHours >= 48) {
    healthStatus = 'CRITICAL';
    alerts.push(
      `CRITICAL: ${input.breachedSlaCount} exceptions breached SLA; oldest is ${input.oldestPendingHours}h old.`
    );
  } else if (input.breachedSlaCount > 0 || input.oldestPendingHours >= input.slaThresholdHours) {
    healthStatus = 'DEGRADED';
    alerts.push(
      `DEGRADED: ${input.breachedSlaCount} exception(s) breached ${input.slaThresholdHours}h SLA.`
    );
  }

  if (input.expeditedSeniorCount > 10) {
    alerts.push(
      `High backlog: ${input.expeditedSeniorCount} high-value exceptions pending senior review.`
    );
  }

  return { healthStatus, alerts };
}

/**
 * Computes live operational health and SLA adherence for operator review queues (Gieni OS Section 11 P2-2).
 */
export function computeQueueHealth(params: QueueHealthComputationParams): ReviewQueueHealth {
  const { countyId, organizationId, activeExceptions, recentlyResolvedExceptions = [] } = params;
  const slaThresholdHours = params.slaThresholdHours ?? 24;
  const now = Date.now();

  const pendingExceptions = activeExceptions.filter(
    (e) => e.status === 'PENDING_REVIEW' || e.status === 'IN_RESEARCH'
  );

  const metrics = computePendingMetrics(pendingExceptions, now, slaThresholdHours);
  const averageResolutionMinutes = computeAverageResolutionMinutes(recentlyResolvedExceptions);
  const { healthStatus, alerts } = evaluateQueueHealthStatus({
    breachedSlaCount: metrics.breachedSlaCount,
    oldestPendingHours: metrics.oldestPendingHours,
    slaThresholdHours,
    expeditedSeniorCount: metrics.expeditedSeniorCount,
  });

  return {
    countyId,
    organizationId,
    totalPendingExceptions: pendingExceptions.length,
    expeditedSeniorCount: metrics.expeditedSeniorCount,
    standardCount: metrics.standardCount,
    oldestPendingHours: metrics.oldestPendingHours,
    averageResolutionMinutes,
    breachedSlaCount: metrics.breachedSlaCount,
    healthStatus,
    alerts,
    evaluatedAt: new Date(now).toISOString(),
  };
}
