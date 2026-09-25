import { z } from 'zod';

export const CountyTaxRecordSchema = z.object({
  countyId: z.string().min(1),
  apn: z.string().min(1),
  taxYear: z.number().int().min(1900),
  totalAssessedValue: z.number().min(0),
  totalTaxDue: z.number().min(0),
  delinquentAmount: z.number().min(0),
  isDelinquent: z.boolean(),
  auctionScheduled: z.boolean(),
  auctionDate: z.string().datetime().optional(),
  retrievedAt: z.string().datetime(),
});

export const CountyAdapterHealthSchema = z.object({
  countyId: z.string().min(1),
  countyName: z.string().min(1),
  adapterVersion: z.string().min(1),
  successRate: z.number().min(0).max(1),
  failureRate: z.number().min(0).max(1),
  averageLatencyMs: z.number().min(0),
  documentsFound: z.number().int().min(0),
  documentsMissing: z.number().int().min(0),
  lastSuccessTimestamp: z.string().datetime().nullable(),
  lastFailureTimestamp: z.string().datetime().nullable(),
  status: z.enum(['HEALTHY', 'DEGRADED', 'DOWN']),
  activeAlerts: z.array(z.string()),
});

export const DocumentLayoutFingerprintSchema = z.object({
  countyId: z.string().min(1),
  documentType: z.string().min(1),
  headerPatternRegex: z.string().min(1),
  templateHash: z.string().length(64),
  expectedFieldCoordinates: z.record(z.object({
    page: z.number().int().min(1),
    x: z.number().min(0),
    y: z.number().min(0),
  })).optional(),
  watermarkPattern: z.string().optional(),
  version: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const LayoutDriftResultSchema = z.object({
  hasDrift: z.boolean(),
  driftConfidence: z.number().min(0).max(1),
  driftDetails: z.array(z.string()),
  recommendedAction: z.enum(['NONE', 'REVIEW_LAYOUT', 'QUARANTINE_PARSER']),
});
