import { z } from 'zod';

export const RetentionCategorySchema = z.enum([
  'AUDIT_EVENTS',      // 7 Years (Legal Defensibility)
  'QC_REVIEWS',        // 7 Years (Compliance & Certification)
  'OPERATIONAL_LOGS',  // 90 Days (Investigation Debugging)
  'TELEMETRY',         // 30 Days (Performance Metrics)
]);
export type RetentionCategory = z.infer<typeof RetentionCategorySchema>;

export const RetentionPolicySchema = z.object({
  category: RetentionCategorySchema,
  retentionDays: z.number().int().positive(),
  enforceImmutability: z.boolean(),
  description: z.string(),
});
export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>;

/**
 * Standard Production Retention Policies (Gieni OS Section 12 CO-001).
 */
export const DEFAULT_RETENTION_POLICIES: Record<RetentionCategory, RetentionPolicy> = {
  AUDIT_EVENTS: {
    category: 'AUDIT_EVENTS',
    retentionDays: 2555, // 7 years
    enforceImmutability: true,
    description: 'Statutory 7-year evidentiary retention for claim audit events.',
  },
  QC_REVIEWS: {
    category: 'QC_REVIEWS',
    retentionDays: 2555, // 7 years
    enforceImmutability: true,
    description: 'Quality control human certifications and decision history.',
  },
  OPERATIONAL_LOGS: {
    category: 'OPERATIONAL_LOGS',
    retentionDays: 90,
    enforceImmutability: false,
    description: 'System workflow execution and background task traces.',
  },
  TELEMETRY: {
    category: 'TELEMETRY',
    retentionDays: 30,
    enforceImmutability: false,
    description: 'High-frequency queue metrics and circuit breaker telemetry.',
  },
};

export interface RetentionPurgeResult {
  category: RetentionCategory;
  cutoffDate: string;
  eligibleCount: number;
  purgedCount: number;
  dryRun: boolean;
}

/**
 * Evaluates whether a record timestamp has passed its mandatory retention cutoff.
 */
export function isRecordPastRetention(
  timestamp: string | Date,
  policy: RetentionPolicy,
  now: Date = new Date()
): boolean {
  const recordDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const cutoffTime = now.getTime() - policy.retentionDays * 86400000;
  return recordDate.getTime() < cutoffTime;
}

/**
 * Computes the ISO cutoff date string for a given retention policy.
 */
export function getRetentionCutoffDate(policy: RetentionPolicy, now: Date = new Date()): string {
  const cutoff = new Date(now.getTime() - policy.retentionDays * 86400000);
  return cutoff.toISOString();
}

/**
 * Simulates or executes an automated retention schedule purge across records.
 */
export function evaluateRetentionSchedule<T extends { createdAt?: string; timestamp?: string }>(
  records: T[],
  policy: RetentionPolicy,
  options?: { dryRun?: boolean; now?: Date }
): RetentionPurgeResult {
  const now = options?.now ?? new Date();
  const dryRun = options?.dryRun ?? true;
  const cutoffDate = getRetentionCutoffDate(policy, now);

  const eligibleRecords = records.filter((r) => {
    const ts = r.timestamp || r.createdAt;
    if (!ts) return false;
    return isRecordPastRetention(ts, policy, now);
  });

  return {
    category: policy.category,
    cutoffDate,
    eligibleCount: eligibleRecords.length,
    purgedCount: dryRun ? 0 : eligibleRecords.length,
    dryRun,
  };
}
