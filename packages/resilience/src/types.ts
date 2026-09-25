/**
 * Circuit Breaker, Systemic Incident & Parked Work domain models.
 * Enforces county-level fault isolation, failure aggregation, and secure replay protection.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type IncidentSeverity = 'WARNING' | 'CRITICAL' | 'FATAL';

export type IncidentType =
  | 'CIRCUIT_TRIP'
  | 'COUNTY_SCRAPER_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SECURITY_INCIDENT'
  | 'CREDENTIAL_COMPROMISE'
  | 'TENANT_BREACH_ATTEMPT'
  | 'DATA_EXFILTRATION';

export interface CircuitBreaker {
  id: string;
  organizationId: string;
  countyId: string;
  serviceKey: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  failureThreshold: number;
  cooldownPeriodSeconds: number;
  lastFailureTime?: string | null;
  lastTrippedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface SystemicIncident {
  id: string;
  organizationId: string;
  countyId: string;
  serviceKey: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  message: string;
  context: Record<string, unknown>;
  occurredAt: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type ParkedWorkStatus =
  | 'PARKED'
  | 'REPLAYING'
  | 'REPLAYED'
  | 'EXPIRED'
  | 'DISCARDED';

export interface ParkedWork {
  id: string;
  organizationId: string;
  countyId: string;
  circuitBreakerId: string;
  stage: string;
  payload: Record<string, unknown>;
  replayNonce: string;
  replayExpiration: string;
  replaySignature: string;
  status: ParkedWorkStatus;
  parkedAt: string;
  replayedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
