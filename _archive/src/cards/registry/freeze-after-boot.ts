import { _setFrozen } from "./card-registry.js";

/**
 * Call once all Phase 4+ cards are registered. After this, registerCard throws.
 * Phase 4 cards run registerCard at module load; simulation code freezes before
 * the first game begins.
 *
 * Calling freezeRegistry() a second time is a no-op (idempotent).
 */
export function freezeRegistry(): void {
  _setFrozen();
}
