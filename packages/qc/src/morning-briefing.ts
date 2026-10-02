import { ReviewQueueHealth } from './queue-health.js';

export interface CountyBriefingSummary {
  countyId: string;
  countyName: string;
  stateCode: string;
  casesHarvestedLast24h: number;
  unresolvedExceptions: number;
  expeditedSeniorExceptions: number;
  breachedSlas: number;
  queueStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  layoutDrift: boolean;
}

export interface OperatorMorningBriefing {
  briefingId: string;
  generatedAt: string;
  organizationId: string;
  totalActiveCounties: number;
  overallSystemHealth: 'ALL_SYSTEMS_OPERATIONAL' | 'DEGRADED_OPERATIONS' | 'CRITICAL_ACTION_REQUIRED';
  countySummaries: CountyBriefingSummary[];
  totalBreachedSlas: number;
  urgentActionItems: string[];
}

export interface MorningBriefingParams {
  organizationId: string;
  countyHealthReports: {
    countyId: string;
    countyName: string;
    stateCode: string;
    casesHarvestedLast24h: number;
    queueHealth: ReviewQueueHealth;
    layoutDriftDetected: boolean;
  }[];
}

/**
 * Generates an automated operator morning health briefing digest.
 * Implements W07 / ISSUE-007 to eliminate operational blindness across county pipelines.
 */
export function generateOperatorMorningBriefing(
  params: MorningBriefingParams
): OperatorMorningBriefing {
  const { organizationId, countyHealthReports } = params;
  const urgentActionItems: string[] = [];
  let totalBreachedSlas = 0;
  let hasCritical = false;
  let hasDegraded = false;

  const countySummaries: CountyBriefingSummary[] = countyHealthReports.map((c) => {
    totalBreachedSlas += c.queueHealth.breachedSlaCount;

    if (c.queueHealth.healthStatus === 'CRITICAL') {
      hasCritical = true;
      urgentActionItems.push(
        `🚨 ${c.countyName} (${c.stateCode}): Critical backlog with ${c.queueHealth.breachedSlaCount} breached SLAs.`
      );
    } else if (c.queueHealth.healthStatus === 'DEGRADED') {
      hasDegraded = true;
    }

    if (c.layoutDriftDetected) {
      urgentActionItems.push(
        `⚠️ ${c.countyName} (${c.stateCode}): Layout drift detected on municipal portal. Immediate adapter verification required.`
      );
    }

    return {
      countyId: c.countyId,
      countyName: c.countyName,
      stateCode: c.stateCode,
      casesHarvestedLast24h: c.casesHarvestedLast24h,
      unresolvedExceptions: c.queueHealth.totalPendingExceptions,
      expeditedSeniorExceptions: c.queueHealth.expeditedSeniorCount,
      breachedSlas: c.queueHealth.breachedSlaCount,
      queueStatus: c.queueHealth.healthStatus,
      layoutDrift: c.layoutDriftDetected,
    };
  });

  const overallSystemHealth = hasCritical
    ? 'CRITICAL_ACTION_REQUIRED'
    : hasDegraded
    ? 'DEGRADED_OPERATIONS'
    : 'ALL_SYSTEMS_OPERATIONAL';

  return {
    briefingId: `briefing_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    organizationId,
    totalActiveCounties: countyHealthReports.length,
    overallSystemHealth,
    countySummaries,
    totalBreachedSlas,
    urgentActionItems,
  };
}
