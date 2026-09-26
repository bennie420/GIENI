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

/**
 * Computes live operational health and SLA adherence for operator review queues (Gieni OS Section 11 P2-2).
 */
export function computeQueueHealth(params: {
  countyId: string;
  organizationId: string;
  activeExceptions: InvestigationException[];
  recentlyResolvedExceptions?: InvestigationException[];
  slaThresholdHours?: number; // Defaults to 24 hours
}): ReviewQueueHealth {
  const { countyId, organizationId, activeExceptions, recentlyResolvedExceptions = [] } = params;
  const slaThresholdHours = params.slaThresholdHours ?? 24;
  const now = Date.now();

  const pendingExceptions = activeExceptions.filter(
    (e) => e.status === 'PENDING_REVIEW' || e.status === 'IN_RESEARCH'
  );

  let expeditedSeniorCount = 0;
  let standardCount = 0;
  let oldestPendingHours = 0;
  let breachedSlaCount = 0;
  const alerts: string[] = [];

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

  // Calculate resolution latency from recently resolved exceptions
  let totalResolutionMinutes = 0;
  let resolvedCount = 0;
  for (const exc of recentlyResolvedExceptions) {
    if (exc.resolvedAt && exc.createdAt) {
      const durationMin =
        (new Date(exc.resolvedAt).getTime() - new Date(exc.createdAt).getTime()) / (1000 * 60);
      if (durationMin > 0) {
        totalResolutionMinutes += durationMin;
        resolvedCount += 1;
      }
    }
  }
  const averageResolutionMinutes =
    resolvedCount > 0 ? Math.round(totalResolutionMinutes / resolvedCount) : 0;

  // Determine health status
  let healthStatus: QueueHealthStatus = 'HEALTHY';

  if (breachedSlaCount >= 5 || oldestPendingHours >= 48) {
    healthStatus = 'CRITICAL';
    alerts.push(`CRITICAL: ${breachedSlaCount} exceptions breached SLA; oldest is ${oldestPendingHours}h old.`);
  } else if (breachedSlaCount > 0 || oldestPendingHours >= slaThresholdHours) {
    healthStatus = 'DEGRADED';
    alerts.push(`DEGRADED: ${breachedSlaCount} exception(s) breached ${slaThresholdHours}h SLA.`);
  }

  if (expeditedSeniorCount > 10) {
    alerts.push(`High backlog: ${expeditedSeniorCount} high-value exceptions pending senior review.`);
  }

  return {
    countyId,
    organizationId,
    totalPendingExceptions: pendingExceptions.length,
    expeditedSeniorCount,
    standardCount,
    oldestPendingHours,
    averageResolutionMinutes,
    breachedSlaCount,
    healthStatus,
    alerts,
    evaluatedAt: new Date().toISOString(),
  };
}
