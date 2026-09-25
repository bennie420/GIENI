import { IncidentType, IncidentSeverity, SystemicIncident } from './types.js';

export interface IncidentResponsePlaybook {
  incidentType: IncidentType;
  defaultSeverity: IncidentSeverity;
  immediateActions: string[];
  quarantineRequired: boolean;
  notifyRoles: string[];
  slaResolutionMinutes: number;
}

/**
 * Standard Security Incident Response Playbooks (Gieni OS Section 12 CO-003).
 */
export const INCIDENT_RESPONSE_PLAYBOOKS: Record<IncidentType, IncidentResponsePlaybook> = {
  CREDENTIAL_COMPROMISE: {
    incidentType: 'CREDENTIAL_COMPROMISE',
    defaultSeverity: 'FATAL',
    immediateActions: [
      'Revoke compromised credential immediately in KeyRotationRegistry.',
      'Trip dependent external service circuit breakers to OPEN.',
      'Invalidate active Clerk session tokens for compromised scope.',
      'Notify platform security lead and initiate audit log triage.',
    ],
    quarantineRequired: true,
    notifyRoles: ['security_admin', 'platform_lead'],
    slaResolutionMinutes: 15,
  },
  TENANT_BREACH_ATTEMPT: {
    incidentType: 'TENANT_BREACH_ATTEMPT',
    defaultSeverity: 'CRITICAL',
    immediateActions: [
      'Terminate offender session and block client IP.',
      'Quarantine tenant scope to prevent cross-collection leakage.',
      'Record immutable security audit log with full request context.',
      'Trigger high-priority alert to compliance & operator leads.',
    ],
    quarantineRequired: true,
    notifyRoles: ['security_admin', 'operator_admin'],
    slaResolutionMinutes: 30,
  },
  DATA_EXFILTRATION: {
    incidentType: 'DATA_EXFILTRATION',
    defaultSeverity: 'FATAL',
    immediateActions: [
      'Instantly halt Delivery Webhook Dispatcher across all queues.',
      'Lock client portal access for targeted organization.',
      'Generate cryptographic snapshot of claim evidence and read audit logs.',
      'Convene emergency response review with legal counsel.',
    ],
    quarantineRequired: true,
    notifyRoles: ['security_admin', 'legal_counsel', 'platform_lead'],
    slaResolutionMinutes: 15,
  },
  SECURITY_INCIDENT: {
    incidentType: 'SECURITY_INCIDENT',
    defaultSeverity: 'CRITICAL',
    immediateActions: [
      'Isolate affected service or county scraper.',
      'Inspect anomaly signatures and verify cryptographic nonces.',
      'Assess potential PII or confidential record exposure.',
    ],
    quarantineRequired: false,
    notifyRoles: ['security_admin', 'operator_admin'],
    slaResolutionMinutes: 60,
  },
  CIRCUIT_TRIP: {
    incidentType: 'CIRCUIT_TRIP',
    defaultSeverity: 'WARNING',
    immediateActions: [
      'Park active pipeline tasks into ParkedWork collection.',
      'Verify upstream county court or assessor downtime.',
      'Wait for circuit cooldown timer before probing HALF_OPEN.',
    ],
    quarantineRequired: false,
    notifyRoles: ['operator_admin'],
    slaResolutionMinutes: 120,
  },
  COUNTY_SCRAPER_FAILURE: {
    incidentType: 'COUNTY_SCRAPER_FAILURE',
    defaultSeverity: 'WARNING',
    immediateActions: [
      'Isolate failure to individual county; ensure unaffected counties run uninterrupted.',
      'Inspect recent court docket DOM changes or PDF layout shifts.',
    ],
    quarantineRequired: false,
    notifyRoles: ['operator_admin'],
    slaResolutionMinutes: 240,
  },
  RATE_LIMIT_EXCEEDED: {
    incidentType: 'RATE_LIMIT_EXCEEDED',
    defaultSeverity: 'WARNING',
    immediateActions: [
      'Apply exponential backoff to request throttler.',
      'Delay task retry in Cloud Tasks queue adapter.',
    ],
    quarantineRequired: false,
    notifyRoles: ['operator_admin'],
    slaResolutionMinutes: 60,
  },
};

/**
 * Evaluates an incoming incident against its authorized playbook.
 */
export function getPlaybookForIncident(incident: SystemicIncident): IncidentResponsePlaybook {
  return INCIDENT_RESPONSE_PLAYBOOKS[incident.incidentType] ?? {
    incidentType: incident.incidentType,
    defaultSeverity: incident.severity,
    immediateActions: ['Inspect system error log and triage incident.'],
    quarantineRequired: false,
    notifyRoles: ['operator_admin'],
    slaResolutionMinutes: 120,
  };
}
