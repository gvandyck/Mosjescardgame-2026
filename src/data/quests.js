// quests.js — Data definitions for all Quest cards.
//
// TWO TYPES:
//   "GENERAL"  — Shared deck in the center of the table. Any Mosje can attempt.
//   "PERSONAL" — Lives in a player's personal deck/hand. Only the named Mosje
//                can attempt it. Higher difficulty, higher reward. Booster-only.
//
// Fields:
//   questType       : "GENERAL" | "PERSONAL"
//   requiredMosjeId : null (General) or a mosje id string (Personal)
//   isBoosterOnly   : false = can appear in starter decks, true = booster packs only
//   rarity          : "★★★" | "★★★★" | "★★★★★"
//   difficulty      : "LOW" | "MEDIUM" | "HIGH"
//
// requirementId links to a function in src/abilities/questLogic.js.

export const QUESTS = [

  // ─────────────────────────────────────────
  // GENERAL QUESTS — shared deck, any Mosje
  // ─────────────────────────────────────────

  {
    id: "quest_arm_wrestling",
    type: "QUEST",
    questType: "GENERAL",
    requiredMosjeId: null,
    name: "Arm Wrestling",
    requirementId: "quest_req_arm_wrestling",
    // Roll a die. Target number depends on Physical trait:
    // Physical ★ = need 5+, ★★ = need 3+, ★★★ = need 2+
    requirementDescription: "Roll: Physical ★=5+, ★★=3+, ★★★=2+",
    successMP: 40,
    failMP: -60,
    description: "Success: +40 MP. Failure: -60 MP.",
    difficulty: "MEDIUM",
    isBoosterOnly: false,
    rarity: "★★★",
    flavourText: "Elleboog op tafel. Druk.",
    artPath: "assets/quests/arm_wrestling.png"
  },
  {
    id: "quest_quick_thinking",
    type: "QUEST",
    questType: "GENERAL",
    requiredMosjeId: null,
    name: "Quick Thinking",
    requirementId: "quest_req_quick_thinking",
    // Roll a die. Target number depends on Mental trait:
    // Mental ★ = need 5+, ★★ = need 4+, ★★★ = need 3+
    requirementDescription: "Roll: Mental ★=5+, ★★=4+, ★★★=3+",
    successMP: 20,
    failMP: -20,
    description: "Success: +20 MP. Failure: -20 MP.",
    difficulty: "MEDIUM",
    isBoosterOnly: false,
    rarity: "★★★",
    flavourText: "Drie seconden. Eén antwoord.",
    artPath: "assets/quests/quick_thinking.png"
  },
  {
    id: "quest_artistic_expression",
    type: "QUEST",
    questType: "GENERAL",
    requiredMosjeId: null,
    name: "Artistic Expression",
    requirementId: "quest_req_artistic_expression",
    // Requires Creative ★★ AND drawing 2 cards as the attempt action.
    requirementDescription: "Requires Creative ★★ + draw 2 cards",
    successMP: 40,
    failMP: -10,
    description: "Success: +40 MP. Failure: -10 MP.",
    difficulty: "MEDIUM",
    isBoosterOnly: false,
    rarity: "★★★",
    flavourText: "Laat je ziel zien.",
    artPath: "assets/quests/artistic_expression.png"
  },
  {
    id: "quest_leap_of_faith",
    type: "QUEST",
    questType: "GENERAL",
    requiredMosjeId: null,
    name: "Leap of Faith",
    requirementId: "quest_req_leap_of_faith",
    // Roll 1d6. 1-3 = Fail, 4-6 = Success. No trait modifier.
    requirementDescription: "Roll 1d6: 1-3 = Fail, 4-6 = Success",
    successMP: 60,
    failMP: -20,
    description: "Success: +60 MP. Failure: -20 MP.",
    difficulty: "MEDIUM",
    isBoosterOnly: false,
    rarity: "★★★",
    flavourText: "Sluit je ogen. Spring.",
    artPath: "assets/quests/leap_of_faith.png"
  },

  // ─────────────────────────────────────────
  // PERSONAL QUESTS — player's hand, named Mosje only
  // These are EXAMPLES / future booster cards.
  // They are NOT in any starter deck.
  // ─────────────────────────────────────────

  {
    id: "quest_west_perfect_read",
    type: "QUEST",
    questType: "PERSONAL",
    requiredMosjeId: "mosje_west",    // West must be on the field to attempt
    name: "Perfect Read",
    requirementId: "quest_req_west_perfect_read",
    // Correctly name the type of the top 3 cards of any deck.
    requirementDescription: "Correctly name the type of the top 3 cards of any deck.",
    successMP: 80,
    failMP: -30,
    description: "Success: +80 MP. Failure: -30 MP.",
    difficulty: "HIGH",
    isBoosterOnly: true,
    rarity: "★★★★",
    flavourText: "Hij wist het al voor je het zei.",
    artPath: "assets/quests/west_perfect_read.png"
  }

];
