import { z } from 'zod';

export const OrganizationLicenseStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'REVOKED']);
export type OrganizationLicenseStatus = z.infer<typeof OrganizationLicenseStatusSchema>;

export const LicensedOrganizationRecordSchema = z.object({
  organizationId: z.string().min(1),
  status: OrganizationLicenseStatusSchema,
  licensedCountyIds: z.array(z.string().min(1)),
  expiresAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});
export type LicensedOrganizationRecord = z.infer<typeof LicensedOrganizationRecordSchema>;

export const LicensedCountyRecordSchema = z.object({
  countyId: z.string().min(1),
  countyName: z.string().min(1),
  stateCode: z.string().length(2),
  active: z.boolean(),
});
export type LicensedCountyRecord = z.infer<typeof LicensedCountyRecordSchema>;

/**
 * Dynamic licensing repository interface (Gieni OS Section 12 SH-001).
 * Eliminates hardcoded county identifiers from session lifecycles.
 */
export interface ILicenseRepository {
  getOrganizationLicense(organizationId: string): Promise<LicensedOrganizationRecord | null>;
  setOrganizationLicense(record: LicensedOrganizationRecord): Promise<void>;
  listCounties(): Promise<LicensedCountyRecord[]>;
}

/**
 * In-memory & distributed store for dynamic tenant county licensing.
 */
export class InMemoryLicenseRepository implements ILicenseRepository {
  private orgStore = new Map<string, LicensedOrganizationRecord>();
  private countyStore = new Map<string, LicensedCountyRecord>();

  constructor() {
    // Seed default verified county records
    this.countyStore.set('county_travis_tx', {
      countyId: 'county_travis_tx',
      countyName: 'Travis County',
      stateCode: 'TX',
      active: true,
    });
    this.countyStore.set('county_williamson_tx', {
      countyId: 'county_williamson_tx',
      countyName: 'Williamson County',
      stateCode: 'TX',
      active: true,
    });
    this.countyStore.set('county_harris_tx', {
      countyId: 'county_harris_tx',
      countyName: 'Harris County',
      stateCode: 'TX',
      active: true,
    });

    // Seed default active platform org
    this.orgStore.set('org_gieni_internal', {
      organizationId: 'org_gieni_internal',
      status: 'ACTIVE',
      licensedCountyIds: ['county_travis_tx', 'county_williamson_tx', 'county_harris_tx'],
      updatedAt: new Date().toISOString(),
    });

    this.orgStore.set('client_austin_capital_partners', {
      organizationId: 'client_austin_capital_partners',
      status: 'ACTIVE',
      licensedCountyIds: ['county_travis_tx'],
      updatedAt: new Date().toISOString(),
    });
  }

  public async getOrganizationLicense(organizationId: string): Promise<LicensedOrganizationRecord | null> {
    const record = this.orgStore.get(organizationId);
    return record ? { ...record } : null;
  }

  public async setOrganizationLicense(record: LicensedOrganizationRecord): Promise<void> {
    this.orgStore.set(record.organizationId, { ...record });
  }

  public async listCounties(): Promise<LicensedCountyRecord[]> {
    return Array.from(this.countyStore.values());
  }
}

// Global singleton instance for runtime resolution
export const defaultLicenseRepo = new InMemoryLicenseRepository();

/**
 * LicenseService validates tenant county access dynamically against authoritative database/registry records.
 */
export class LicenseService {
  constructor(private readonly repo: ILicenseRepository = defaultLicenseRepo) {}

  public async getLicensedCountiesForOrg(organizationId: string): Promise<string[]> {
    const record = await this.repo.getOrganizationLicense(organizationId);
    if (!record) {
      return [];
    }
    if (record.status !== 'ACTIVE') {
      throw new Error(`Security Violation: License for organization '${organizationId}' is ${record.status}`);
    }
    return record.licensedCountyIds;
  }

  public async assertCountyAccess(params: {
    organizationId: string;
    countyId: string;
    role: string;
  }): Promise<void> {
    const { organizationId, countyId, role } = params;

    if (role === 'org:operator_admin') {
      return; // Platform operators have global access
    }

    const licensed = await this.getLicensedCountiesForOrg(organizationId);
    if (!licensed.includes(countyId)) {
      throw new Error(
        `Security Violation: Organization '${organizationId}' lacks dynamic license for county '${countyId}'`
      );
    }
  }

  public async revokeLicense(organizationId: string): Promise<void> {
    const record = await this.repo.getOrganizationLicense(organizationId);
    if (record) {
      record.status = 'REVOKED';
      record.updatedAt = new Date().toISOString();
      await this.repo.setOrganizationLicense(record);
    }
  }

  public async grantCounty(organizationId: string, countyId: string): Promise<void> {
    let record = await this.repo.getOrganizationLicense(organizationId);
    if (!record) {
      record = {
        organizationId,
        status: 'ACTIVE',
        licensedCountyIds: [countyId],
        updatedAt: new Date().toISOString(),
      };
    } else if (!record.licensedCountyIds.includes(countyId)) {
      record.licensedCountyIds.push(countyId);
      record.updatedAt = new Date().toISOString();
    }
    await this.repo.setOrganizationLicense(record);
  }
}

export const defaultLicenseService = new LicenseService(defaultLicenseRepo);
