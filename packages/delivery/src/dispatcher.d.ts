import { DeliveryDispatch, ProbateOpportunityFile } from './types.js';
export interface WebhookDispatchOptions {
    dispatchId: string;
    targetWebhookUrl: string;
    payload: ProbateOpportunityFile;
    timeoutMs?: number;
    headers?: Record<string, string>;
}
/**
 * Transmits an authentic HTTP POST to a client's webhook endpoint.
 *
 * CRITICAL COMPLIANCE ENFORCEMENT:
 * Under NO circumstances does this function return status="SUCCESS" without an authentic,
 * verified HTTP response returning 2xx from the remote server.
 */
export declare function dispatchRealWebhook(options: WebhookDispatchOptions): Promise<DeliveryDispatch>;
//# sourceMappingURL=dispatcher.d.ts.map