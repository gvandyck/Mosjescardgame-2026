// places.js — Data definitions for all Place location cards.
// Only 1 Place can be active at a time — shared by all players.
// Places have passive effects that trigger automatically at certain moments.
// The effectId links to a function in src/abilities/placeEffects.js.

export const PLACES = [
  {
    id: "place_the_gym",
    type: "PLACE",
    name: "The Gym",
    trigger: "END_PHASE",
    // Fires at the end of every turn.
    effectId: "effect_the_gym",
    // All Mosjes lose 10 MP/turn.
    // Physical ★★ Mosjes gain 25 MP/turn instead.
    // Physical ★★★ Mosjes gain 35 MP/turn instead.
    description: "End Phase: All Mosjes lose 10 MP. Physical ★★ gain 25 MP instead. Physical ★★★ gain 35 MP instead.",
    flavourText: "Alleen de sterksten overleven.",
    artPath: "assets/places/the_gym.png"
  },
  {
    id: "place_bank_chilling",
    type: "PLACE",
    name: "Bank Chilling",
    trigger: "ON_DRAW",
    // Fires whenever a player draws cards.
    effectId: "effect_bank_chilling",
    // Mental ★★+ Mosjes gain +15 MP whenever they draw 2+ cards in one action.
    description: "On Draw: Mental ★★+ Mosjes gain +15 MP when drawing 2 or more cards in one action.",
    flavourText: "Denken terwijl je relaxt.",
    artPath: "assets/places/bank_chilling.png"
  },
  {
    id: "place_quest_haven",
    type: "PLACE",
    name: "Quest Haven",
    trigger: "ON_QUEST",
    // Fires whenever any player completes or attempts a Quest.
    effectId: "effect_quest_haven",
    // All Quest MP rewards +10.
    // Complete 2 Quests in one turn = bonus +25 MP.
    description: "On Quest: All Quest rewards +10 MP. Complete 2 Quests in one turn for +25 bonus MP.",
    flavourText: "Hier worden helden geboren.",
    artPath: "assets/places/quest_haven.png"
  }
];
