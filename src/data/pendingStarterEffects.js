// pendingStarterEffects.js — effect ids of the 17 starter cards added in Phase 69 that have no handler yet.
// Their text is final; the handlers come in Phase 71. Until then activating one only logs a warning and does
// nothing (runPiecieEffect / runSnelleEffect / resolvePlaceEffect all tolerate an unknown effect id).
// Coverage guards skip these ids with a "Phase 71" note instead of failing. Remove an id when its handler lands.

export const PENDING_STARTER_EFFECTS = [
  "effect_dancepad",
  "effect_rugbybal",
  "effect_koksmes",
  "effect_ronalds_fles_fireman",
  "effect_schetsboek",
  "effect_hawaii_pizza",
  "effect_chriss_handdoek",
  "effect_headset",
  "effect_magicprompt",
  "effect_hawaiishirt",
  "effect_blikje_monsteros",
  "effect_zwoele_ming_power",
  "effect_ronnies_kitchen",
  "effect_woonkamer_discord",
  "effect_youris_woonkamer",
  "effect_nieuwe_gimma",
  "effect_punto_banco",
];
