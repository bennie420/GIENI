import { Collection, Db, Filter, Document, FindCursor } from 'mongodb';
import { BaseEntity, TenantScope } from './types.js';
import { ITenantScopedRepository, RepositoryFindOptions, InMemoryTenantScopedRepository } from './repository.js';
import { getFileTenantScopedRepository } from './file-repository.js';

/**
 * MongoDB Atlas Tenant-Scoped Repository.
 *
 * CRITICAL TENANCY INVARIANT:
 * Every MongoDB query strictly enforces { organizationId, countyId?, clientId? }.
 * Unscoped database queries are impossible by interface design.
 */
export class MongoTenantScopedRepository<T extends BaseEntity>
  implements ITenantScopedRepository<T>
{
  private collection: Collection<Document>;
  private collectionName: string;
  private indexesEnsured = false;

  constructor(collection: Collection<Document>, collectionName: string) {
    this.collection = collection;
    this.collectionName = collectionName;
  }

  /**
   * Automatically creates tenant isolation indexes in MongoDB Atlas.
   */
  async ensureIndexes(): Promise<void> {
    if (this.indexesEnsured) return;

    await this.collection.createIndex(
      { organizationId: 1, countyId: 1, id: 1 },
      { unique: true, name: 'idx_tenant_id_unique' }
    );

    await this.collection.createIndex(
      { organizationId: 1, countyId: 1, createdAt: -1 },
      { name: 'idx_tenant_county_created' }
    );

    await this.collection.createIndex(
      { clientId: 1, countyId: 1 },
      { sparse: true, name: 'idx_client_county_sparse' }
    );

    this.indexesEnsured = true;
  }

  async findById(scope: TenantScope, id: string): Promise<T | null> {
    this.assertValidScope(scope);
    await this.ensureIndexes();

    const query: Filter<Document> = {
      $or: [{ id }, { _id: id as any }],
      organizationId: scope.organizationId,
    };

    if (scope.clientId) {
      query.clientId = scope.clientId;
    }
    if (scope.countyId) {
      query.countyId = scope.countyId;
    }

    const doc = await this.collection.findOne(query);
    if (!doc) return null;

    return this.mapDocToEntity(doc);
  }

  private buildQueryFilter(
    scope: TenantScope,
    filter?: Partial<Omit<T, keyof BaseEntity>>
  ): Filter<Document> {
    const query: Filter<Document> = {
      organizationId: scope.organizationId,
      ...(filter || {}),
    };

    if (scope.clientId) {
      query.clientId = scope.clientId;
    }
    if (scope.countyId) {
      query.countyId = scope.countyId;
    }

    return query;
  }

  private applyFindOptions(
    cursor: FindCursor<Document>,
    options?: RepositoryFindOptions
  ): FindCursor<Document> {
    let configuredCursor = cursor;

    if (options?.sortBy) {
      const sortDir = options.sortDirection === 'desc' ? -1 : 1;
      configuredCursor = configuredCursor.sort({ [options.sortBy]: sortDir });
    } else {
      configuredCursor = configuredCursor.sort({ createdAt: -1 });
    }

    if (options?.skip) {
      configuredCursor = configuredCursor.skip(options.skip);
    }
    if (options?.limit) {
      configuredCursor = configuredCursor.limit(options.limit);
    }

    return configuredCursor;
  }

  async findMany(
    scope: TenantScope,
    filter?: Partial<Omit<T, keyof BaseEntity>>,
    options?: RepositoryFindOptions
  ): Promise<T[]> {
    this.assertValidScope(scope);
    await this.ensureIndexes();

    const query = this.buildQueryFilter(scope, filter);
    const cursor = this.applyFindOptions(this.collection.find(query), options);

    const docs = await cursor.toArray();
    return docs.map((doc) => this.mapDocToEntity(doc));
  }

  async create(
    scope: TenantScope,
    entity: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
  ): Promise<T> {
    this.assertValidScope(scope);
    await this.ensureIndexes();

    const id =
      (entity as { id?: string }).id ||
      `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const newRecord: BaseEntity & { _id: string } = {
      _id: id,
      ...entity,
      id,
      organizationId: scope.organizationId,
      clientId: scope.clientId ?? null,
      countyId: scope.countyId ?? (entity as unknown as BaseEntity).countyId,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };

    await this.collection.insertOne(newRecord as unknown as Document);
    return newRecord as unknown as T;
  }

  async update(
    scope: TenantScope,
    id: string,
    patch: Partial<Omit<T, 'id' | 'organizationId'>>
  ): Promise<T | null> {
    this.assertValidScope(scope);
    await this.ensureIndexes();

    const filter: Filter<Document> = {
      id,
      organizationId: scope.organizationId,
    };
    if (scope.countyId) filter.countyId = scope.countyId;
    if (scope.clientId) filter.clientId = scope.clientId;

    const now = new Date().toISOString();
    const result = await this.collection.findOneAndUpdate(
      filter,
      { $set: { ...patch, updatedAt: now } },
      { returnDocument: 'after' }
    );

    if (!result) return null;
    return this.mapDocToEntity(result);
  }

  async delete(scope: TenantScope, id: string): Promise<boolean> {
    this.assertValidScope(scope);
    await this.ensureIndexes();

    const filter: Filter<Document> = {
      id,
      organizationId: scope.organizationId,
    };
    if (scope.countyId) filter.countyId = scope.countyId;
    if (scope.clientId) filter.clientId = scope.clientId;

    const result = await this.collection.deleteOne(filter);
    return result.deletedCount === 1;
  }

  private assertValidScope(scope: TenantScope): void {
    const orgId = scope?.organizationId?.trim();
    if (!orgId) {
      throw new Error(
        'Security Violation: Database queries must carry a valid non-empty organizationId'
      );
    }
  }

  private mapDocToEntity(doc: Document): T {
    const { _id, ...rest } = doc;
    return rest as unknown as T;
  }
}

/**
 * Universal repository factory: returns MongoDB repository if Db is passed,
 * otherwise returns in-memory repository for local isolation testing.
 */
export function getTenantScopedRepository<T extends BaseEntity>(
  collectionName: string,
  db?: Db
): ITenantScopedRepository<T> {
  if (db) {
    return new MongoTenantScopedRepository<T>(db.collection(collectionName), collectionName);
  }
  return getFileTenantScopedRepository<T>(collectionName);
}
