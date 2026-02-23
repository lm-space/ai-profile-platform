/**
 * Interaction Logging Module
 * Tracks every step of a chat request lifecycle for admin review
 */

export interface LogStep {
  step: string;
  step_order: number;
  payload?: any;
  duration_ms?: number;
  provider?: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
}

/**
 * Request logger - accumulates steps during a single /api/chat call
 * Then flushes all steps to D1 in a single batch at the end
 */
export class RequestLogger {
  private steps: LogStep[] = [];
  private stepCounter = 0;
  readonly requestId: string;
  private sessionId: string;
  private conversationId: string;

  constructor(requestId: string, sessionId: string, conversationId: string) {
    this.requestId = requestId;
    this.sessionId = sessionId;
    this.conversationId = conversationId;
  }

  /** Log a step with optional timing */
  log(step: string, payload?: any, extra?: Partial<LogStep>): void {
    this.steps.push({
      step,
      step_order: this.stepCounter++,
      payload: payload ? JSON.stringify(payload) : null,
      duration_ms: extra?.duration_ms,
      provider: extra?.provider,
      model: extra?.model,
      tokens_in: extra?.tokens_in,
      tokens_out: extra?.tokens_out
    });
  }

  /** Helper to time an async operation and log it */
  async timed<T>(step: string, fn: () => Promise<T>, extra?: Partial<LogStep>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.log(step, null, { ...extra, duration_ms: Date.now() - start });
      return result;
    } catch (err) {
      this.log(`${step}_error`, { error: err instanceof Error ? err.message : String(err) }, {
        ...extra,
        duration_ms: Date.now() - start
      });
      throw err;
    }
  }

  /** Flush all accumulated steps to D1 in a batch */
  async flush(db: D1Database): Promise<void> {
    if (this.steps.length === 0) return;

    try {
      const stmt = db.prepare(
        `INSERT INTO interaction_logs (session_id, conversation_id, request_id, step, step_order, payload, duration_ms, provider, model, tokens_in, tokens_out, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      );

      const batch = this.steps.map(s =>
        stmt.bind(
          this.sessionId,
          this.conversationId,
          this.requestId,
          s.step,
          s.step_order,
          s.payload,
          s.duration_ms || null,
          s.provider || null,
          s.model || null,
          s.tokens_in || null,
          s.tokens_out || null
        )
      );

      await db.batch(batch);
    } catch (err) {
      // Logging should never break the main flow
      console.error('Failed to flush interaction logs:', err);
    }
  }
}
