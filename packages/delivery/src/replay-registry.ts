import crypto from 'node:crypto';
import { z } from 'zod';

export const ReplayRecordSchema = z.object({
  nonce: z.string().min(1),
  signature: z.string().min(1),
  payloadHash: z.string().min(1),
  firstSeenAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type ReplayRecord = z.infer<typeof ReplayRecordSchema>;

/**
 * Webhook Replay Registry (Gieni OS Section 12 SH-003).
 * Prevents replay attacks, duplicate deliveries, and signature re-use.
 */
export class WebhookReplayRegistry {
  private nonceStore = new Map<string, ReplayRecord>();
  private signatureStore = new Map<string, ReplayRecord>();

  constructor(private readonly defaultTtlSeconds: number = 300) {}

  /**
   * Evaluates and records an incoming/outgoing webhook payload transmission.
   * Rejects duplicate nonces, signature reuse, or expired requests.
   */
  public register(params: {
    nonce: string;
    signature: string;
    payload: string;
    timestamp: string;
    toleranceSeconds?: number;
  }): { allowed: boolean; error?: string } {
    const { nonce, signature, payload, timestamp } = params;
    const tolerance = params.toleranceSeconds ?? this.defaultTtlSeconds;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const parsedTs = parseInt(timestamp, 10);

    // 1. Timestamp freshness check
    if (isNaN(parsedTs) || Math.abs(nowSeconds - parsedTs) > tolerance) {
      return {
        allowed: false,
        error: `Timestamp outside tolerance window (${tolerance}s). Rejecting expired transmission.`,
      };
    }

    // 2. Nonce uniqueness check
    if (this.nonceStore.has(nonce)) {
      return {
        allowed: false,
        error: `Duplicate nonce detected: '${nonce}'. Potential replay attack.`,
      };
    }

    // 3. Signature re-use check
    const normalizedSig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    if (this.signatureStore.has(normalizedSig)) {
      return {
        allowed: false,
        error: `Signature reuse detected. Each payload transmission must carry a distinct cryptographic signature.`,
      };
    }

    // 4. Register in active replay registry
    const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
    const firstSeenAt = new Date().toISOString();
    const expiresAt = new Date((nowSeconds + tolerance) * 1000).toISOString();

    const record: ReplayRecord = {
      nonce,
      signature: normalizedSig,
      payloadHash,
      firstSeenAt,
      expiresAt,
    };

    this.nonceStore.set(nonce, record);
    this.signatureStore.set(normalizedSig, record);

    return { allowed: true };
  }

  /**
   * Cleans up expired replay records past their retention window.
   */
  public purgeExpired(): number {
    const now = new Date().toISOString();
    let purged = 0;

    for (const [nonce, record] of this.nonceStore.entries()) {
      if (record.expiresAt < now) {
        this.nonceStore.delete(nonce);
        this.signatureStore.delete(record.signature);
        purged += 1;
      }
    }

    return purged;
  }

  public getRecordByNonce(nonce: string): ReplayRecord | null {
    return this.nonceStore.get(nonce) ?? null;
  }

  public getRecordBySignature(signature: string): ReplayRecord | null {
    const normalizedSig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    return this.signatureStore.get(normalizedSig) ?? null;
  }
}

export const defaultWebhookReplayRegistry = new WebhookReplayRegistry();
