import { PropertyParcel } from '@gieni/property';
import { SourceRecord, SourceRecordType } from '@gieni/evidence';
import { FilingType } from './types.js';

export interface ParcelBuildParams {
  countyId: string;
  apn: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  legalDescription: string;
  assessedLandValue: number;
  assessedImprovementValue: number;
  totalAssessedValue: number;
  taxYear?: number;
  lastSaleDate?: string | null;
  lastSalePrice?: number | null;
  verifiedEvidenceIds?: string[];
  createdAt?: string;
  organizationId?: string;
}

export function buildParcelRecord(params: ParcelBuildParams): PropertyParcel {
  const now = new Date().toISOString();
  return {
    id: `parcel_${params.countyId}_${params.apn}`,
    countyId: params.countyId,
    organizationId: params.organizationId ?? 'org_gieni_internal',
    apn: params.apn,
    address: {
      street: params.street,
      city: params.city,
      state: params.state,
      zipCode: params.zipCode,
      county: params.county,
    },
    legalDescription: params.legalDescription,
    assessedLandValue: params.assessedLandValue,
    assessedImprovementValue: params.assessedImprovementValue,
    totalAssessedValue: params.totalAssessedValue,
    taxYear: params.taxYear ?? 2025,
    lastSaleDate: params.lastSaleDate ?? null,
    lastSalePrice: params.lastSalePrice ?? null,
    verifiedEvidenceIds: params.verifiedEvidenceIds ?? [`sr_${params.countyId}_${params.apn}`],
    createdAt: params.createdAt ?? now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

export interface CaseDocumentBuildParams {
  id: string;
  countyId: string;
  sourceType: SourceRecordType;
  sourceUrl: string;
  artifactSha256: string;
  sourceSystem: string;
  rawPayloadLocation: string;
  adapterVersion: string;
  organizationId?: string;
  filingType?: FilingType;
  caseNumber?: string;
  createdAt?: string;
}

export function buildCaseDocumentRecord(params: CaseDocumentBuildParams): SourceRecord {
  const now = new Date().toISOString();
  return {
    id: params.id,
    organizationId: params.organizationId ?? 'org_gieni_internal',
    countyId: params.countyId,
    sourceType: params.sourceType,
    sourceUrl: params.sourceUrl,
    retrievalTimestamp: now,
    artifactSha256: params.artifactSha256,
    sourceSystem: params.sourceSystem,
    rawPayloadLocation: params.rawPayloadLocation,
    adapterVersion: params.adapterVersion,
    filingType: params.filingType,
    caseNumber: params.caseNumber,
    createdAt: params.createdAt ?? now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

export function parseCountyFilingDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/[\u00a0\u202F\s]+/g, ' ').trim();
  if (!clean) return null;

  const mdyMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdyMatch) {
    const month = mdyMatch[1].padStart(2, '0');
    const day = mdyMatch[2].padStart(2, '0');
    let year = mdyMatch[3];
    if (year.length === 2) {
      year = parseInt(year, 10) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  const isoDate = new Date(clean);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString();
  }
  return null;
}
