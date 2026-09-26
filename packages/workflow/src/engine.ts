import { ITenantScopedRepository, TenantScope } from '@gieni/database';
import { WorkflowRun, AuditEvent, WorkflowStage, WorkflowStatus } from './types.js';

export interface StageExecutionParams<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>> {
  stage: WorkflowStage;
  idempotencyKey: string;
  opportunityId?: string | null;
  maxAttempts?: number;
  input: TInput;
  handler: (input: TInput, run: WorkflowRun) => Promise<TOutput>;
  userId?: string;
}

export interface StageExecutionResult<TOutput extends Record<string, unknown>> {
  run: WorkflowRun;
  output: TOutput | null;
  isIdempotentReplay: boolean;
}

/**
 * State machine and orchestration engine for Gieni OS workflow stages.
 * Guaranteed:
 * - Strict idempotency via MongoDB workflowRuns collection.
 * - Deterministic retry and dead-letter queue semantics.
 * - Immutable AuditEvent recording for every execution state change.
 */
export class WorkflowExecutionEngine {
  private runRepo: ITenantScopedRepository<WorkflowRun>;
  private auditRepo: ITenantScopedRepository<AuditEvent>;

  constructor(
    runRepo: ITenantScopedRepository<WorkflowRun>,
    auditRepo: ITenantScopedRepository<AuditEvent>
  ) {
    this.runRepo = runRepo;
    this.auditRepo = auditRepo;
  }

  async executeStage<
    TInput extends Record<string, unknown>,
    TOutput extends Record<string, unknown>
  >(
    scope: TenantScope,
    params: StageExecutionParams<TInput, TOutput>
  ): Promise<StageExecutionResult<TOutput>> {
    const {
      stage,
      idempotencyKey,
      opportunityId = null,
      maxAttempts = 3,
      input,
      handler,
      userId = 'system_workflow_runner',
    } = params;

    // 1. Idempotency check: see if this exact run already succeeded
    const existingRuns = await this.runRepo.findMany(scope, { idempotencyKey } as any);
    const existingRun = existingRuns[0] ?? null;

    if (existingRun) {
      if (existingRun.status === 'COMPLETED') {
        return {
          run: existingRun,
          output: (existingRun.outputRef as TOutput) ?? null,
          isIdempotentReplay: true,
        };
      }

      if (existingRun.status === 'DEAD_LETTER') {
        throw new Error(
          `Workflow stage '${stage}' with idempotency key '${idempotencyKey}' is in DEAD_LETTER status: ${existingRun.errorMessage}`
        );
      }
    }

    // 2. Transition or create run in RUNNING state
    let run: WorkflowRun;
    const now = new Date().toISOString();

    if (existingRun) {
      const updated = await this.runRepo.update(scope, existingRun.id, {
        status: 'RUNNING',
        attemptCount: existingRun.attemptCount + 1,
        errorMessage: null,
      });
      if (!updated) {
        throw new Error(`Failed to transition workflow run '${existingRun.id}' to RUNNING`);
      }
      run = updated;
    } else {
      run = await this.runRepo.create(scope, {
        countyId: scope.countyId ?? 'unknown_county',
        opportunityId,
        stage,
        status: 'RUNNING',
        idempotencyKey,
        attemptCount: 1,
        maxAttempts,
        inputRef: input,
        outputRef: null,
        errorMessage: null,
        startedAt: now,
        completedAt: null,
        schemaVersion: 1,
      });
    }

    // Record audit: Stage started
    await this.auditRepo.create(scope, {
      countyId: scope.countyId ?? 'unknown_county',
      userId,
      action: `WORKFLOW_STAGE_STARTED:${stage}`,
      resourceType: 'WORKFLOW_RUN',
      resourceId: run.id,
      payloadSummary: { stage, attempt: run.attemptCount, idempotencyKey },
      timestamp: now,
      schemaVersion: 1,
    });

    // 3. Execute handler
    try {
      const output = await handler(input, run);
      const completedAt = new Date().toISOString();

      const finalRun = await this.runRepo.update(scope, run.id, {
        status: 'COMPLETED',
        outputRef: output,
        completedAt,
      });

      await this.auditRepo.create(scope, {
        countyId: scope.countyId ?? 'unknown_county',
        userId,
        action: `WORKFLOW_STAGE_COMPLETED:${stage}`,
        resourceType: 'WORKFLOW_RUN',
        resourceId: run.id,
        payloadSummary: { stage, idempotencyKey, success: true },
        timestamp: completedAt,
        schemaVersion: 1,
      });

      return {
        run: finalRun ?? run,
        output,
        isIdempotentReplay: false,
      };
    } catch (err: unknown) {
      const failedAt = new Date().toISOString();
      const message = err instanceof Error ? err.message : String(err);
      const isDeadLetter = run.attemptCount >= maxAttempts;
      const nextStatus: WorkflowStatus = isDeadLetter ? 'DEAD_LETTER' : 'RETRYING';

      const finalRun = await this.runRepo.update(scope, run.id, {
        status: nextStatus,
        errorMessage: message,
      });

      await this.auditRepo.create(scope, {
        countyId: scope.countyId ?? 'unknown_county',
        userId,
        action: isDeadLetter
          ? `WORKFLOW_STAGE_DEAD_LETTER:${stage}`
          : `WORKFLOW_STAGE_FAILED:${stage}`,
        resourceType: 'WORKFLOW_RUN',
        resourceId: run.id,
        payloadSummary: { stage, idempotencyKey, error: message, nextStatus },
        timestamp: failedAt,
        schemaVersion: 1,
      });

      throw new Error(`Workflow stage '${stage}' failed (Status: ${nextStatus}): ${message}`);
    }
  }
}
