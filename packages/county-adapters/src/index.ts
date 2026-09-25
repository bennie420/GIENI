import { defaultCountyAdapterRegistry } from './registry.js';
import { TravisCountyAdapter } from './adapters/texas/travis.js';
import { MaricopaCountyAdapter } from './adapters/arizona/maricopa.js';

// Auto-register Wave 1 production adapters
defaultCountyAdapterRegistry.register(new TravisCountyAdapter());
defaultCountyAdapterRegistry.register(new MaricopaCountyAdapter());

export * from './types.js';
export * from './schemas.js';
export * from './registry.js';
export * from './drift.js';
export * from './adapters/texas/travis.js';
export * from './adapters/arizona/maricopa.js';
