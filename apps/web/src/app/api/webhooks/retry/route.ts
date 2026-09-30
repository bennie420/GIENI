import { NextResponse } from 'next/server';
import { defaultWebhookRetryQueue } from '@gieni/delivery';

export async function POST(req: Request) {
  try {
    const results = await defaultWebhookRetryQueue.processAllPending();
    const allItems = defaultWebhookRetryQueue.getAllItems();
    const pendingCount = allItems.filter((i) => i.status === 'PENDING').length;
    const deadLetterCount = allItems.filter((i) => i.status === 'EXHAUSTED_DEAD_LETTER').length;
    const dispatchedCount = allItems.filter((i) => i.status === 'DISPATCHED').length;

    return NextResponse.json({
      status: 'OK',
      processedThisRun: results.length,
      queueState: {
        total: allItems.length,
        pending: pendingCount,
        dispatched: dispatchedCount,
        deadLetter: deadLetterCount,
      },
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown retry error';
    return NextResponse.json({ status: 'ERROR', message }, { status: 500 });
  }
}

export async function GET() {
  const allItems = defaultWebhookRetryQueue.getAllItems();
  return NextResponse.json({
    queue: allItems,
    summary: {
      total: allItems.length,
      pending: allItems.filter((i) => i.status === 'PENDING').length,
      exhausted: allItems.filter((i) => i.status === 'EXHAUSTED_DEAD_LETTER').length,
    },
  });
}
