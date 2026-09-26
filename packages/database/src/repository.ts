import { BaseEntity, TenantScope } from './types.js';

export interface RepositoryFindOptions {
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * TenantScopedRepository interface
 *
 * CRITICAL TENANCY INVARIANT:
 * Every read, write, query, and delete operation MUST accept a validated TenantScope.
 * Unscoped database queries are strictly prohibited across Gieni OS.
 */
export interface ITenantScopedRepository<T extends BaseEntity> {
  findById(scope: TenantScope, id: string): Promise<T | null>;
  findMany(
    scope: TenantScope,
    filter?: Partial<Omit<T, keyof BaseEntity>>,
    options?: RepositoryFindOptions
  ): Promise<T[]>;
  create(scope: TenantScope, entity: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<T>;
  update(scope: TenantScope, id: string, patch: Partial<Omit<T, 'id' | 'organizationId'>>): Promise<T | null>;
  delete(scope: TenantScope, id: string): Promise<boolean>;
}

/**
 * In-memory reference implementation of TenantScopedRepository for unit testing and local verification.
 */
export class InMemoryTenantScopedRepository<T extends BaseEntity>
  implements ITenantScopedRepository<T>
{
  protected storage = new Map<string, T>();

  async findById(scope: TenantScope, id: string): Promise<T | null> {
    this.assertValidScope(scope);
    const item = this.storage.get(id);
    if (!item) return null;
    if (!this.matchesScope(scope, item)) return null;
    return item;
  }

  async findMany(
    scope: TenantScope,
    filter?: Partial<Omit<T, keyof BaseEntity>>,
    options?: RepositoryFindOptions
  ): Promise<T[]> {
    this.assertValidScope(scope);
    let items = Array.from(this.storage.values()).filter((item) =>
      this.matchesScope(scope, item)
    );

    if (filter) {
      items = items.filter((item) => {
        for (const [key, val] of Object.entries(filter)) {
          if ((item as Record<string, unknown>)[key] !== val) {
            return false;
          }
        }
        return true;
      });
    }

    if (options?.skip) {
      items = items.slice(options.skip);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  async create(
    scope: TenantScope,
    entity: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
  ): Promise<T> {
    this.assertValidScope(scope);
    const id = (entity as { id?: string }).id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const created = {
      ...entity,
      id,
      organizationId: scope.organizationId,
      clientId: scope.clientId ?? null,
      countyId: scope.countyId ?? (entity as unknown as BaseEntity).countyId,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    } as unknown as T;

    this.storage.set(id, created);
    return created;
  }

  async update(
    scope: TenantScope,
    id: string,
    patch: Partial<Omit<T, 'id' | 'organizationId'>>
  ): Promise<T | null> {
    this.assertValidScope(scope);
    const existing = await this.findById(scope, id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.storage.set(id, updated);
    return updated;
  }

  async delete(scope: TenantScope, id: string): Promise<boolean> {
    this.assertValidScope(scope);
    const existing = await this.findById(scope, id);
    if (!existing) return false;
    return this.storage.delete(id);
  }

  protected assertValidScope(scope: TenantScope): void {
    const orgId = scope?.organizationId?.trim();
    if (!orgId) {
      throw new Error(
        'Security Violation: Database queries must carry a valid non-empty organizationId'
      );
    }
  }

  protected matchesScope(scope: TenantScope, item: T): boolean {
    if (item.organizationId !== scope.organizationId) {
      return false;
    }
    if (scope.clientId && item.clientId !== scope.clientId) {
      return false;
    }
    if (scope.countyId && item.countyId !== scope.countyId) {
      return false;
    }
    return true;
  }
}
