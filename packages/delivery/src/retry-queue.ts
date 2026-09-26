import { DeliveryDispatch, ProbateOpportunityFile } from './types.js';
import { dispatchRealWebhook, WebhookDispatchOptions } from './dispatcher.js';

export interface WebhookRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export const DEFAULT_WEBHOOK_RETRY_POLICY: WebhookRetryPolicy = {
  maxAttempts: 5,
  initialDelayMs: 2000, // 2s
  backoffMultiplier: 3, // 2s, 6s, 18s, 54s...
  maxDelayMs: 60000,    // 60s max per sync step
};

export interface QueuedWebhookItem {
  id: string;
  organizationId: string;
  clientId: string;
  opportunityId: string;
  targetWebhookUrl: string;
  payload: ProbateOpportunityFile;
  webhookSecret?: string;
  attempts: number;
  nextAttemptAt: string;
  lastError?: string | null;
  status: 'PENDING' | 'DISPATCHED' | 'EXHAUSTED_DEAD_LETTER';
  createdAt: string;
  updatedAt: string;
}

/**
 * In-memory resilient webhook retry and dead-letter dispatcher.
 * Integrates directly with Gieni's delivery architecture to guarantee
 * that temporary network disconnects or 5xx receiver errors do not lose deliveries.
 */
export class WebhookRetryQueue {
  private queue = new Map<string, QueuedWebhookItem>();
  private readonly policy: WebhookRetryPolicy;

  constructor(policy: WebhookRetryPolicy = DEFAULT_WEBHOOK_RETRY_POLICY) {
    this.policy = policy;
  }

  /**
   * Enqueues a failed webhook dispatch for exponential backoff retries.
   */
  enqueueFailedDispatch(
    options: WebhookDispatchOptions,
    initialDispatchResult: DeliveryDispatch
  ): QueuedWebhookItem {
    const now = new Date();
    const nextAttemptDate = new Date(now.getTime() + this.policy.initialDelayMs);

    const item: QueuedWebhookItem = {
      id: `retry_${options.dispatchId}`,
      organizationId: options.payload.organizationId,
      clientId: options.payload.clientId ?? 'unknown',
      opportunityId: options.payload.id,
      targetWebhookUrl: options.targetWebhookUrl,
      payload: options.payload,
      webhookSecret: options.webhookSecret,
      attempts: 1,
      nextAttemptAt: nextAttemptDate.toISOString(),
      lastError: initialDispatchResult.errorMessage,
      status: 'PENDING',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.queue.set(item.id, item);
    return item;
  }

  getPendingItems(now: Date = new Date()): QueuedWebhookItem[] {
    const nowIso = now.toISOString();
    return Array.from(this.queue.values()).filter(
      (item) => item.status === 'PENDING' && item.nextAttemptAt <= nowIso
    );
  }

  getAllItems(): QueuedWebhookItem[] {
    return Array.from(this.queue.values());
  }

  getItem(id: string): QueuedWebhookItem | null {
    return this.queue.get(id) ?? null;
  }

  /**
   * Dispatches a single queued item with real I/O.
   */
  async processItem(
    itemId: string,
    options?: { timeoutMs?: number }
  ): Promise<DeliveryDispatch> {
    const item = this.queue.get(itemId);
    if (!item) {
      throw new Error(`Queue item not found: ${itemId}`);
    }

    item.attempts += 1;
    item.updatedAt = new Date().toISOString();

    const dispatchResult = await dispatchRealWebhook({
      dispatchId: `${item.id}_attempt_${item.attempts}`,
      targetWebhookUrl: item.targetWebhookUrl,
      payload: item.payload,
      webhookSecret: item.webhookSecret,
      timeoutMs: options?.timeoutMs ?? 15000,
    });

    if (dispatchResult.status === 'SUCCESS') {
      item.status = 'DISPATCHED';
      item.lastError = null;
      item.nextAttemptAt = '';
    } else {
      item.lastError = dispatchResult.errorMessage;
      if (item.attempts >= this.policy.maxAttempts) {
        item.status = 'EXHAUSTED_DEAD_LETTER';
        item.nextAttemptAt = '';
      } else {
        const delay = Math.min(
          this.policy.initialDelayMs * Math.pow(this.policy.backoffMultiplier, item.attempts - 1),
          this.policy.maxDelayMs
        );
        item.nextAttemptAt = new Date(Date.now() + delay).toISOString();
      }
    }

    return dispatchResult;
  }
}

export const defaultWebhookRetryQueue = new WebhookRetryQueue();
