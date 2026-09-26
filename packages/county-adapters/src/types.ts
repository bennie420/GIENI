import { ProbateCase } from '@gieni/authority';
import { PropertyParcel } from '@gieni/property';
import { SourceRecord } from '@gieni/evidence';

export interface CountyTaxRecord {
  countyId: string;
  apn: string;
  taxYear: number;
  totalAssessedValue: number;
  totalTaxDue: number;
  delinquentAmount: number;
  isDelinquent: boolean;
  auctionScheduled: boolean;
  auctionDate?: string;
  retrievedAt: string;
}

export interface CountyAdapterHealth {
  countyId: string;
  countyName: string;
  adapterVersion: string;
  successRate: number; // 0.0 - 1.0
  failureRate: number;
  averageLatencyMs: number;
  documentsFound: number;
  documentsMissing: number;
  lastSuccessTimestamp: string | null;
  lastFailureTimestamp: string | null;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  activeAlerts: string[];
}

export interface DocumentLayoutFingerprint {
  countyId: string;
  documentType: string;
  headerPatternRegex: string;
  templateHash: string;
  expectedFieldCoordinates?: Record<string, { page: number; x: number; y: number }>;
  watermarkPattern?: string;
  version: string;
  createdAt: string;
}

export interface LayoutDriftResult {
  hasDrift: boolean;
  driftConfidence: number; // 0.0 - 1.0
  driftDetails: string[];
  recommendedAction: 'NONE' | 'REVIEW_LAYOUT' | 'QUARANTINE_PARSER';
}

export interface CourtCaseQueryOptions {
  sinceDate?: string;
  caseType?: string;
  limit?: number;
}

export interface ParcelQueryOptions {
  apn?: string;
  ownerName?: string;
  situsAddress?: string;
  limit?: number;
}

/**
 * Standardized County Adapter Interface (Gieni OS PRD v1.0 CA-001).
 * Decouples all downstream services from county-specific ingestion logic.
 */
export interface ICountyAdapter {
  readonly countyId: string;
  readonly countyName: string;
  readonly stateCode: string;
  readonly adapterVersion: string;

  getCourtCases(options?: CourtCaseQueryOptions): Promise<ProbateCase[]>;
  getCaseDocuments(caseNumber: string): Promise<SourceRecord[]>;
  getParcels(options?: ParcelQueryOptions): Promise<PropertyParcel[]>;
  getRecordedDocuments(apnOrName: string): Promise<SourceRecord[]>;
  getTaxRecords(apn: string): Promise<CountyTaxRecord | null>;
  getHealthStatus(): Promise<CountyAdapterHealth>;
  detectLayoutDrift(documentText: string, expectedDocType: string): Promise<LayoutDriftResult>;
}

import { z } from 'zod';
import { CaseTypeSchema, CanonicalCaseTypeSchema, FilingTypeSchema } from './schemas.js';

export type CaseType = z.infer<typeof CaseTypeSchema>;
export type CanonicalCaseType = z.infer<typeof CanonicalCaseTypeSchema>;
export type FilingType = z.infer<typeof FilingTypeSchema>;
