import { MongoClient, ServerApiVersion, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export interface MongoConfig {
  uri?: string;
  dbName?: string;
}

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }
  return uri;
}

export function createMongoClient(uri?: string): MongoClient {
  const connectionUri = uri || getMongoUri();
  return new MongoClient(connectionUri, {
    serverSelectionTimeoutMS: process.env.NODE_ENV === 'development' ? 3000 : 10000,
    connectTimeoutMS: process.env.NODE_ENV === 'development' ? 3000 : 10000,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

export async function getMongoClient(uri?: string): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }
  const client = createMongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function getMongoDb(dbName?: string, uri?: string): Promise<Db> {
  const name = dbName || process.env.MONGODB_DB_NAME || 'gieni';
  if (cachedDb && cachedDb.databaseName === name) {
    return cachedDb;
  }
  const client = await getMongoClient(uri);
  const db = client.db(name);
  cachedDb = db;
  return db;
}

export async function pingMongoDeployment(uri?: string): Promise<boolean> {
  const client = await getMongoClient(uri);
  const res = await client.db('admin').command({ ping: 1 });
  return res.ok === 1;
}

export async function closeMongoClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
