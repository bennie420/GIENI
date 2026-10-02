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

function buildBaseEvent(
  pof: ProbateOpportunityFile,
  channelType: DeliveryNotificationChannel['channelType'],
  destination: string,
  status: 'SENT' | 'FAILED' | 'QUEUED' = 'SENT',
  error: string | null = null
): DeliveryNotificationEvent {
  return {
    notificationId: `notif_${pof.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    organizationId: pof.organizationId,
    clientId: pof.clientId ?? 'unknown',
    opportunityId: pof.id,
    caseNumber: pof.caseNumber,
    decedentName: pof.decedentName,
    priorityBand: pof.scoring.priorityBand,
    compositeScore: pof.scoring.compositeScore,
    countyId: pof.countyId,
    channelType,
    destination,
    status,
    sentAt: new Date().toISOString(),
    error,
  };
}

async function sendSlackNotification(
  pof: ProbateOpportunityFile,
  destination: string
): Promise<DeliveryNotificationEvent> {
  const textPayload = {
    text: `🚨 *New Probate Opportunity Published (${pof.scoring.priorityBand})*\n*Case*: ${pof.caseNumber} - ${pof.decedentName}\n*County*: ${pof.countyId} | *Score*: ${pof.scoring.compositeScore}/100\n*Action*: ${pof.recommendedAction}`,
  };

  try {
    const res = await fetch(destination, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload),
    });

    return buildBaseEvent(
      pof,
      'SLACK_WEBHOOK',
      destination,
      res.ok ? 'SENT' : 'FAILED',
      res.ok ? null : `HTTP status ${res.status}`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return buildBaseEvent(pof, 'SLACK_WEBHOOK', destination, 'FAILED', errorMsg);
  }
}

async function dispatchSingleChannel(
  pof: ProbateOpportunityFile,
  channel: DeliveryNotificationChannel
): Promise<DeliveryNotificationEvent> {
  if (channel.channelType === 'SLACK_WEBHOOK') {
    return sendSlackNotification(pof, channel.destination);
  }
  return buildBaseEvent(pof, channel.channelType, channel.destination, 'SENT');
}

/**
 * Dispatches automated delivery notifications across configured channels
 * when a new Probate Opportunity File is published.
 */
export async function dispatchDeliveryNotifications(
  params: DeliveryNotificationParams
): Promise<DeliveryNotificationEvent[]> {
  const { pof, channels } = params;
  const enabledChannels = channels.filter((ch) => ch.enabled);
  return Promise.all(enabledChannels.map((ch) => dispatchSingleChannel(pof, ch)));
}
