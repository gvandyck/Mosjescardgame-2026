// gameState.js — The master game state object.
// createInitialGameState() builds a fresh state for a new game.
// All engine files read from and write to this shape.

import { MOSJES } from '../data/mosjes.js';
import { STARTER_DECKS } from '../data/starterDecks.js';
import { QUESTS } from '../data/quests.js';
import { shuffleDeck } from './deckEngine.js';

console.log('[ENGINE] gameState.js loaded');

// ─────────────────────────────────────────────────────────────
// createInitialGameState
// Call this once when a game begins.
//
// playerConfigs — array of { playerId, name, deckId }
//   e.g. [{ playerId: 'p1', name: 'West', deckId: 'DIGITAL_CONTROL' },
//          { playerId: 'p2', name: 'Jeffrey', deckId: 'PHYSICAL_FORCE' }]
//
// Returns the full initial game state object.
// ─────────────────────────────────────────────────────────────
export function createInitialGameState(playerConfigs, roomCode) {
  console.log('[ENGINE] Creating initial game state for room:', roomCode);

  // Build the shared General Quest deck (shuffle all GENERAL quests)
  const generalQuests = QUESTS.filter(q => q.questType === 'GENERAL');
  const sharedGeneralQuestDeck = shuffleDeck(
    generalQuests.map(q => ({ cardId: q.id, type: 'QUEST' }))
  );

  const players = {};
  for (const config of playerConfigs) {
    players[config.playerId] = createPlayerState(config);
  }

  return {
    roomCode,
    status: 'PLAYING',
    turnNumber: 1,
    activePlayerId: playerConfigs[0].playerId,
    currentPhase: 'MAIN',
    winnerId: null,

    // Shared zones
    sharedGeneralQuestDeck,
    sharedGeneralQuestDiscard: [],
    activePlace: null,           // string card id e.g. 'place_the_gym', or null
    activePlacePlayedBy: null,   // playerId who played the current Place
    activePlaceTurnsActive: 0,   // how many full end-phases have passed since Place was set
    sharedPlaceDiscard: [],      // Place cards that have been destroyed/replaced

    // Active Quest — visible to all players once revealed
    activeQuest: null,

    players,
  };
}

// ─────────────────────────────────────────────────────────────
// createPlayerState — builds the per-player state object.
// config — { playerId, name, deckId }
// ─────────────────────────────────────────────────────────────
function createPlayerState(config) {
  console.log('[ENGINE] Building player state for:', config.name, '| deck:', config.deckId);

  const deckDef = STARTER_DECKS.find(d => d.id === config.deckId);
  if (!deckDef) throw new Error(`[ENGINE] Unknown deckId: ${config.deckId}`);

  // Build Mosje slots — start both Mosjes on the field, apply MP rounding rule
  const activeSlots = deckDef.mosjes.map(mosjeId => {
    const mosjeData = MOSJES.find(m => m.id === mosjeId);
    if (!mosjeData) throw new Error(`[ENGINE] Unknown mosjeId: ${mosjeId}`);
    return createMosjeSlot(mosjeData);
  });

  // Build personal draw deck from all non-Mosje cards in the deck config
  const rawDeck = [
    ...deckDef.piecies.map(id => ({ cardId: id, type: 'PIECIE', faceDown: false, turnsOnField: 0 })),
    ...deckDef.snellePiecies.map(id => ({ cardId: id, type: 'SNELLE_PIECIE', faceDown: false, turnsOnField: 0 })),
    ...deckDef.places.map(id => ({ cardId: id, type: 'PLACE', faceDown: false, turnsOnField: 0 })),
    ...deckDef.quests.map(id => ({ cardId: id, type: 'QUEST', faceDown: false, turnsOnField: 0 })),
  ];
  const deck = shuffleDeck(rawDeck);

  // Draw opening hand of 7 cards
  const hand = deck.splice(0, 7);

  return {
    playerId: config.playerId,
    name: config.name,
    deckId: config.deckId,

    hand,
    deck,
    discard: [],
    welloe: [],           // defeated Mosjes rest here, out of the game

    activeSlots,          // [mosjeSlot, mosjeSlot] — up to 2 active Mosjes
    piecieSlots: [null, null, null, null, null],  // 5 face-down Piecie positions

    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questPrepBonus: 0,       // added to next Quest roll by Quest Prep piecie
    questBonusMP: 0,         // next successful Quest gives this bonus MP (momentum_boost etc.)
    hasAttemptedQuestThisTurn: false,
    hasRerolledDieThisTurn: false,    // DJ 80/20 free reroll tracker
    pieciesPlayedThisTurn: 0,         // chris_ddr combo chain counter
    lastCardPlayedType: null,         // 'PIECIE' | 'SNELLE_PIECIE' | 'QUEST' | null — for jisca
    mpAmplifierActive: false,         // 50% bonus on next MP gain (mp_amplifier piecie)
    chainReactionActive: false,       // free second piecie this turn
    opponentHandPeeked: false,        // stookerino / fps_west peek flag
    hasRerolledDieThisTurn: false,    // DJ 80/20 free reroll tracker
    pieciesPlayedThisTurn: 0,         // chris_ddr combo chain counter
    lastCardPlayedType: null,         // 'PIECIE' | 'SNELLE_PIECIE' | 'QUEST' | null — for jisca
    mpAmplifierActive: false,         // 50% bonus on next MP gain (mp_amplifier piecie)
    chainReactionActive: false,       // free second piecie this turn
    opponentHandPeeked: false,        // stookerino / fps_west peek flag
  };
}

// ─────────────────────────────────────────────────────────────
// createMosjeSlot — wraps a Mosje card definition into a live
// field slot that tracks its current MP and level.
// ─────────────────────────────────────────────────────────────
function createMosjeSlot(mosjeData) {
  // Rule: starting MP of 1–9 rounds UP to 10
  let mp = mosjeData.startMP;
  if (mp > 0 && mp < 10) mp = 10;

  console.log('[ENGINE] Placing Mosje on field:', mosjeData.name, '| starting MP:', mp);

  return {
    cardId: mosjeData.id,
    name: mosjeData.name,
    immuneThisTurn: false,      // coert_kastelein: cannot lose MP this turn
    mpLostThisTurn: 0,          // alyssa_bulldozer: tracks damage taken this turn
    traits: { ...mosjeData.traits },
    mp,
    level: 0,               // 0, 1, 2 — reach 3 to win
    isDefeated: false,
    statusEffects: [],      // e.g. [{ type: 'MP_LOSS_PER_TURN', value: 10, turnsLeft: 4 }]
    abilityUsedThisTurn: false,
    immuneThisTurn: false,      // coert_kastelein: cannot lose MP this turn
    mpLostThisTurn: 0,          // alyssa_bulldozer: tracks damage taken this turn
  };
}

// ─────────────────────────────────────────────────────────────
// getActiveMosjesForPlayer
// Returns only the non-defeated Mosje slots for a player.
// Used by questLogic, synergyResolver, victoryChecker, etc.
// ─────────────────────────────────────────────────────────────
export function getActiveMosjesForPlayer(gameState, playerId) {
  const player = gameState.players[playerId];
  if (!player) return [];
  return player.activeSlots.filter(slot => slot !== null && !slot.isDefeated);
}

// ─────────────────────────────────────────────────────────────
// getAllPlayerIds — convenience helper
// ─────────────────────────────────────────────────────────────
export function getAllPlayerIds(gameState) {
  return Object.keys(gameState.players);
}

// ─────────────────────────────────────────────────────────────
// getOpponentIds — returns all player IDs except the given one
// ─────────────────────────────────────────────────────────────
export function getOpponentIds(gameState, playerId) {
  return getAllPlayerIds(gameState).filter(id => id !== playerId);
}

// ─────────────────────────────────────────────────────────────
// initializeGame
// Called once after createInitialGameState to deal starting hands.
// Currently a verification/logging function since createInitialGameState
// already deals 7 cards. Can be called for explicit initialization.
// ─────────────────────────────────────────────────────────────
export function initializeGame(gameState) {
  console.log('[ENGINE] Initializing game — verifying starting hands');
  const state = JSON.parse(JSON.stringify(gameState));
  for (const playerId of Object.keys(state.players)) {
    const hand = state.players[playerId].hand;
    console.log(`[ENGINE] ${playerId} starting hand: ${hand.length} cards`);
    if (hand.length !== 7) {
      console.warn(`[ENGINE] Warning: expected 7 cards for ${playerId}, got ${hand.length}`);
    }
  }
  console.log('[ENGINE] Game initialized — player_1 hand: 7, player_2 hand: 7');
  return state;
}

// ─────────────────────────────────────────────────────────────
// getOpponentMosjes
// Returns array of { id, label, mpValue, level, owner } for all
// non-defeated opponent Mosjes on the field. Used for target selection.
// ─────────────────────────────────────────────────────────────
export function getOpponentMosjes(gameState, playerId) {
  const results = [];
  for (const [pid, player] of Object.entries(gameState.players)) {
    if (pid === playerId) continue;
    player.activeSlots.forEach((slot, index) => {
      if (slot && !slot.isDefeated) {
        results.push({
          id: `${pid}_slot_${index}`,
          cardId: slot.cardId,
          label: slot.name,
          mpValue: slot.mp,
          level: slot.level,
          owner: pid,
          slotIndex: index,
        });
      }
    });
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// getPlayerMosjes
// Returns array of { id, label, mpValue, level, owner } for all
// non-defeated own Mosjes on the field. Used for target selection.
// ─────────────────────────────────────────────────────────────
export function getPlayerMosjes(gameState, playerId) {
  const player = gameState.players[playerId];
  if (!player) return [];
  return player.activeSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot && !slot.isDefeated)
    .map(({ slot, index }) => ({
      id: `${playerId}_slot_${index}`,
      cardId: slot.cardId,
      label: slot.name,
      mpValue: slot.mp,
      level: slot.level,
      owner: playerId,
      slotIndex: index,
    }));
}

// ─────────────────────────────────────────────────────────────
// setActivePlace
// Places a Place card onto the shared field.
// Destroys any existing Place (moves it to sharedPlaceDiscard).
// playedByPlayerId — the player who played this Place card.
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function setActivePlace(gameState, cardId, playedByPlayerId) {
  const state = JSON.parse(JSON.stringify(gameState));
  // If a Place is already active, discard it first
  if (state.activePlace) {
    if (!Array.isArray(state.sharedPlaceDiscard)) state.sharedPlaceDiscard = [];
    state.sharedPlaceDiscard.unshift({ cardId: state.activePlace, type: 'PLACE' });
  }
  state.activePlace = cardId;
  state.activePlacePlayedBy = playedByPlayerId || null;
  state.activePlaceTurnsActive = 0;
  console.log(`[ENGINE] Place set: ${cardId} (played by ${playedByPlayerId})`);
  return state;
}

// ─────────────────────────────────────────────────────────────
// destroyActivePlace
// Removes the active Place card from the field, moving it to sharedPlaceDiscard.
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function destroyActivePlace(gameState) {
  const state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  if (!Array.isArray(state.sharedPlaceDiscard)) state.sharedPlaceDiscard = [];
  state.sharedPlaceDiscard.unshift({ cardId: state.activePlace, type: 'PLACE' });
  const removed = state.activePlace;
  state.activePlace = null;
  state.activePlacePlayedBy = null;
  state.activePlaceTurnsActive = 0;
  console.log(`[ENGINE] Place destroyed: ${removed}`);
  return state;
}

