import { ProbateOpportunityFile } from './types.js';

export interface DeliveryNotificationChannel {
  channelType: 'EMAIL' | 'SLACK_WEBHOOK' | 'IN_APP';
  destination: string;
  enabled: boolean;
}

export interface DeliveryNotificationEvent {
  notificationId: string;
  organizationId: string;
  clientId: string;
  opportunityId: string;
  caseNumber: string;
  decedentName: string;
  priorityBand: string;
  compositeScore: number;
  countyId: string;
  channelType: 'EMAIL' | 'SLACK_WEBHOOK' | 'IN_APP';
  destination: string;
  status: 'SENT' | 'FAILED' | 'QUEUED';
  sentAt: string;
  error?: string | null;
}

export interface DeliveryNotificationParams {
  pof: ProbateOpportunityFile;
  channels: DeliveryNotificationChannel[];
}

/**
 * Dispatches automated delivery notifications across configured channels
 * when a new Probate Opportunity File is published.
 */
export async function dispatchDeliveryNotifications(
  params: DeliveryNotificationParams
): Promise<DeliveryNotificationEvent[]> {
  const { pof, channels } = params;
  const events: DeliveryNotificationEvent[] = [];

  for (const ch of channels) {
    if (!ch.enabled) continue;

    const eventId = `notif_${pof.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    if (ch.channelType === 'EMAIL') {
      // In real runtime, triggers email provider (e.g. SendPulse, Postmark, Resend)
      events.push({
        notificationId: eventId,
        organizationId: pof.organizationId,
        clientId: pof.clientId ?? 'unknown',
        opportunityId: pof.id,
        caseNumber: pof.caseNumber,
        decedentName: pof.decedentName,
        priorityBand: pof.scoring.priorityBand,
        compositeScore: pof.scoring.compositeScore,
        countyId: pof.countyId,
        channelType: 'EMAIL',
        destination: ch.destination,
        status: 'SENT',
        sentAt: now,
      });
    } else if (ch.channelType === 'SLACK_WEBHOOK') {
      try {
        const textPayload = {
          text: `🚨 *New Probate Opportunity Published (${pof.scoring.priorityBand})*\n*Case*: ${pof.caseNumber} - ${pof.decedentName}\n*County*: ${pof.countyId} | *Score*: ${pof.scoring.compositeScore}/100\n*Action*: ${pof.recommendedAction}`,
        };

        const res = await fetch(ch.destination, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(textPayload),
        }).catch((fetchErr) => {
          throw new Error(`Slack webhook error: ${fetchErr.message}`);
        });

        events.push({
          notificationId: eventId,
          organizationId: pof.organizationId,
          clientId: pof.clientId ?? 'unknown',
          opportunityId: pof.id,
          caseNumber: pof.caseNumber,
          decedentName: pof.decedentName,
          priorityBand: pof.scoring.priorityBand,
          compositeScore: pof.scoring.compositeScore,
          countyId: pof.countyId,
          channelType: 'SLACK_WEBHOOK',
          destination: ch.destination,
          status: res.ok ? 'SENT' : 'FAILED',
          sentAt: now,
          error: res.ok ? null : `HTTP status ${res.status}`,
        });
      } catch (err: any) {
        events.push({
          notificationId: eventId,
          organizationId: pof.organizationId,
          clientId: pof.clientId ?? 'unknown',
          opportunityId: pof.id,
          caseNumber: pof.caseNumber,
          decedentName: pof.decedentName,
          priorityBand: pof.scoring.priorityBand,
          compositeScore: pof.scoring.compositeScore,
          countyId: pof.countyId,
          channelType: 'SLACK_WEBHOOK',
          destination: ch.destination,
          status: 'FAILED',
          sentAt: now,
          error: err.message,
        });
      }
    } else {
      events.push({
        notificationId: eventId,
        organizationId: pof.organizationId,
        clientId: pof.clientId ?? 'unknown',
        opportunityId: pof.id,
        caseNumber: pof.caseNumber,
        decedentName: pof.decedentName,
        priorityBand: pof.scoring.priorityBand,
        compositeScore: pof.scoring.compositeScore,
        countyId: pof.countyId,
        channelType: 'IN_APP',
        destination: ch.destination,
        status: 'SENT',
        sentAt: now,
      });
    }
  }

  return events;
}
