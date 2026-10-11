// refreshLevelTraits — sets a slot's traits to the traits of its current level row.
import { getLevelRow } from './getLevelRow.js';

export function refreshLevelTraits(slot) {
  const row = getLevelRow(slot.cardId, slot.level);
  if (row && row.traits) slot.traits = { ...row.traits };
  return slot;
}
