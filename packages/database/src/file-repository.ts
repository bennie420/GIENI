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

export interface FileRepositoryConfig {
  collectionName: string;
  dataDir?: string;
  stateCode?: string;
  countyId?: string;
}

export function buildHierarchicalDocumentPath(params: {
  stateCode: string;
  countyId: string;
  caseNumber: string;
  filingType: string;
  fileHash: string;
}): string {
  const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(
    sanitize(params.stateCode),
    sanitize(params.countyId),
    sanitize(params.caseNumber),
    sanitize(params.filingType),
    `${params.fileHash}.pdf`
  );
}

function ensureDirectoryExists(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    return;
  }
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (err) {
    console.warn('[FileTenantScopedRepository] Could not create data directory:', err);
  }
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

  constructor(configOrName: string | FileRepositoryConfig, dataDir?: string) {
    super();
    const config: FileRepositoryConfig =
      typeof configOrName === 'string'
        ? { collectionName: configOrName, dataDir }
        : configOrName;

    this.collectionName = config.collectionName;
    const baseDir = config.dataDir || getDataDir();
    ensureDirectoryExists(baseDir);
    this.filePath = path.join(baseDir, this.collectionName + '.json');
    this.loadFromDisk();
  }

  private parseFileItems(rawText: string): T[] {
    try {
      const parsed = JSON.parse(rawText);
      return Array.isArray(parsed) ? parsed.filter((it): it is T => Boolean(it?.id)) : [];
    } catch {
      return [];
    }
  }

  private loadFromDisk(): void {
    if (!fs.existsSync(this.filePath)) return;

    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const items = this.parseFileItems(raw);
      if (items.length === 0 && raw.trim().length > 0) return;

      this.storage.clear();
      for (const item of items) {
        this.storage.set(item.id, item);
      }
    } catch (err) {
      console.warn(`[FileTenantScopedRepository] Error reading ${this.filePath}:`, err);
    }
  }

  private saveToDisk(): void {
    try {
      const items = Array.from(this.storage.values());
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`[FileTenantScopedRepository] Error writing ${this.filePath}:`, err);
    }
  }

  private executeReadOperation<R>(operation: () => Promise<R>): Promise<R> {
    this.loadFromDisk();
    return operation();
  }

  private async executeWriteOperation<R>(operation: () => Promise<R>): Promise<R> {
    this.loadFromDisk();
    const result = await operation();
    this.saveToDisk();
    return result;
  }

  override async findById(scope: TenantScope, id: string): Promise<T | null> {
    return this.executeReadOperation(() => super.findById(scope, id));
  }

  override async findMany(
    scope: TenantScope,
    filter?: Partial<Omit<T, keyof BaseEntity>>,
    options?: RepositoryFindOptions
  ): Promise<T[]> {
    return this.executeReadOperation(() => super.findMany(scope, filter, options));
  }

  override async create(
    scope: TenantScope,
    entity: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
  ): Promise<T> {
    return this.executeWriteOperation(() => super.create(scope, entity));
  }

  override async update(
    scope: TenantScope,
    id: string,
    patch: Partial<Omit<T, 'id' | 'organizationId'>>
  ): Promise<T | null> {
    return this.executeWriteOperation(() => super.update(scope, id, patch));
  }

  override async delete(scope: TenantScope, id: string): Promise<boolean> {
    return this.executeWriteOperation(() => super.delete(scope, id));
  }
}


const fileRepoCache = new Map<string, FileTenantScopedRepository<any>>();

export function getFileTenantScopedRepository<T extends BaseEntity>(
  configOrName: string | FileRepositoryConfig
): FileTenantScopedRepository<T> {
  const collectionName =
    typeof configOrName === 'string' ? configOrName : configOrName.collectionName;
  let repo = fileRepoCache.get(collectionName);
  if (!repo) {
    repo = new FileTenantScopedRepository<T>(configOrName);
    fileRepoCache.set(collectionName, repo);
  }
  return repo;
}
