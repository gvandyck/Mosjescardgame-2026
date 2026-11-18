// pendingStarterEffects.js — effect ids of the 17 starter cards added in Phase 69 that have no handler yet.
// Their text is final; the handlers come in Phase 71. Until then activating one only logs a warning and does
// nothing (runPiecieEffect / runSnelleEffect / resolvePlaceEffect all tolerate an unknown effect id).
// Coverage guards skip these ids with a "Phase 71" note instead of failing. Remove an id when its handler lands.

export const PENDING_STARTER_EFFECTS = [
  "effect_youris_woonkamer",
  "effect_punto_banco",
];
