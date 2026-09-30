import { ClientDisposition, ClientFeedback } from './types.js';

export interface DispositionMetrics {
  totalDispositions: number;
  contactedCount: number;
  invalidCount: number;
  notInterestedCount: number;
  appointmentSetCount: number;
  dealClosedCount: number;
  contactToAppointmentRate: number;
  appointmentToCloseRate: number;
  conversionRate: number;
}

export interface CountyPerformanceSummary {
  countyId: string;
  totalFeedbackCount: number;
  positiveConversions: number;
  expansionEligible: boolean;
}

export interface ClientAnalyticsReport {
  generatedAt: string;
  totalClientsAnalyzed: number;
  globalMetrics: DispositionMetrics;
  countyBreakdown: Record<string, CountyPerformanceSummary>;
  scoringCalibrationNotes: string[];
}

interface FeedbackTallies {
  contacted: number;
  invalid: number;
  notInterested: number;
  appointmentSet: number;
  dealClosed: number;
  countyMap: Record<string, { total: number; closed: number }>;
}

function tallyFeedbackStats(feedbackList: ClientFeedback[]): FeedbackTallies {
  const tallies: FeedbackTallies = {
    contacted: 0,
    invalid: 0,
    notInterested: 0,
    appointmentSet: 0,
    dealClosed: 0,
    countyMap: {},
  };

  for (const item of feedbackList) {
    const cId = item.countyId || 'unknown';
    const entry = (tallies.countyMap[cId] ??= { total: 0, closed: 0 });
    entry.total += 1;

    if (item.disposition === 'DEAL_CLOSED') {
      tallies.dealClosed += 1;
      entry.closed += 1;
    } else if (item.disposition === 'CONTACTED') {
      tallies.contacted += 1;
    } else if (item.disposition === 'INVALID') {
      tallies.invalid += 1;
    } else if (item.disposition === 'NOT_INTERESTED') {
      tallies.notInterested += 1;
    } else if (item.disposition === 'APPOINTMENT_SET') {
      tallies.appointmentSet += 1;
    }
  }

  return tallies;
}

function buildCountyBreakdown(
  countyMap: Record<string, { total: number; closed: number }>
): Record<string, CountyPerformanceSummary> {
  const breakdown: Record<string, CountyPerformanceSummary> = {};
  for (const [countyId, stats] of Object.entries(countyMap)) {
    breakdown[countyId] = {
      countyId,
      totalFeedbackCount: stats.total,
      positiveConversions: stats.closed,
      expansionEligible: stats.closed >= 2,
    };
  }
  return breakdown;
}

function generateCalibrationNotes(total: number, invalid: number, dealClosed: number): string[] {
  const notes: string[] = [];
  if (invalid > 0 && invalid / Math.max(1, total) > 0.15) {
    notes.push(
      `⚠️ Elevated invalid rate (${Math.round((invalid / total) * 100)}%): Increase equity and deed verification weight in scoring engine.`
    );
  }
  if (dealClosed >= 3) {
    notes.push(
      `✓ High deal conversion velocity: Consider raising Authority Tier 1 coefficient weight.`
    );
  }
  return notes;
}

function computeMetrics(tallies: FeedbackTallies, total: number): DispositionMetrics {
  const { contacted, invalid, notInterested, appointmentSet, dealClosed } = tallies;
  const contactedTotal = contacted + appointmentSet + dealClosed;
  const contactToAppt = contactedTotal > 0 ? (appointmentSet + dealClosed) / contactedTotal : 0;
  const apptToClose = appointmentSet + dealClosed > 0 ? dealClosed / (appointmentSet + dealClosed) : 0;
  const convRate = total > 0 ? dealClosed / total : 0;

  return {
    totalDispositions: total,
    contactedCount: contacted,
    invalidCount: invalid,
    notInterestedCount: notInterested,
    appointmentSetCount: appointmentSet,
    dealClosedCount: dealClosed,
    contactToAppointmentRate: Math.round(contactToAppt * 100) / 100,
    appointmentToCloseRate: Math.round(apptToClose * 100) / 100,
    conversionRate: Math.round(convRate * 100) / 100,
  };
}

/**
 * Aggregates client feedback dispositions into conversion performance analytics
 * to guide scoring calibration and county expansion opportunities (ISSUE-009 / W05).
 */
export function analyzeClientFeedbackDispositions(
  feedbackList: ClientFeedback[]
): ClientAnalyticsReport {
  const tallies = tallyFeedbackStats(feedbackList);
  const total = feedbackList.length;

  return {
    generatedAt: new Date().toISOString(),
    totalClientsAnalyzed: new Set(feedbackList.map((f) => f.clientId ?? 'unknown')).size,
    globalMetrics: computeMetrics(tallies, total),
    countyBreakdown: buildCountyBreakdown(tallies.countyMap),
    scoringCalibrationNotes: generateCalibrationNotes(total, tallies.invalid, tallies.dealClosed),
  };
}
