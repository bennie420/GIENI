import { z } from 'zod';

export const SensitiveReadEventTypeSchema = z.enum([
  'RECORD_VIEWED',
  'EXPORT_CREATED',
  'DOWNLOAD_GENERATED',
  'SEARCH_EXECUTED',
]);
export type SensitiveReadEventType = z.infer<typeof SensitiveReadEventTypeSchema>;

export const ReadAuditClassificationSchema = z.enum([
  'CONFIDENTIAL',
  'PII',
  'REGULATED',
]);
export type ReadAuditClassification = z.infer<typeof ReadAuditClassificationSchema>;

export const SensitiveReadAuditEventSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().optional(),
  countyId: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  eventType: SensitiveReadEventTypeSchema,
  dataClassification: ReadAuditClassificationSchema,
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  fieldsAccessed: z.array(z.string()).min(1),
  queryFilter: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});
export type SensitiveReadAuditEvent = z.infer<typeof SensitiveReadAuditEventSchema>;

/**
 * Creates a validated SensitiveReadAuditEvent for compliance auditing (Gieni OS Section 12 SH-004).
 */
export function createSensitiveReadAuditEvent(params: {
  organizationId: string;
  clientId?: string;
  countyId: string;
  actorId: string;
  actorRole: string;
  eventType: SensitiveReadEventType;
  dataClassification: ReadAuditClassification;
  resourceType: string;
  resourceId: string;
  fieldsAccessed: string[];
  queryFilter?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): SensitiveReadAuditEvent {
  const event: SensitiveReadAuditEvent = {
    id: `read_audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    organizationId: params.organizationId,
    clientId: params.clientId,
    countyId: params.countyId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    eventType: params.eventType,
    dataClassification: params.dataClassification,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    fieldsAccessed: params.fieldsAccessed,
    queryFilter: params.queryFilter,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    timestamp: new Date().toISOString(),
    schemaVersion: 1,
  };

  return SensitiveReadAuditEventSchema.parse(event);
}
