import { defaultCountyAdapterRegistry } from './registry.js';
import { TravisCountyAdapter } from './adapters/texas/travis.js';
import { MaricopaCountyAdapter } from './adapters/arizona/maricopa.js';
import { PierceCountyAdapter } from './adapters/washington/pierce.js';
import { KingCountyAdapter } from './adapters/washington/king.js';
import { ThurstonCountyAdapter } from './adapters/washington/thurston.js';

// Auto-register production adapters across TX, AZ, and WA
defaultCountyAdapterRegistry.register(new TravisCountyAdapter());
defaultCountyAdapterRegistry.register(new MaricopaCountyAdapter());
defaultCountyAdapterRegistry.register(new PierceCountyAdapter());
defaultCountyAdapterRegistry.register(new KingCountyAdapter());
defaultCountyAdapterRegistry.register(new ThurstonCountyAdapter());

export * from './types.js';
export * from './schemas.js';
export * from './registry.js';
export * from './drift.js';
export * from './pipeline.js';
export * from './adapters/texas/travis.js';
export * from './adapters/arizona/maricopa.js';
export * from './adapters/washington/pierce.js';
export * from './adapters/washington/king.js';
export * from './adapters/washington/thurston.js';