// snellePiecies.js — Data definitions for all Snelle Piecie (instant) cards.
// Unlike regular Piecies, these are played AND activated immediately — any time,
// even during an opponent's turn. No face-down wait required.
// The effectId links to a function in src/abilities/snelleEffects.js.

export const SNELLE_PIECIES = [
  {
    id: "snelle_jensen",
    type: "SNELLE_PIECIE",
    name: "Jensen",
    mpCost: 10,
    requirement: "any",
    effectId: "effect_jensen",
    // Cancel a Piecie that is targeting your Mosje.
    description: "Cancel a Piecie that targets your Mosje.",
    flavourText: "Niet vandaag.",
    artPath: "assets/snelle-piecies/jensen.png"
  },
  {
    id: "snelle_emergency_healings",
    type: "SNELLE_PIECIE",
    name: "Emergency Healings",
    mpCost: 10,
    requirement: "any",
    effectId: "effect_emergency_healings",
    // Restore 25 MP instantly. Resilient ★★: 35 MP instead.
    description: "Restore 25 MP instantly. (Resilient ★★: 35 MP)",
    flavourText: "Op het randje — maar net niet.",
    artPath: "assets/snelle-piecies/emergency_healings.png"
  },
  {
    id: "snelle_lucky_coin",
    type: "SNELLE_PIECIE",
    name: "Lucky Cóin",
    mpCost: 10,
    requirement: "any",
    effectId: "effect_lucky_coin",
    // Reroll any die. Creative ★★★: choose the result instead of rerolling.
    description: "Reroll any die. (Creative ★★★: choose the result instead)",
    flavourText: "Hoofd of munt — jij kiest.",
    artPath: "assets/snelle-piecies/lucky_coin.png"
  },
  {
    id: "snelle_ff_haaltje_nemen",
    type: "SNELLE_PIECIE",
    name: "FF Haaltje Nemen",
    mpCost: 10,
    requirement: "any",
    effectId: "effect_ff_haaltje_nemen",
    // Reduce incoming MP loss by 20. Resilient ★★: reduce by 30 instead.
    description: "Reduce incoming MP loss by 20. (Resilient ★★: by 30)",
    flavourText: "Even een momentje.",
    artPath: "assets/snelle-piecies/ff_haaltje_nemen.png"
  }
];
