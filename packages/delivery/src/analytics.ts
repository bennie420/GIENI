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

/**
 * Aggregates client feedback dispositions into conversion performance analytics
 * to guide scoring calibration and county expansion opportunities (ISSUE-009 / W05).
 */
export function analyzeClientFeedbackDispositions(
  feedbackList: ClientFeedback[]
): ClientAnalyticsReport {
  let contacted = 0;
  let invalid = 0;
  let notInterested = 0;
  let appointmentSet = 0;
  let dealClosed = 0;

  const countyMap: Record<string, { total: number; closed: number }> = {};

  for (const item of feedbackList) {
    const cId = item.countyId || 'unknown';
    if (!countyMap[cId]) {
      countyMap[cId] = { total: 0, closed: 0 };
    }
    countyMap[cId].total += 1;

    switch (item.disposition) {
      case 'CONTACTED':
        contacted++;
        break;
      case 'INVALID':
        invalid++;
        break;
      case 'NOT_INTERESTED':
        notInterested++;
        break;
      case 'APPOINTMENT_SET':
        appointmentSet++;
        break;
      case 'DEAL_CLOSED':
        dealClosed++;
        countyMap[cId].closed += 1;
        break;
    }
  }

  const total = feedbackList.length;
  const contactedTotal = contacted + appointmentSet + dealClosed;
  const contactToAppointmentRate = contactedTotal > 0 ? (appointmentSet + dealClosed) / contactedTotal : 0;
  const appointmentToCloseRate = appointmentSet + dealClosed > 0 ? dealClosed / (appointmentSet + dealClosed) : 0;
  const conversionRate = total > 0 ? dealClosed / total : 0;

  const countyBreakdown: Record<string, CountyPerformanceSummary> = {};
  for (const [countyId, stats] of Object.entries(countyMap)) {
    countyBreakdown[countyId] = {
      countyId,
      totalFeedbackCount: stats.total,
      positiveConversions: stats.closed,
      expansionEligible: stats.closed >= 2,
    };
  }

  const scoringCalibrationNotes: string[] = [];
  if (invalid > 0 && invalid / Math.max(1, total) > 0.15) {
    scoringCalibrationNotes.push(
      `⚠️ Elevated invalid rate (${Math.round((invalid / total) * 100)}%): Increase equity and deed verification weight in scoring engine.`
    );
  }
  if (dealClosed >= 3) {
    scoringCalibrationNotes.push(
      `✓ High deal conversion velocity: Consider raising Authority Tier 1 coefficient weight.`
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    totalClientsAnalyzed: new Set(feedbackList.map((f) => f.clientId ?? 'unknown')).size,
    globalMetrics: {
      totalDispositions: total,
      contactedCount: contacted,
      invalidCount: invalid,
      notInterestedCount: notInterested,
      appointmentSetCount: appointmentSet,
      dealClosedCount: dealClosed,
      contactToAppointmentRate: Math.round(contactToAppointmentRate * 100) / 100,
      appointmentToCloseRate: Math.round(appointmentToCloseRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    },
    countyBreakdown,
    scoringCalibrationNotes,
  };
}
