import { InvestigationException, ExceptionPriority } from './types.js';

export interface AmbiguityEvaluationInput {
  opportunityId: string;
  countyId: string;
  organizationId: string;
  clientId?: string | null;
  estimatedEquity: number | null;
  ambiguityDescription: string;
  highValueThreshold?: number; // Defaults to $500,000
}

/**
 * Soft-Gate Routing Engine for High-Value Ambiguities (Gieni OS Section 11 P1-2).
 *
 * Invariant:
 * Soft-gate exceptions escalate review priority to senior researchers without halting
 * non-dependent downstream pipeline stages.
 */
export function evaluateAmbiguityRouting(
  input: AmbiguityEvaluationInput
): {
  isHighValue: boolean;
  priority: ExceptionPriority;
  isSoftGate: boolean;
  exceptionPayload: Omit<InvestigationException, 'id' | 'createdAt' | 'updatedAt'>;
} {
  const threshold = input.highValueThreshold ?? 500000;
  const isHighValue = (input.estimatedEquity ?? 0) >= threshold;

  const priority: ExceptionPriority = isHighValue
    ? 'EXPEDITE_SENIOR_REVIEW'
    : 'STANDARD';

  return {
    isHighValue,
    priority,
    isSoftGate: true, // Soft-gate: changes priority only, does not freeze the pipeline
    exceptionPayload: {
      organizationId: input.organizationId,
      countyId: input.countyId,
      opportunityId: input.opportunityId,
      clientId: input.clientId ?? null,
      type: 'HIGH_VALUE_AMBIGUITY',
      status: 'PENDING_REVIEW',
      priority,
      isSoftGate: true,
      estimatedValue: input.estimatedEquity,
      description: isHighValue
        ? `[HIGH VALUE: $${input.estimatedEquity?.toLocaleString()}] Expedite Senior Review: ${input.ambiguityDescription}`
        : `Ambiguity Review: ${input.ambiguityDescription}`,
      assignedTo: isHighValue ? 'role:senior_qc_lead' : null,
      schemaVersion: 1,
    },
  };
}
