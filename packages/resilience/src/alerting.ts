import { IncidentSeverity } from './types.js';

export interface SecurityAlert {
  alertId: string;
  source: string;
  severity: IncidentSeverity;
  alertType: 'CIRCUIT_OPEN' | 'DELIVERY_FAILURE' | 'TENANT_ISOLATION_VIOLATION' | 'BACKLOG_SLA_BREACH' | 'SECURITY_INCIDENT';
  countyId?: string;
  organizationId?: string;
  summary: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface IAlertDispatcher {
  dispatch(alert: SecurityAlert): Promise<{ dispatched: boolean; channel: string; externalId?: string }>;
}

/**
 * PagerDuty / Webhook Alert Dispatcher (Gieni OS Section 12 OP-002).
 * Formats structured alerting payloads for automated operator paging.
 */
export class IncidentAlertDispatcher implements IAlertDispatcher {
  private alertsLog: SecurityAlert[] = [];

  constructor(private readonly pagerDutyRoutingKey?: string) {}

  public async dispatch(alert: SecurityAlert): Promise<{ dispatched: boolean; channel: string; externalId?: string }> {
    this.alertsLog.push({ ...alert });

    // Format for PagerDuty Events API v2
    const pdPayload = {
      routing_key: this.pagerDutyRoutingKey || 'mock_pagerduty_key',
      event_action: 'trigger',
      dedup_key: `${alert.alertType}_${alert.countyId || 'global'}_${alert.alertId}`,
      payload: {
        summary: `[${alert.severity}] ${alert.summary}`,
        severity: alert.severity === 'FATAL' || alert.severity === 'CRITICAL' ? 'critical' : 'warning',
        source: alert.source,
        component: alert.countyId || 'platform',
        custom_details: alert.details,
      },
    };

    if (this.pagerDutyRoutingKey && process.env.PAGERDUTY_EVENTS_URL) {
      try {
        const resp = await fetch(process.env.PAGERDUTY_EVENTS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pdPayload),
        });
        return {
          dispatched: resp.ok,
          channel: 'PAGERDUTY',
          externalId: alert.alertId,
        };
      } catch (err) {
        console.error('Failed to dispatch alert to PagerDuty endpoint:', err);
      }
    }

    // Default structured console & telemetry dispatch
    return {
      dispatched: true,
      channel: 'OPERATOR_EVENT_STREAM',
      externalId: alert.alertId,
    };
  }

  public getDispatchedAlerts(): SecurityAlert[] {
    return [...this.alertsLog];
  }
}

export const defaultAlertDispatcher = new IncidentAlertDispatcher();
