// mosjes.js — Data definitions for all Mosje character cards.
// No logic here — just plain JavaScript objects describing each card.
// The abilityId links to a function name in src/abilities/mosjeAbilities.js.

export const MOSJES = [
  {
    id: "mosje_west",
    type: "MOSJE",
    name: "[West] Sr.Tactical",
    startMP: 15,
    traits: { mental: 3, technical: 1 },
    abilityId: "west_calculated_guess",
    // Name a card type → reveal top card of any deck.
    // Correct: draw 2 + gain 10 MP. Wrong: lose 10 MP.
    synergyWith: ["mosje_azn_cless"],
    synergyEffect: "Physical Quests give +15 bonus MP",
    petSynergy: null,
    flavourText: "Always three moves ahead.",
    artPath: "assets/mosje-art/west.png"
  },
  {
    id: "mosje_michelle",
    type: "MOSJE",
    name: "[Michelle] Iron Tuk",
    startMP: 0,
    // startMP 0 → rounds UP to 10 on game init (rule: 1-9 rounds to 10)
    traits: { physical: 2, resilient: 2 },
    abilityId: "michelle_iron_tuk",
    // After Quest: roll 1-3 = half MP reward, 4-6 = double MP reward.
    synergyWith: [],
    synergyEffect: null,
    petSynergy: null,
    flavourText: "Takes the hit. Keeps going.",
    artPath: "assets/mosje-art/michelle.png"
  },
  {
    id: "mosje_jeffrey",
    type: "MOSJE",
    name: "[Jeffrey] The Strongman",
    startMP: 20,
    traits: { physical: 3, resilient: 1 },
    abilityId: "jeffrey_strongman",
    // All Quests give +10 MP. Cannot use FOOD or RESTORE tagged Piecies.
    synergyWith: [],
    synergyEffect: null,
    petSynergy: null,
    flavourText: "Pure power. No shortcuts.",
    artPath: "assets/mosje-art/jeffrey.png"
  },
  {
    id: "mosje_dj_8020",
    type: "MOSJE",
    name: "[DJ 80/20] The Lucky Mixer",
    startMP: 20,
    traits: { creative: 3, resilient: 2 },
    abilityId: "dj8020_lucky_mixer",
    // Passive: gain 10 MP at turn start.
    // Active: reroll any 1 die per turn (free).
    synergyWith: [],
    synergyEffect: null,
    petSynergy: null,
    flavourText: "The odds? He sets them.",
    artPath: "assets/mosje-art/dj8020.png"
  },
  {
    id: "mosje_binti",
    type: "MOSJE",
    name: "[Binti] The Sharp Tongue",
    startMP: 10,
    traits: { creative: 2, social: 3 },
    abilityId: "binti_sharp_tongue",
    // Discard 1 Piecie from hand → opponent discards 1 card and loses 10 MP.
    synergyWith: ["mosje_coert_tech"],
    synergyEffect: "DOUBLE MP from FOOD cards",
    petSynergy: null,
    flavourText: "One sentence. Maximum damage.",
    artPath: "assets/mosje-art/binti.png"
  },
  {
    id: "mosje_coert_tech",
    type: "MOSJE",
    name: "[Coert] The Tech Savant",
    startMP: 10,
    traits: { mental: 2, technical: 3 },
    abilityId: "coert_tech_savant",
    // Pay 10 MP → draw 1 card (repeatable).
    // Synergy with Binti: DOUBLE MP from FOOD cards.
    synergyWith: ["mosje_binti"],
    synergyEffect: "DOUBLE MP from FOOD cards",
    petSynergy: null,
    flavourText: "If it runs on code, he owns it.",
    artPath: "assets/mosje-art/coert.png"
  }
];
