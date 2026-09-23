import http from 'http';
import { calculateOpportunityScore } from '@gieni/scoring';
import { dispatchRealWebhook } from '@gieni/delivery';
export * from './pipeline/document-intelligence.js';

const PORT = process.env.PORT || 8080;

/**
 * Cloud Run Worker Service Entrypoint.
 * Receives authenticated Cloud Tasks and domain events.
 */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Health check endpoint for Cloud Run
  if (url.pathname === '/healthz' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'HEALTHY', service: 'gieni-workers' }));
    return;
  }

  // Cloud Task webhook delivery handler
  if (url.pathname === '/tasks/deliver' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        if (!payload.targetWebhookUrl || !payload.opportunityFile) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing targetWebhookUrl or opportunityFile' }));
          return;
        }

        const result = await dispatchRealWebhook({
          dispatchId: payload.dispatchId || `disp_${Date.now()}`,
          targetWebhookUrl: payload.targetWebhookUrl,
          payload: payload.opportunityFile,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errorMsg }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`[Gieni Workers] Service listening on port ${PORT}`);
});
