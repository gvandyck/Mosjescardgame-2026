import type { EffectSource } from "../types/events.js";
import type { createRng } from "../utils/rng.js";
import type { PendingEffect } from "../types/pending-effect.js";

export interface EffectContext {
  readonly source: EffectSource;
  readonly actingPlayerId: string;
  readonly rng: ReturnType<typeof createRng>;
  readonly turnCount: number;
  /** Set when a snelle card is executed in response to a pending effect. */
  readonly respondingToEffectId?: string;
  /** The cardId of the pending effect being responded to (for $pendingEffectCardId). */
  readonly respondingToCardId?: string;
  /** The full PendingEffect being responded to (for $pendingEffectDrainAmount etc.). */
  readonly respondingToPendingEffect?: PendingEffect;
}
