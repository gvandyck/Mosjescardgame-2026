// getLevelRow — the { power, traits } row of a Mosje for a level (1-3).
import { MOSJES } from '../../data/mosjes.js';

export function getLevelRow(cardId, level) {
  const def = MOSJES.find(m => m.id === cardId);
  if (!def || !Array.isArray(def.levels)) return null;
  const n = Number(level);
  const lv = Number.isFinite(n) ? Math.min(3, Math.max(1, Math.round(n))) : 1;
  return def.levels[lv - 1] || null;
}
