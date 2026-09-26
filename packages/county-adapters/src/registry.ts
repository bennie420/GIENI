import { ICountyAdapter } from './types.js';

/**
 * County Adapter Registry (Gieni OS PRD v1.0 CA-002).
 * Maps state, county, and adapter version to concrete adapter instances.
 * Enables configuration-driven county selection across worker jobs and consoles.
 */
export class CountyAdapterRegistry {
  private adapters = new Map<string, ICountyAdapter>();

  public register(adapter: ICountyAdapter): void {
    this.adapters.set(adapter.countyId, adapter);
  }

  public getAdapter(countyId: string): ICountyAdapter | null {
    return this.adapters.get(countyId) ?? null;
  }

  public getAdapterOrThrow(countyId: string): ICountyAdapter {
    const adapter = this.adapters.get(countyId);
    if (!adapter) {
      throw new Error(
        `County Adapter Error: No registered adapter found for county '${countyId}'. Check configuration or adapter registration.`
      );
    }
    return adapter;
  }

  public getAdapterByStateAndCounty(stateCode: string, countyName: string): ICountyAdapter | null {
    const normState = stateCode.trim().toUpperCase();
    const normName = countyName.trim().toLowerCase();

    for (const adapter of this.adapters.values()) {
      if (
        adapter.stateCode.toUpperCase() === normState &&
        adapter.countyName.toLowerCase() === normName
      ) {
        return adapter;
      }
    }
    return null;
  }

  public listSupportedCounties(): Array<{
    countyId: string;
    countyName: string;
    stateCode: string;
    adapterVersion: string;
  }> {
    return Array.from(this.adapters.values()).map((a) => ({
      countyId: a.countyId,
      countyName: a.countyName,
      stateCode: a.stateCode,
      adapterVersion: a.adapterVersion,
    }));
  }
}

export const defaultCountyAdapterRegistry = new CountyAdapterRegistry();
