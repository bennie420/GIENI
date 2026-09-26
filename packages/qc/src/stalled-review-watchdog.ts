import { InvestigationException } from './types.js';

export interface StalledReviewAlert {
  exceptionId: string;
  opportunityId: string;
  countyId: string;
  estimatedValue: number | null;
  ageHours: number;
  urgency: 'URGENT_SLA_BREACH' | 'WARNING_STALLED_REVIEW';
  escalationMessage: string;
}

export interface StalledReviewScanParams {
  exceptions: InvestigationException[];
  stalledThresholdHours?: number; // Defaults to 24 hours
  now?: number;
}

/**
 * Scans active investigation exceptions for high-value cases stalled in review.
 * Implements ISSUE-008 / W04: High-Value Case Re-Engagement and SLA Watchdog.
 */
export function scanStalledHighValueReviews(
  params: StalledReviewScanParams
): StalledReviewAlert[] {
  const { exceptions, stalledThresholdHours = 24, now = Date.now() } = params;
  const alerts: StalledReviewAlert[] = [];

  for (const exc of exceptions) {
    if (exc.status !== 'PENDING_REVIEW' && exc.status !== 'IN_RESEARCH') {
      continue;
    }

    const createdTime = new Date(exc.createdAt).getTime();
    const ageHours = (now - createdTime) / (1000 * 60 * 60);

    if (exc.priority === 'EXPEDITE_SENIOR_REVIEW' && ageHours >= stalledThresholdHours) {
      alerts.push({
        exceptionId: exc.id,
        opportunityId: exc.opportunityId,
        countyId: exc.countyId,
        estimatedValue: exc.estimatedValue ?? null,
        ageHours: Math.round(ageHours * 10) / 10,
        urgency: ageHours >= 48 ? 'URGENT_SLA_BREACH' : 'WARNING_STALLED_REVIEW',
        escalationMessage: `High-value opportunity ($${(exc.estimatedValue ?? 0).toLocaleString()}) has been in ${exc.status} for ${Math.round(ageHours)} hours without human resolution.`,
      });
    }
  }

  return alerts.sort((a, b) => b.ageHours - a.ageHours);
}
