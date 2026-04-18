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
    winnerId: null,

    // Shared zones
    sharedGeneralQuestDeck,
    sharedGeneralQuestDiscard: [],
    activePlace: null,

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

  // Draw opening hand of 5 cards
  const hand = deck.splice(0, 5);

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
    questPrepBonus: 0,    // added to next Quest roll by Quest Prep piecie
    hasAttemptedQuestThisTurn: false,
    hasRerolledDieThisTurn: false,    // DJ 80/20 free reroll tracker
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
    traits: { ...mosjeData.traits },
    mp,
    level: 0,               // 0, 1, 2 — reach 3 to win
    isDefeated: false,
    statusEffects: [],      // e.g. [{ type: 'MP_LOSS_PER_TURN', value: 10, turnsLeft: 4 }]
    abilityUsedThisTurn: false,
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
