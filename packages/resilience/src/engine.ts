import crypto from 'node:crypto';
import {
  CircuitBreaker,
  CircuitState,
  SystemicIncident,
  ParkedWork,
  IncidentType,
  IncidentSeverity,
} from './types.js';

export interface TripResult {
  tripped: boolean;
  circuit: CircuitBreaker;
  incident?: SystemicIncident;
}

export class CircuitBreakerEngine {
  /**
   * Evaluates if requests are currently permitted through this circuit.
   * If OPEN but cooldown period has elapsed, transitions automatically to HALF_OPEN.
   */
  public checkAvailability(circuit: CircuitBreaker): {
    allowed: boolean;
    state: CircuitState;
  } {
    const now = Date.now();

    if (circuit.state === 'CLOSED') {
      return { allowed: true, state: 'CLOSED' };
    }

    if (circuit.state === 'OPEN') {
      const trippedTime = circuit.lastTrippedAt
        ? new Date(circuit.lastTrippedAt).getTime()
        : 0;
      const cooldownMs = circuit.cooldownPeriodSeconds * 1000;

      if (now - trippedTime >= cooldownMs) {
        // Cooldown elapsed: allow trial request in HALF_OPEN state
        circuit.state = 'HALF_OPEN';
        return { allowed: true, state: 'HALF_OPEN' };
      }

      return { allowed: false, state: 'OPEN' };
    }

    // HALF_OPEN: trial in flight
    return { allowed: true, state: 'HALF_OPEN' };
  }

  /**
   * Records a successful execution. If in HALF_OPEN, resets circuit back to CLOSED.
   */
  public recordSuccess(circuit: CircuitBreaker): CircuitBreaker {
    circuit.successCount += 1;
    circuit.failureCount = 0;
    circuit.state = 'CLOSED';
    circuit.updatedAt = new Date().toISOString();
    return circuit;
  }

  /**
   * Records an execution failure.
   * If failureCount reaches threshold, trips circuit to OPEN and records a SystemicIncident.
   */
  public recordFailure(
    circuit: CircuitBreaker,
    error: {
      message: string;
      incidentType?: IncidentType;
      severity?: IncidentSeverity;
      context?: Record<string, unknown>;
    }
  ): TripResult {
    const now = new Date().toISOString();
    circuit.failureCount += 1;
    circuit.lastFailureTime = now;
    circuit.updatedAt = now;

    if (circuit.failureCount >= circuit.failureThreshold || circuit.state === 'HALF_OPEN') {
      circuit.state = 'OPEN';
      circuit.lastTrippedAt = now;

      const incident: SystemicIncident = {
        id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        organizationId: circuit.organizationId,
        countyId: circuit.countyId,
        serviceKey: circuit.serviceKey,
        incidentType: error.incidentType ?? 'CIRCUIT_TRIP',
        severity: error.severity ?? 'CRITICAL',
        message: `Circuit Breaker '${circuit.serviceKey}' tripped for county '${circuit.countyId}': ${error.message}`,
        context: {
          failureCount: circuit.failureCount,
          threshold: circuit.failureThreshold,
          ...error.context,
        },
        occurredAt: now,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      };

      return { tripped: true, circuit, incident };
    }

    return { tripped: false, circuit };
  }

  /**
   * Parks execution payload when a circuit is OPEN.
   * Generates secure replayNonce, expiration, and HMAC replaySignature.
   */
  public parkWork(
    circuit: CircuitBreaker,
    stage: string,
    payload: Record<string, unknown>,
    replaySecret: string,
    ttlSeconds = 86400 // 24 hours
  ): ParkedWork {
    const now = new Date();
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiration = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

    const signatureData = `${circuit.organizationId}:${circuit.countyId}:${stage}:${nonce}:${expiration}:${JSON.stringify(payload)}`;
    const signature = crypto
      .createHmac('sha256', replaySecret)
      .update(signatureData)
      .digest('hex');

    return {
      id: `parked_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      organizationId: circuit.organizationId,
      countyId: circuit.countyId,
      circuitBreakerId: circuit.id,
      stage,
      payload,
      replayNonce: nonce,
      replayExpiration: expiration,
      replaySignature: signature,
      status: 'PARKED',
      parkedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      schemaVersion: 1,
    };
  }

  /**
   * Validates a parked work item before replaying:
   * 1. Verifies HMAC signature integrity.
   * 2. Rejects expired replay items.
   * 3. Prevents replaying already processed items.
   */
  public validateParkedWorkReplay(
    work: ParkedWork,
    replaySecret: string
  ): { valid: boolean; reason?: string } {
    if (work.status !== 'PARKED') {
      return { valid: false, reason: `Invalid status: parked work is currently '${work.status}'` };
    }

    const now = Date.now();
    const expTime = new Date(work.replayExpiration).getTime();
    if (now > expTime) {
      work.status = 'EXPIRED';
      return { valid: false, reason: 'Replay token has expired' };
    }

    const signatureData = `${work.organizationId}:${work.countyId}:${work.stage}:${work.replayNonce}:${work.replayExpiration}:${JSON.stringify(work.payload)}`;
    const expected = crypto
      .createHmac('sha256', replaySecret)
      .update(signatureData)
      .digest('hex');

    const isValidSig =
      expected.length === work.replaySignature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(work.replaySignature));

    if (!isValidSig) {
      return { valid: false, reason: 'Security Violation: Tampered replay signature' };
    }

    return { valid: true };
  }
}
