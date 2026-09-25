import crypto from 'node:crypto';

export interface CorrelationContext {
  correlationId: string;
  workflowRunId?: string | null;
  caseId?: string | null;
  claimId?: string | null;
  opportunityId?: string | null;
  countyId?: string | null;
  organizationId?: string | null;
}

/**
 * Creates or propagates an end-to-end CorrelationContext across distributed tasks,
 * database audit events, worker pipelines, and Sentry error scopes.
 */
export function createCorrelationContext(
  existing?: Partial<CorrelationContext>
): CorrelationContext {
  return {
    correlationId:
      existing?.correlationId || `corr_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    workflowRunId: existing?.workflowRunId ?? null,
    caseId: existing?.caseId ?? null,
    claimId: existing?.claimId ?? null,
    opportunityId: existing?.opportunityId ?? null,
    countyId: existing?.countyId ?? null,
    organizationId: existing?.organizationId ?? null,
  };
}

/**
 * Extracts structured Sentry tag dictionary from active correlation context.
 */
export function toSentryScopeTags(ctx: CorrelationContext): Record<string, string> {
  const tags: Record<string, string> = {
    correlationId: ctx.correlationId,
  };

  if (ctx.workflowRunId) tags.workflowRunId = ctx.workflowRunId;
  if (ctx.caseId) tags.caseId = ctx.caseId;
  if (ctx.claimId) tags.claimId = ctx.claimId;
  if (ctx.opportunityId) tags.opportunityId = ctx.opportunityId;
  if (ctx.countyId) tags.countyId = ctx.countyId;
  if (ctx.organizationId) tags.organizationId = ctx.organizationId;

  return tags;
}

/**
 * Formats a structured Sentry context dictionary (OP-001).
 */
export function toSentryContext(ctx: CorrelationContext): {
  name: string;
  context: Record<string, unknown>;
} {
  return {
    name: 'probate_investigation',
    context: {
      correlationId: ctx.correlationId,
      workflowRunId: ctx.workflowRunId,
      caseId: ctx.caseId,
      claimId: ctx.claimId,
      opportunityId: ctx.opportunityId,
      countyId: ctx.countyId,
      organizationId: ctx.organizationId,
    },
  };
}

/**
 * Returns formatted structured logging prefix.
 */
export function formatTracingPrefix(ctx: CorrelationContext): string {
  const parts = [`corr=${ctx.correlationId}`];
  if (ctx.workflowRunId) parts.push(`run=${ctx.workflowRunId}`);
  if (ctx.opportunityId) parts.push(`opp=${ctx.opportunityId}`);
  if (ctx.countyId) parts.push(`county=${ctx.countyId}`);
  return `[${parts.join(' ')}]`;
}
