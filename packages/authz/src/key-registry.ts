import { z } from 'zod';

export const CredentialTypeSchema = z.enum([
  'MONGODB_ATLAS_CREDENTIAL',
  'WEBHOOK_HMAC_SECRET',
  'CLERK_API_SECRET',
  'SENTRY_DSN_SECRET',
  'GCP_SERVICE_ACCOUNT_KEY',
]);
export type CredentialType = z.infer<typeof CredentialTypeSchema>;

export const KeyRotationStatusSchema = z.enum(['ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED']);
export type KeyRotationStatus = z.infer<typeof KeyRotationStatusSchema>;

export const CredentialKeyRecordSchema = z.object({
  keyId: z.string().min(1),
  keyType: CredentialTypeSchema,
  owner: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production']),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  rotatedAt: z.string().datetime().nullable(),
  status: KeyRotationStatusSchema,
  rotationGracePeriodHours: z.number().int().min(0),
  keyFingerprint: z.string().min(8), // SHA-256 prefix of secret (never raw secret)
});
export type CredentialKeyRecord = z.infer<typeof CredentialKeyRecordSchema>;

/**
 * Key Rotation Registry (Gieni OS Section 12 CO-002).
 * Eliminates unmanaged credentials by auditing and enforcing credential lifecycle.
 */
export class KeyRotationRegistry {
  private keys = new Map<string, CredentialKeyRecord>();

  public registerKey(record: Omit<CredentialKeyRecord, 'status' | 'rotatedAt'>): CredentialKeyRecord {
    const fullRecord: CredentialKeyRecord = {
      ...record,
      status: 'ACTIVE',
      rotatedAt: null,
    };
    CredentialKeyRecordSchema.parse(fullRecord);
    this.keys.set(fullRecord.keyId, fullRecord);
    return fullRecord;
  }

  public rotateKey(keyId: string, newRecord: Omit<CredentialKeyRecord, 'status' | 'rotatedAt'>): {
    oldKey: CredentialKeyRecord;
    newKey: CredentialKeyRecord;
  } {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) {
      throw new Error(`Key '${keyId}' not found in KeyRotationRegistry.`);
    }

    const rotatedAt = new Date().toISOString();
    oldKey.status = 'ROTATED';
    oldKey.rotatedAt = rotatedAt;

    const newKey = this.registerKey(newRecord);
    return { oldKey, newKey };
  }

  public revokeKey(keyId: string): void {
    const key = this.keys.get(keyId);
    if (key) {
      key.status = 'REVOKED';
    }
  }

  public assertKeyValid(keyId: string, now: Date = new Date()): void {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Credential '${keyId}' is not registered in KeyRotationRegistry.`);
    }

    if (key.status === 'REVOKED') {
      throw new Error(`Security Violation: Credential '${keyId}' has been REVOKED.`);
    }

    const expiresAt = new Date(key.expiresAt);
    if (now.getTime() > expiresAt.getTime()) {
      key.status = 'EXPIRED';
      throw new Error(`Security Violation: Credential '${keyId}' EXPIRED on ${key.expiresAt}.`);
    }

    if (key.status === 'ROTATED') {
      // Check grace period
      if (key.rotatedAt) {
        const rotatedTime = new Date(key.rotatedAt).getTime();
        const graceMs = key.rotationGracePeriodHours * 3600000;
        if (now.getTime() > rotatedTime + graceMs) {
          throw new Error(
            `Security Violation: Credential '${keyId}' was rotated and has exceeded its ${key.rotationGracePeriodHours}h grace period.`
          );
        }
      }
    }
  }

  public listExpiringKeys(withinDays: number, now: Date = new Date()): CredentialKeyRecord[] {
    const threshold = now.getTime() + withinDays * 86400000;
    const expiring: CredentialKeyRecord[] = [];

    for (const key of this.keys.values()) {
      if (key.status === 'ACTIVE') {
        const expTime = new Date(key.expiresAt).getTime();
        if (expTime <= threshold) {
          expiring.push({ ...key });
        }
      }
    }

    return expiring;
  }

  public getKey(keyId: string): CredentialKeyRecord | null {
    return this.keys.get(keyId) ?? null;
  }
}

export const defaultKeyRotationRegistry = new KeyRotationRegistry();
