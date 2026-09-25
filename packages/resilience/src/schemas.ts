import { z } from 'zod';

export const CircuitStateSchema = z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']);

export const IncidentSeveritySchema = z.enum(['WARNING', 'CRITICAL', 'FATAL']);

export const IncidentTypeSchema = z.enum([
  'CIRCUIT_TRIP',
  'COUNTY_SCRAPER_FAILURE',
  'RATE_LIMIT_EXCEEDED',
  'SECURITY_INCIDENT',
  'CREDENTIAL_COMPROMISE',
  'TENANT_BREACH_ATTEMPT',
  'DATA_EXFILTRATION',
]);

export const CircuitBreakerSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  serviceKey: z.string().min(1),
  state: CircuitStateSchema,
  failureCount: z.number().int().min(0),
  successCount: z.number().int().min(0),
  failureThreshold: z.number().int().min(1),
  cooldownPeriodSeconds: z.number().int().min(1),
  lastFailureTime: z.string().datetime().nullable().optional(),
  lastTrippedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const SystemicIncidentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  serviceKey: z.string().min(1),
  incidentType: IncidentTypeSchema,
  severity: IncidentSeveritySchema,
  message: z.string().min(1),
  context: z.record(z.unknown()),
  occurredAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});

export const ParkedWorkStatusSchema = z.enum([
  'PARKED',
  'REPLAYING',
  'REPLAYED',
  'EXPIRED',
  'DISCARDED',
]);

export const ParkedWorkSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  countyId: z.string().min(1),
  circuitBreakerId: z.string().min(1),
  stage: z.string().min(1),
  payload: z.record(z.unknown()),
  replayNonce: z.string().min(16),
  replayExpiration: z.string().datetime(),
  replaySignature: z.string().min(64),
  status: ParkedWorkStatusSchema,
  parkedAt: z.string().datetime(),
  replayedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});
