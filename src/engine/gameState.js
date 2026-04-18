// gameState.js — The master game state object.
// Every piece of information about a running game lives here:
// whose turn it is, both players' Mosjes, MP values, hands, etc.
// Filled out fully in Phase 3. Structure defined here in Phase 2 update.

console.log('[ENGINE] gameState.js placeholder loaded');

// ─────────────────────────────────────────────────────────────
// GAME STATE SHAPE — reference for all engine and UI files.
// createInitialGameState() will be implemented in Phase 3.
// ─────────────────────────────────────────────────────────────
//
// {
//   roomCode: string,
//   status: "LOBBY" | "PLAYING" | "FINISHED",
//   turnNumber: number,
//   activePlayerId: string,
//   winnerId: null | string,
//
//   // ── SHARED ZONES ──────────────────────────────────────────
//   sharedGeneralQuestDeck: [],      // face-down General Quest deck (centre table)
//   sharedGeneralQuestDiscard: [],   // General Quests that have been attempted
//   activePlace: null,               // the one Place card currently on the field
//
//   // ── PER-PLAYER STATE ──────────────────────────────────────
//   players: {
//     [playerId]: {
//       name: string,
//       deckId: string,              // which starter deck they chose
//
//       // personal cards
//       hand: [],                    // cards in hand (Piecies, Snelle Piecies,
//                                    //   AND Personal Quests drawn from deck)
//       deck: [],                    // personal draw pile
//       discard: [],                 // personal discard pile
//       welloe: [],                  // defeated Mosjes go here (out of game)
//
//       // field
//       activeSlots: [null, null],   // up to 2 active Mosje slots
//       piecieSlots: [               // up to 5 face-down Piecie slots
//         null, null, null, null, null
//       ],
//
//       // tracking
//       questsCompleted: 0,          // total Quests completed this game
//       questsCompletedThisTurn: 0,  // resets each turn (for Quest Haven bonus)
//       questPrepBonus: 0,           // +N to next Quest roll (from Quest Prep piecie)
//       activePlayerId: null
//     }
//   }
// }
