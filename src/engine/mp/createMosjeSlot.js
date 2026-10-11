// createMosjeSlot — the ONE factory for every Mosje that enters the field.
// Levels are stored 1-3 (Obby 2.0); nothing creates a Level 0 slot.
import { roundToFive } from '../roundToFive.js';

export function createMosjeSlot(mosjeDef, { level = 1, mp } = {}) {
  const n = Number(level);
  const lv = Number.isFinite(n) ? Math.min(3, Math.max(1, Math.round(n))) : 1;
  const rawMp = Number(mp === undefined ? mosjeDef.startMP : mp);
  const slotMp = Math.max(0, roundToFive(Number.isFinite(rawMp) ? rawMp : 0));
  const row = Array.isArray(mosjeDef.levels) ? mosjeDef.levels[lv - 1] : null;
  return {
    cardId: mosjeDef.id,
    name: mosjeDef.name,
    subtype: mosjeDef.subtype || 'UNKNOWN',
    traits: { ...((row && row.traits) || mosjeDef.traits || {}) },
    mp: slotMp,
    level: lv,
    sideways: false,
    isDefeated: false,
    statusEffects: [],
    abilityUsedThisTurn: false,
    immuneThisTurn: false,
    mpLostThisTurn: 0,
    // U8 — Entry Protection: safe from opponent effects until the owner's next
    // turn starts (cleared in startTurn).
    entryProtected: true,
  };
}
