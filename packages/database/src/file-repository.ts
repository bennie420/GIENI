import fs from 'fs';
import path from 'path';
import { BaseEntity, TenantScope } from './types.js';
import {
  ITenantScopedRepository,
  RepositoryFindOptions,
  InMemoryTenantScopedRepository,
} from './repository.js';

function getDataDir(): string {
  if (process.env.GIENI_DATA_DIR) {
    return process.env.GIENI_DATA_DIR;
  }
  let curr = process.cwd();
  for (let i = 0; i < 4; i++) {
    if (fs.existsSync(path.join(curr, 'packages')) && fs.existsSync(path.join(curr, 'apps'))) {
      return path.join(curr, '.data');
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return path.join(process.cwd(), '.data');
}

/**
 * FileTenantScopedRepository
 *
 * Provides file-backed persistence for tenant-scoped collections when
 * running in local environments or when external databases are unreachable.
 * Strictly adheres to tenant isolation invariants.
 */
export class FileTenantScopedRepository<T extends BaseEntity>
  extends InMemoryTenantScopedRepository<T>
  implements ITenantScopedRepository<T>
{
  private filePath: string;
  private collectionName: string;

  constructor(collectionName: string, dataDir?: string) {
    super();
    this.collectionName = collectionName;
    const baseDir = dataDir || getDataDir();
    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch (err) {
        console.warn('[FileTenantScopedRepository] Could not create data directory:', err);
      }
    }
    this.filePath = path.join(baseDir, collectionName + '.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          this.storage.clear();
          for (const item of items) {
            if (item && item.id) {
              this.storage.set(item.id, item);
            }
          }
        }
      } catch (err) {
        console.warn('[FileTenantScopedRepository] Error reading ' + this.filePath + ':', err);
      }
    }
  }

  private saveToDisk(): void {
    try {
      const items = Array.from(this.storage.values());
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[FileTenantScopedRepository] Error writing ' + this.filePath + ':', err);
    }
  }

  override async findById(scope: TenantScope, id: string): Promise<T | null> {
    this.loadFromDisk();
    return super.findById(scope, id);
  }

  override async findMany(
    scope: TenantScope,
    filter?: Partial<Omit<T, keyof BaseEntity>>,
    options?: RepositoryFindOptions
  ): Promise<T[]> {
    this.loadFromDisk();
    return super.findMany(scope, filter, options);
  }

  override async create(
    scope: TenantScope,
    entity: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
  ): Promise<T> {
    this.loadFromDisk();
    const result = await super.create(scope, entity);
    this.saveToDisk();
    return result;
  }

  override async update(
    scope: TenantScope,
    id: string,
    patch: Partial<Omit<T, 'id' | 'organizationId'>>
  ): Promise<T | null> {
    this.loadFromDisk();
    const result = await super.update(scope, id, patch);
    this.saveToDisk();
    return result;
  }

  override async delete(scope: TenantScope, id: string): Promise<boolean> {
    this.loadFromDisk();
    const result = await super.delete(scope, id);
    this.saveToDisk();
    return result;
  }
}

const fileRepoCache = new Map<string, FileTenantScopedRepository<any>>();

export function getFileTenantScopedRepository<T extends BaseEntity>(
  collectionName: string
): FileTenantScopedRepository<T> {
  let repo = fileRepoCache.get(collectionName);
  if (!repo) {
    repo = new FileTenantScopedRepository<T>(collectionName);
    fileRepoCache.set(collectionName, repo);
  }
  return repo;
}
