"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchRealWebhook = dispatchRealWebhook;
/**
 * Transmits an authentic HTTP POST to a client's webhook endpoint.
 *
 * CRITICAL COMPLIANCE ENFORCEMENT:
 * Under NO circumstances does this function return status="SUCCESS" without an authentic,
 * verified HTTP response returning 2xx from the remote server.
 */
async function dispatchRealWebhook(options) {
    const dispatchedAt = new Date().toISOString();
    const timeoutMs = options.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(options.targetWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Gieni-OS-Delivery/1.0',
                ...options.headers,
            },
            body: JSON.stringify(options.payload),
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
    }
    catch (err) {
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
//# sourceMappingURL=dispatcher.js.map