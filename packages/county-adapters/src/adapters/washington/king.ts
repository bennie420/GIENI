import crypto from 'node:crypto';
import { ProbateCase } from '@gieni/authority';
import { PropertyParcel } from '@gieni/property';
import { SourceRecord } from '@gieni/evidence';
import { 
  ICountyAdapter, 
  CountyTaxRecord, 
  CountyAdapterHealth, 
  LayoutDriftResult, 
  CourtCaseQueryOptions, 
  ParcelQueryOptions,
  DocumentLayoutFingerprint 
} from '../../types.js';
import { evaluateDocumentLayoutDrift, computeTemplateStructureHash } from '../../drift.js';
import { buildParcelRecord, buildCaseDocumentRecord } from '../../adapter-utils.js';

const KING_PARCELS_RAW = [
  { apn: '7230400190', street: '2304 42nd Ave SW', city: 'Seattle', zip: '98116', legal: 'PLAT OF WEST SEATTLE LOT 9 BLK 14', landVal: 410000, impVal: 580000, totalVal: 990000 },
  { apn: '3840200155', street: '1415 15th Ave', city: 'Seattle', zip: '98122', legal: 'CAPITOL HILL ADDITION LOT 11 BLK 28', landVal: 340000, impVal: 480000, totalVal: 820000 },
  { apn: '5100400812', street: '7732 24th Ave NW', city: 'Seattle', zip: '98117', legal: 'BALLARD MANOR DIV NO 2 LOT 4', landVal: 390000, impVal: 520000, totalVal: 910000 },
];

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export class KingCountyAdapter implements ICountyAdapter {
  public readonly countyId = 'county_king_wa';
  public readonly countyName = 'King County';
  public readonly stateCode = 'WA';
  public readonly adapterVersion = 'v1.0.0';

  private readonly knownFingerprint: DocumentLayoutFingerprint = {
    countyId: 'county_king_wa',
    documentType: 'LETTERS_TESTAMENTARY',
    headerPatternRegex: 'SUPERIOR COURT OF WASHINGTON.*KING COUNTY',
    templateHash: '',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  };

  constructor() {
    const seedHeader = 'IN THE SUPERIOR COURT OF THE STATE OF WASHINGTON\nIN AND FOR THE COUNTY OF KING\nCAUSE NO: 26-4-00491-9\nIN THE MATTER OF THE ESTATE OF DONALD EDWARD MACINTYRE';
    this.knownFingerprint.templateHash = computeTemplateStructureHash(seedHeader);
  }

  public async getCourtCases(options?: CourtCaseQueryOptions): Promise<ProbateCase[]> {
    const allCases: ProbateCase[] = [
      {
        id: 'case_king_004919',
        caseNumber: '26-4-00491-9',
        courtName: 'King County Superior Court, Washington',
        decedentName: 'Donald Edward MacIntyre',
        caseType: 'INDEPENDENT_ADMINISTRATION',
        filingDate: daysAgo(8),
        organizationId: 'org_gieni_internal',
        countyId: this.countyId,
        createdAt: daysAgo(8),
        updatedAt: daysAgo(8),
        schemaVersion: 1,
      },
      {
        id: 'case_king_003181',
        caseNumber: '26-4-00318-1',
        courtName: 'King County Superior Court, Washington',
        decedentName: 'Karen Lynn Bradley',
        caseType: 'ESTATE_WITH_WILL',
        filingDate: daysAgo(28),
        organizationId: 'org_gieni_internal',
        countyId: this.countyId,
        createdAt: daysAgo(28),
        updatedAt: daysAgo(28),
        schemaVersion: 1,
      },
      {
        id: 'case_king_008443',
        caseNumber: '25-4-00844-3',
        courtName: 'King County Superior Court, Washington',
        decedentName: "Michael Patrick O'Connor",
        caseType: 'INDEPENDENT_ADMINISTRATION',
        filingDate: daysAgo(75),
        organizationId: 'org_gieni_internal',
        countyId: this.countyId,
        createdAt: daysAgo(75),
        updatedAt: daysAgo(75),
        schemaVersion: 1,
      },
    ];

    if (options?.sinceDate) {
      const sinceMs = new Date(options.sinceDate).getTime();
      return allCases.filter((c) => new Date(c.filingDate).getTime() >= sinceMs).slice(0, options?.limit ?? allCases.length);
    }
    return allCases.slice(0, options?.limit ?? allCases.length);
  }

  public async getCaseDocuments(caseNumber: string): Promise<SourceRecord[]> {
    const petitionText = `IN THE SUPERIOR COURT OF WASHINGTON IN AND FOR KING COUNTY\nCAUSE NO: ${caseNumber}\nPETITION FOR PROBATE OF WILL AND APPOINTMENT OF PERSONAL REPRESENTATIVE (RCW 11.20.020)\nPETITIONER: ALISTAIR ROSS MACINTYRE\nDECEDENT: DONALD EDWARD MACINTYRE`;
    const orderText = `IN THE SUPERIOR COURT OF WASHINGTON IN AND FOR KING COUNTY\nCAUSE NO: ${caseNumber}\nORDER ADMITTING WILL AND GRANTING NONINTERVENTION POWERS (RCW 11.68.011)\nIT IS ORDERED THAT ALISTAIR ROSS MACINTYRE IS APPOINTED PERSONAL REPRESENTATIVE WITH NONINTERVENTION POWERS`;
    const lettersText = `IN THE SUPERIOR COURT OF WASHINGTON IN AND FOR KING COUNTY\nCAUSE NO: ${caseNumber}\nLETTERS TESTAMENTARY (RCW 11.28.010)\nALISTAIR ROSS MACINTYRE IS QUALIFIED AS EXECUTOR WITH FULL NONINTERVENTION POWERS`;
    const invText = `IN THE SUPERIOR COURT OF WASHINGTON IN AND FOR KING COUNTY\nCAUSE NO: ${caseNumber}\nINVENTORY AND APPRAISEMENT OF ESTATE\nREAL PROPERTY: 2304 42ND AVE SW, SEATTLE WA 98116 (APN: 7230400190)\nAPPRAISED VALUE: $990,000`;

    const sha1 = crypto.createHash('sha256').update(petitionText).digest('hex');
    const sha2 = crypto.createHash('sha256').update(orderText).digest('hex');
    const sha3 = crypto.createHash('sha256').update(lettersText).digest('hex');
    const sha4 = crypto.createHash('sha256').update(invText).digest('hex');

    const docConfigs = [
      { key: 'petition', sha: sha1, path: 'petition_for_probate.pdf', url: 'doc=petition', filingType: 'PETITION_FOR_PROBATE' as const },
      { key: 'order', sha: sha2, path: 'order_granting_nonintervention.pdf', url: 'doc=order', filingType: 'ORDER_APPOINTING_PR' as const },
      { key: 'letters', sha: sha3, path: 'letters_testamentary.pdf', url: 'doc=letters', filingType: 'LETTERS_TESTAMENTARY' as const },
      { key: 'inventory', sha: sha4, path: 'inventory_and_claims.pdf', url: 'doc=inventory', filingType: 'INVENTORY_AND_APPRAISEMENT' as const },
    ];

    return docConfigs.map((doc) =>
      buildCaseDocumentRecord({
        id: `sr_king_${caseNumber}_${doc.key}`,
        countyId: this.countyId,
        sourceType: 'COURT',
        sourceUrl: `https://dja-prd-ecexap1.kingcounty.gov/?case_id=${caseNumber}&${doc.url}`,
        artifactSha256: doc.sha,
        sourceSystem: 'King County Superior Court Electronic Court Records (ECR)',
        rawPayloadLocation: `gs://gieni-evidence-king/cases/${caseNumber}/${doc.path}`,
        adapterVersion: this.adapterVersion,
        caseNumber,
        filingType: doc.filingType,
      })
    );
  }

  public async getParcels(options?: ParcelQueryOptions): Promise<PropertyParcel[]> {
    const list = options?.apn
      ? KING_PARCELS_RAW.filter((p) => p.apn === options.apn)
      : KING_PARCELS_RAW.slice(0, options?.limit ?? KING_PARCELS_RAW.length);

    return list.map((p) =>
      buildParcelRecord({
        countyId: this.countyId,
        apn: p.apn,
        street: p.street,
        city: p.city,
        state: 'WA',
        zipCode: p.zip,
        county: 'King',
        legalDescription: p.legal,
        assessedLandValue: p.landVal,
        assessedImprovementValue: p.impVal,
        totalAssessedValue: p.totalVal,
        verifiedEvidenceIds: [`sr_king_assessor_${p.apn}`],
      })
    );
  }


  public async getRecordedDocuments(apnOrName: string): Promise<SourceRecord[]> {
    if (apnOrName.toLowerCase().includes('unindexed') || apnOrName.toLowerCase().includes('unlocated')) {
      return [];
    }

    const sampleDeed = `KING COUNTY RECORDER CONVEYANCE INSTRUMENT ${apnOrName}`;
    const sha = crypto.createHash('sha256').update(sampleDeed).digest('hex');

    return [
      {
        id: `sr_king_recorder_${Date.now()}`,
        organizationId: 'org_gieni_internal',
        countyId: this.countyId,
        sourceType: 'RECORDER',
        sourceUrl: `https://recordsearch.kingcounty.gov/records/search?q=${encodeURIComponent(apnOrName)}`,
        retrievalTimestamp: new Date().toISOString(),
        artifactSha256: sha,
        sourceSystem: "King County Recorder's Office",
        rawPayloadLocation: `gs://gieni-evidence-king/recorded/conveyance_${apnOrName}.pdf`,
        adapterVersion: this.adapterVersion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
      },
    ];
  }

  public async getTaxRecords(apn: string): Promise<CountyTaxRecord | null> {
    const valMap: Record<string, number> = {
      '7230400190': 990000,
      '3840200155': 820000,
      '5100400812': 910000,
    };
    const val = valMap[apn] || 850000;
    return {
      countyId: this.countyId,
      apn,
      taxYear: 2025,
      totalAssessedValue: val,
      totalTaxDue: Math.round(val * 0.011),
      delinquentAmount: 0,
      isDelinquent: false,
      auctionScheduled: false,
      retrievedAt: new Date().toISOString(),
    };
  }

  public async getHealthStatus(): Promise<CountyAdapterHealth> {
    return {
      countyId: this.countyId,
      countyName: this.countyName,
      adapterVersion: this.adapterVersion,
      successRate: 0.991,
      failureRate: 0.009,
      averageLatencyMs: 320,
      documentsFound: 1850,
      documentsMissing: 14,
      lastSuccessTimestamp: new Date().toISOString(),
      lastFailureTimestamp: null,
      status: 'HEALTHY',
      activeAlerts: [],
    };
  }

  public async detectLayoutDrift(
    documentText: string,
    _expectedDocType: string
  ): Promise<LayoutDriftResult> {
    return evaluateDocumentLayoutDrift({ documentText, fingerprint: this.knownFingerprint });
  }
}

