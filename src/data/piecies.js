// piecies.js — Data definitions for all Piecie item cards.
// Piecies are played face-down and can only be activated the NEXT turn
// (unless a card specifically says otherwise).
// The effectId links to a function in src/abilities/piecieEffects.js.

export const PIECIES = [
  {
    id: "piecie_kannetje_melk",
    type: "PIECIE",
    name: "Kannetje Melk",
    mpCost: 0,
    requirement: "any",
    effectId: "effect_kannetje_melk",
    // Gain 25 MP to your active Mosje.
    tags: ["FOOD"],
    description: "Gain 25 MP to your active Mosje.",
    flavourText: "Gewoon lekker.",
    artPath: "assets/piecies/kannetje_melk.png"
  },
  {
    id: "piecie_broodje_doner",
    type: "PIECIE",
    name: "Broodje Döner",
    mpCost: 0,
    requirement: "level1plus",
    // Only usable at Level 1 or higher.
    effectId: "effect_broodje_doner",
    // Gain 35 MP.
    tags: ["FOOD"],
    description: "Gain 35 MP. (Level 1+ only)",
    flavourText: "Klassiek.",
    artPath: "assets/piecies/broodje_doner.png"
  },
  {
    id: "piecie_gun_een_piece",
    type: "PIECIE",
    name: "Gun een Piece",
    mpCost: 0,
    requirement: "any",
    effectId: "effect_gun_een_piece",
    // Draw 2 cards from your deck.
    tags: ["DRAW"],
    description: "Draw 2 cards from your deck.",
    flavourText: "Geef ze een kans.",
    artPath: "assets/piecies/gun_een_piece.png"
  },
  {
    id: "piecie_affoe",
    type: "PIECIE",
    name: "Affoe",
    mpCost: 5,
    requirement: "any",
    effectId: "effect_affoe",
    // Target opponent loses 15 MP, you gain 10 MP.
    tags: ["ATTACK"],
    description: "Target opponent loses 15 MP. You gain 10 MP.",
    flavourText: "Niet persoonlijk.",
    artPath: "assets/piecies/affoe.png"
  },
  {
    id: "piecie_quest_prep",
    type: "PIECIE",
    name: "Quest Prep",
    mpCost: 10,
    requirement: "any",
    effectId: "effect_quest_prep",
    // Your next Quest roll gets +2 to the result.
    tags: ["UTILITY"],
    description: "Your next Quest roll gets +2 added to the result.",
    flavourText: "Preparation is everything.",
    artPath: "assets/piecies/quest_prep.png"
  },
  {
    id: "piecie_slecht_gezet",
    type: "PIECIE",
    name: "Slecht Gezet",
    mpCost: 0,
    requirement: "placeActive",
    // Can only be used when a Place card is on the field.
    effectId: "effect_slecht_gezet",
    // Destroy the currently active Place card.
    tags: ["DESTROY"],
    description: "Destroy the active Place card.",
    flavourText: "Dat Place had het niet verdiend.",
    artPath: "assets/piecies/slecht_gezet.png"
  }
];
