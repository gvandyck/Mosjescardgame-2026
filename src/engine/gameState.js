// gameState.js — The master game state object.
// createInitialGameState() builds a fresh state for a new game.
// All engine files read from and write to this shape.

import { MOSJES } from '../data/mosjes.js';
import { STARTER_DECKS } from '../data/starterDecks.js';
import { QUESTS } from '../data/quests.js';
import { buildDeck } from './deckEngine.js';
import { ENERGY_START } from './energy/energyRules.js';
import { createMosjeSlot } from './mp/createMosjeSlot.js';
import { isFresh } from './fresh/isFresh.js';
import { PIECIE_SLOT_COUNT } from './table/tableRules.js';
import { OPENING_HAND_SIZE } from './setup/setupRules.js';
import { rollOpeningDice } from './setup/rollOpeningDice.js';
import { pickStartingMosje } from './setup/pickStartingMosje.js';
import { buildQuestStacks } from './setup/buildQuestStacks.js';

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
export function createInitialGameState(playerConfigs, roomCode, options = {}) {
  console.log('[ENGINE] Creating initial game state for room:', roomCode);

  const players = {};
  for (const config of playerConfigs) {
    players[config.playerId] = createPlayerState(config);
  }

  // Opening die: highest goes first (ties reroll); firstPlayerId option skips the roll.
  let firstPlayerId = options.firstPlayerId;
  let openingRolls = [];
  if (!firstPlayerId) {
    const result = rollOpeningDice(playerConfigs.map(c => c.playerId), options.roll);
    firstPlayerId = result.firstPlayerId;
    openingRolls = result.rolls;
  }

  return {
    roomCode,
    status: 'PLAYING',
    turnNumber: 1,
    activePlayerId: firstPlayerId,
    // Fixed for the whole game — turnNumber is a ROUND counter (increments
    // only when play wraps back to the first player), so turnNumber===1 is
    // true for BOTH players' opening turns. This field is how
    // the bot/UI tell P1's literal first turn apart from P2's.
    firstPlayerId,
    openingRolls,
    // R5: the first player skips their first draw (consumed in startTurn).
    firstTurnDrawSkipPending: true,
    currentPhase: 'MAIN',
    winnerId: null,

    // Shared zones
    // 2.0 typed Quest stacks (Phase 56 resolves them)
    questStacks: buildQuestStacks(QUESTS),
    activePlace: null,           // string card id e.g. 'place_the_gym', or null
    activePlacePlayedBy: null,   // playerId who played the current Place
    activePlaceTurnsActive: 0,   // how many full end-phases have passed since Place was set

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

  const deckDef = config.deckDef || STARTER_DECKS.find(d => d.id === config.deckId);
  if (!deckDef) throw new Error(`[ENGINE] Unknown deckId: ${config.deckId}`);

  const starterMosjeId = pickStartingMosje(deckDef);
  const starterMosjeData = MOSJES.find(m => m.id === starterMosjeId);
  if (!starterMosjeData) throw new Error(`[ENGINE] Unknown starter mosjeId: ${starterMosjeId}`);

  // Starting Mosje goes on the field free and fresh; second slot remains empty.
  const activeSlots = [createMosjeSlot(starterMosjeData), null];

  // Build personal draw deck, including non-starting Mosjes from the chosen deck.
  const deck = removeOneCopy(buildDeck(deckDef), starterMosjeId);

  // 2.0: 3-card opening hand (R5: the first player skips their first draw)
  const hand = deck.splice(0, OPENING_HAND_SIZE);

  return {
    playerId: config.playerId,
    name: config.name,
    deckId: config.deckId,

    hand,
    deck,
    graveyard: [],        // all defeated/discarded/destroyed cards end up here (typed entries)
    welloePile: [],       // Welloe pile — separate from graveyard, never shuffled back (handoff §2f)
    energy: ENERGY_START, // Obby 2.0 Energy pool (Core Numbers §1-2)

    activeSlots,          // [mosjeSlot, mosjeSlot] — up to 2 active Mosjes
    piecieSlots: Array(PIECIE_SLOT_COUNT).fill(null),  // 3 face-down Piecie positions

    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,   // 2.0: Quest attempts this turn (rollQuestAttempt)
    totalDamageTaken: 0,
    questPrepBonus: 0,       // added to next Quest roll by Dubbele Dosis piecie
    questBonusMP: 0,         // next successful Quest gives this bonus MP (momentum_boost etc.)
    hasRerolledDieThisTurn: false,    // DJ 80/20 free reroll tracker
    pieciesPlayedThisTurn: 0,         // chris_ddr combo chain counter
    lastCardPlayedType: null,         // 'PIECIE' | 'SNELLE_PIECIE' | 'QUEST' | null — for jisca
    mpAmplifierActive: false,         // 50% bonus on next MP gain (mp_amplifier piecie)
    chainReactionActive: false,       // free second piecie this turn
    opponentHandPeeked: false,        // stookerino / fps_west peek flag
    returnedMosjesThisTurn: [],       // cardIds returned this turn (cannot replay until next turn)
    hasRerolledDieThisTurn: false,    // DJ 80/20 free reroll tracker
    pieciesPlayedThisTurn: 0,         // chris_ddr combo chain counter
    lastCardPlayedType: null,         // 'PIECIE' | 'SNELLE_PIECIE' | 'QUEST' | null — for jisca
    mpAmplifierActive: false,         // 50% bonus on next MP gain (mp_amplifier piecie)
    chainReactionActive: false,       // free second piecie this turn
    opponentHandPeeked: false,        // stookerino / fps_west peek flag
  };
}

// Remove exactly ONE copy of the starting Mosje (handoff §2c).
function removeOneCopy(deck, cardId) {
  const idx = deck.findIndex(c => c.cardId === cardId);
  if (idx >= 0) deck.splice(idx, 1);
  return deck;
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
// already deals the opening hand. Can be called for explicit initialization.
// ─────────────────────────────────────────────────────────────
export function initializeGame(gameState, starterDeckConfigs = null) {
  console.log('[ENGINE] Initializing game');
  const state = JSON.parse(JSON.stringify(gameState));

  if (starterDeckConfigs) {
    const cfgByPlayerId = Array.isArray(starterDeckConfigs)
      ? Object.fromEntries(starterDeckConfigs.map(cfg => [cfg.playerId, cfg]))
      : starterDeckConfigs;

    for (const playerId of Object.keys(state.players)) {
      const existing = state.players[playerId];
      const cfg = cfgByPlayerId[playerId] || STARTER_DECKS.find(d => d.id === existing.deckId);
      if (!cfg) continue;

      const starterOnField = (existing.activeSlots || [])
        .filter(slot => slot && slot.cardId)
        .map(slot => slot.cardId);
      let deck = buildDeck(cfg);
      for (const id of starterOnField) deck = removeOneCopy(deck, id);
      const hand = deck.splice(0, OPENING_HAND_SIZE);
      state.players[playerId].deck = deck;
      state.players[playerId].hand = hand;
    }
  }

  for (const playerId of Object.keys(state.players)) {
    const hand = state.players[playerId].hand;
    console.log(`[ENGINE] ${playerId} hand: ${hand.length} cards | deck: ${state.players[playerId].deck.length}`);
    if (hand.length !== OPENING_HAND_SIZE) {
      console.warn(`[ENGINE] Warning: expected ${OPENING_HAND_SIZE} cards for ${playerId}, got ${hand.length}`);
    }
  }

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
          // U8 — Entry Protection: target selectors render these disabled.
          protected: isFresh(slot),
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
// Defensive: moves any existing Place to its owner's discard (playPlace refuses before this).
// playedByPlayerId — the player who played this Place card.
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function setActivePlace(gameState, cardId, playedByPlayerId) {
  const state = JSON.parse(JSON.stringify(gameState));
  // If a Place is already active, route it to the owner's personal graveyard
  if (state.activePlace) {
    const ownerId = state.activePlacePlayedBy || state.activePlayerId;
    const owner = state.players[ownerId];
    if (owner) {
      if (!Array.isArray(owner.graveyard)) owner.graveyard = [];
      owner.graveyard.push({ cardId: state.activePlace, type: 'PLACE', source: 'replaced' });
    }
  }
  state.activePlace = cardId;
  state.activePlacePlayedBy = playedByPlayerId || null;
  state.activePlaceTurnsActive = 0;
  console.log(`[ENGINE] Place set: ${cardId} (played by ${playedByPlayerId})`);
  return state;
}

// ─────────────────────────────────────────────────────────────
// destroyActivePlace
// Removes the active Place card from the field, routing it to the Place owner's
// personal discard pile.
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function destroyActivePlace(gameState) {
  const state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  const ownerId = state.activePlacePlayedBy || state.activePlayerId;
  const owner = state.players[ownerId];
  if (owner) {
    if (!Array.isArray(owner.graveyard)) owner.graveyard = [];
    owner.graveyard.push({ cardId: state.activePlace, type: 'PLACE', source: 'destroyed' });
  }
  const removed = state.activePlace;
  state.activePlace = null;
  state.activePlacePlayedBy = null;
  state.activePlaceTurnsActive = 0;
  console.log(`[ENGINE] Place destroyed: ${removed}`);
  return state;
}

export function addCardToHand(gameState, playerId, cardRef) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players?.[playerId];
  if (!player || !cardRef) return state;
  if (!Array.isArray(player.hand)) player.hand = [];
  player.hand.push(cardRef);
  return state;
}

export function returnMosjeToHand(gameState, playerId, slotIndex) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players?.[playerId];
  if (!player) return state;

  const slot = player.activeSlots?.[slotIndex];
  if (!slot || slot.isDefeated) return state;

  const returned = {
    cardId: slot.cardId,
    type: 'MOSJE',
    returnedThisTurn: true,
    savedState: {
      mp: slot.mp,
      level: slot.level,
      traits: { ...(slot.traits || {}) },
      statusEffects: Array.isArray(slot.statusEffects) ? [...slot.statusEffects] : [],
      abilityUsedThisTurn: !!slot.abilityUsedThisTurn,
    },
  };

  player.activeSlots[slotIndex] = null;
  if (!Array.isArray(player.returnedMosjesThisTurn)) player.returnedMosjesThisTurn = [];
  if (!player.returnedMosjesThisTurn.includes(slot.cardId)) {
    player.returnedMosjesThisTurn.push(slot.cardId);
  }

  if (!Array.isArray(player.hand)) player.hand = [];
  player.hand.push(returned);
  return state;
}

export function clearReturnedMosjesAtTurnEnd(gameState, playerId) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players?.[playerId];
  if (!player) return state;

  const blocked = new Set(player.returnedMosjesThisTurn || []);
  player.hand = (player.hand || []).map(card => {
    if (card?.type === 'MOSJE' && blocked.has(card.cardId)) {
      const next = { ...card };
      delete next.returnedThisTurn;
      return next;
    }
    return card;
  });
  player.returnedMosjesThisTurn = [];
  return state;
}

