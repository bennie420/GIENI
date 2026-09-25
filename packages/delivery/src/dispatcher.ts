import crypto from 'node:crypto';
import { DeliveryDispatch, ProbateOpportunityFile } from './types.js';

export interface WebhookDispatchOptions {
  dispatchId: string;
  targetWebhookUrl: string;
  payload: ProbateOpportunityFile;
  timeoutMs?: number;
  headers?: Record<string, string>;
  webhookSecret?: string;
}

/**
 * Transmits an authentic HTTP POST to a client's webhook endpoint.
 *
 * CRITICAL COMPLIANCE ENFORCEMENT:
 * Under NO circumstances does this function return status="SUCCESS" without an authentic,
 * verified HTTP response returning 2xx from the remote server.
 *
 * SECURITY & AUTHENTICITY:
 * Attaches X-Gieni-Timestamp and X-Gieni-Signature (HMAC-SHA256) when webhookSecret is provided.
 */
export async function dispatchRealWebhook(
  options: WebhookDispatchOptions
): Promise<DeliveryDispatch> {
  const dispatchedAt = new Date().toISOString();
  const timeoutMs = options.timeoutMs ?? 15000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payloadJson = JSON.stringify(options.payload);

  const authHeaders: Record<string, string> = {
    'X-Gieni-Timestamp': timestamp,
  };

  if (options.webhookSecret) {
    const signature = crypto
      .createHmac('sha256', options.webhookSecret)
      .update(`${timestamp}.${payloadJson}`)
      .digest('hex');
    authHeaders['X-Gieni-Signature'] = `sha256=${signature}`;
  }

  try {
    const response = await fetch(options.targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Gieni-OS-Delivery/1.0',
        ...authHeaders,
        ...options.headers,
      },
      body: payloadJson,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const httpStatus = response.status;
    const responseBodyText = await response.text().catch(() => null);

    const isSuccess = response.ok; // 200 - 299

    return {
      id: options.dispatchId,
      organizationId: options.payload.organizationId,
      clientId: options.payload.clientId ?? 'unknown',
      opportunityId: options.payload.id,
      targetWebhookUrl: options.targetWebhookUrl,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      httpStatus,
      responseBody: responseBodyText ? responseBodyText.slice(0, 1000) : null,
      errorMessage: isSuccess ? null : `Webhook rejected with HTTP status ${httpStatus}`,
      attemptCount: 1,
      dispatchedAt,
      acknowledgedAt: isSuccess ? new Date().toISOString() : null,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMessage = err instanceof Error ? err.message : String(err);

    return {
      id: options.dispatchId,
      organizationId: options.payload.organizationId,
      clientId: options.payload.clientId ?? 'unknown',
      opportunityId: options.payload.id,
      targetWebhookUrl: options.targetWebhookUrl,
      status: 'FAILED',
      httpStatus: null,
      responseBody: null,
      errorMessage: `Real network transmission failed: ${errorMessage}`,
      attemptCount: 1,
      dispatchedAt,
      acknowledgedAt: null,
    };
  }
}

/**
 * Validates an incoming webhook signature and ensures timestamp is within tolerance window.
 */
export function verifyWebhookSignature(params: {
  payload: string;
  signature: string;
  timestamp: string;
  secret: string;
  toleranceSeconds?: number;
}): boolean {
  const { payload, signature, timestamp, secret, toleranceSeconds = 300 } = params;
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > toleranceSeconds) {
    return false; // Replay attack prevention: timestamp outside tolerance window
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  const providedHex = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  if (expected.length !== providedHex.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(providedHex));
}

