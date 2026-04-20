import type { EffectSource } from "../types/events.js";
import type { createRng } from "../utils/rng.js";

export interface EffectContext {
  readonly source: EffectSource;
  readonly actingPlayerId: string;
  readonly rng: ReturnType<typeof createRng>;
  readonly turnCount: number;
}
