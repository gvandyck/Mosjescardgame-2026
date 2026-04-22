// turnManager.js â€” Controls the 4 turn phases: DRAW â†’ MAIN â†’ QUEST â†’ END
// Coordinates which engine functions run in which order.
// The UI calls these functions; they return the updated game state.

import { drawCards, shuffleDeck } from './deckEngine.js';
import { gainMP, applyStatusEffectMP, getTotalMPForPlayer } from './mpManager.js';
import { checkVictory } from './victoryChecker.js';
import { getAllPlayerIds, setActivePlace, destroyActivePlace, clearReturnedMosjesAtTurnEnd } from './gameState.js';
import * as placeEffects from '../abilities/placeEffects.js';
import * as piecieEffects from '../abilities/piecieEffects.js';
import * as snelleEffects from '../abilities/snelleEffects.js';
import * as mosjeAbilities from '../abilities/mosjeAbilities.js';
import { MOSJES } from '../data/mosjes.js';
import { PIECIES } from '../data/piecies.js';

console.log('[ENGINE] turnManager.js loaded');

const PIECIE_LOOKUP = Object.fromEntries(PIECIES.map(card => [card.id, card]));

function normalizePiecieSlots(player, slotCount = 4) {
  const source = Array.isArray(player?.piecieSlots) ? player.piecieSlots : [];
  const normalized = source.slice(0, slotCount).map(slot => (slot == null ? null : slot));
  while (normalized.length < slotCount) normalized.push(null);
  player.piecieSlots = normalized;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// startTurn
// Called at the beginning of a player's turn.
// Runs: Momentum Domination check â†’ draw 1 card â†’ passive MP gains.
// Returns updated gameState.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function startTurn(gameState) {
  let state = JSON.parse(JSON.stringify(gameState));
  const playerId = state.activePlayerId;
  console.log(`[ENGINE] â”€â”€ Turn ${state.turnNumber} START â€” Player: ${playerId} â”€â”€`);

  // Reset per-turn trackers for the active player
  const activePlayer = state.players[playerId];
  activePlayer.questsCompletedThisTurn = 0;
  activePlayer.hasAttemptedQuestThisTurn = false;
  activePlayer.questsAttemptedThisTurn = 0;
  activePlayer.hasRerolledDieThisTurn = false;
  activePlayer.pieciesPlayedThisTurn = 0;
  activePlayer.lastCardPlayedType = null;
  activePlayer.instantPiecieThisTurn = false;
  activePlayer.chainReactionActive = false;
  activePlayer.abilityDoubleTrigger = false;
  activePlayer.drawsThisTurn = 0;
  activePlayer.pieciesActivatedThisTurn = 0;
  activePlayer.actionsThisTurn = [];
  activePlayer.freePiecieActivationAvailable = false;
  for (const slot of activePlayer.activeSlots) {
    if (slot) {
      slot.abilityUsedThisTurn = false;
      slot.immuneThisTurn = false;
      slot.mpLostThisTurn = 0;
    }
  }

  // Momentum Domination check happens at TURN START
  state.momentumCheckPhase = true;
  state = checkVictory(state);
  state.momentumCheckPhase = false;
  if (state.status === 'FINISHED') return state;

  // START PHASE — fire active Place effects (START_PHASE trigger only)
  state = applyPlaceEffectsOnStart(state, playerId);

  // DRAW PHASE â€” draw 1 card
  state = phaseDrawCard(state, playerId);
  // ON_DRAW Place effects — fires if active Place has trigger 'ON_DRAW'
  state = applyPlaceEffectsOnDraw(state, playerId, 1);
  // Passive turn-start MP (e.g. DJ 80/20 gains 10 MP automatically)
  // Ability functions will hook into this in Phase 4.
  console.log('[ENGINE] DRAW phase complete');

  return state;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// phaseDrawCard
// Draws 1 card from the player's personal deck into their hand.
// If the deck is empty, nothing happens (no penalty â€” may change later).
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function phaseDrawCard(gameState, playerId, count = 1) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];

  if (player.deck.length === 0) {
    console.log('[ENGINE] Draw phase: deck is empty, no card drawn');
    return state;
  }

  const { drawn, remaining } = drawCards(player.deck, count);
  player.deck = remaining;
  player.hand.push(...drawn);
  player.drawsThisTurn = (player.drawsThisTurn || 0) + drawn.length;
  console.log(`[ENGINE] ${playerId} drew ${drawn.length} card(s). Hand size: ${player.hand.length}`);
  return state;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// endTurn
// Called when the active player clicks "End Turn".
// Runs: END phase Place effects â†’ status effect ticks â†’ next player.
// Returns updated gameState.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function endTurn(gameState) {
  let state = JSON.parse(JSON.stringify(gameState));
  const playerId = state.activePlayerId;
  console.log(`[ENGINE] â”€â”€ Turn ${state.turnNumber} END â€” Player: ${playerId} â”€â”€`);

  // Returned Mosjes become replayable on the player's next turn.
  state = clearReturnedMosjesAtTurnEnd(state, playerId);

  // END PHASE — fire active Place effects (END_PHASE trigger only)
  state = applyPlaceEffectsOnEnd(state);

  // END PHASE â€” tick down status effects on all active Mosjes for all players
  const allPlayerIds = getAllPlayerIds(state);
  for (const pid of allPlayerIds) {
    const player = state.players[pid];
    player.activeSlots.forEach((slot, index) => {
      const statusEffects = Array.isArray(slot?.statusEffects) ? slot.statusEffects : [];
      if (slot && !slot.isDefeated && statusEffects.length > 0) {
        state = applyStatusEffectMP(state, pid, index);
      }
    });
  }

  state = checkVictory(state);
  if (state.status === 'FINISHED') return state;

  // Advance to next player
  const playerIds = getAllPlayerIds(state);
  const currentIndex = playerIds.indexOf(playerId);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  state.activePlayerId = playerIds[nextIndex];

  // Increment turn number when we cycle back to the first player
  if (nextIndex === 0) {
    state.turnNumber += 1;
    console.log(`[ENGINE] Round complete. Turn ${state.turnNumber} begins.`);
  }

  console.log(`[ENGINE] Next player: ${state.activePlayerId}`);
  return state;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// attemptGeneralQuest
// Option A of the Quest Phase.
// Draws the top card from sharedGeneralQuestDeck.
// Returns { state, questCard } so the UI can show the quest to the player.
// The UI will then call confirmQuestResult() to resolve it.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function attemptGeneralQuest(gameState) {
  let state = JSON.parse(JSON.stringify(gameState));
  const playerId = state.activePlayerId;
  const player = state.players[playerId];

  const maxAttempts = state.activePlace === 'place_quest_haven' ? 2 : 1;
  if ((player.questsAttemptedThisTurn || 0) >= maxAttempts) {
    console.log('[ENGINE] Quest already attempted this turn (max reached)');
    return { state, questCard: null };
  }

  if (state.sharedGeneralQuestDeck.length === 0) {
    if (state.sharedGeneralQuestDiscard.length === 0) {
      console.log('[ENGINE] General Quest deck and discard are empty');
      return { state, questCard: null };
    }
    console.log('[ENGINE] Shared Quest deck empty — recycling discard pile into deck');
    state.sharedGeneralQuestDeck = shuffleDeck([...state.sharedGeneralQuestDiscard]);
    state.sharedGeneralQuestDiscard = [];
    console.log(`[ENGINE] Recycled ${state.sharedGeneralQuestDeck.length} General Quests back into deck`);
  }

  const questCard = state.sharedGeneralQuestDeck.shift(); // take from top
  console.log('[ENGINE] General Quest drawn:', questCard.cardId);

  player.hasAttemptedQuestThisTurn = true;
  player.questsAttemptedThisTurn = (player.questsAttemptedThisTurn || 0) + 1;

  return { state, questCard };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// attemptPersonalQuest
// Option B of the Quest Phase.
// Plays a Personal Quest card from the player's hand.
// Requires the named Mosje to be on the field (checked by questLogic.js).
// Returns { state, questCard, eligible }
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function attemptPersonalQuest(gameState, questCardId) {
  let state = JSON.parse(JSON.stringify(gameState));
  const playerId = state.activePlayerId;
  const player = state.players[playerId];

  const maxAttempts = state.activePlace === 'place_quest_haven' ? 2 : 1;
  if ((player.questsAttemptedThisTurn || 0) >= maxAttempts) {
    console.log('[ENGINE] Quest already attempted this turn (max reached)');
    return { state, questCard: null, eligible: false };
  }

  const cardIndex = player.hand.findIndex(c => c.cardId === questCardId);
  if (cardIndex === -1) {
    console.log('[ENGINE] Personal Quest card not in hand:', questCardId);
    return { state, questCard: null, eligible: false };
  }

  const [questCard] = player.hand.splice(cardIndex, 1);
  player.hasAttemptedQuestThisTurn = true;
  player.questsAttemptedThisTurn = (player.questsAttemptedThisTurn || 0) + 1;
  console.log('[ENGINE] Personal Quest played from hand:', questCardId);

  return { state, questCard, eligible: true };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// playPiecie
// Places a Piecie card from the active player's hand face-down on the field.
// cardRef â€” the hand reference object { cardId, type }
// cardDef â€” full card definition from PIECIES data (has effectId, tags)
// Returns { state, success, error? }
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playPiecie(gameState, playerId, cardRef, cardDef) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  // Defensive normalization for synced multiplayer states
  if (!Array.isArray(player.hand)) player.hand = [];
  if (!Array.isArray(player.discard)) player.discard = [];

  // Remove from hand
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };

  if ((player.pieciesPlayedThisTurn || 0) >= 4) {
    return { state, success: false, error: 'You can place up to 4 Piecies' };
  }

  player.hand.splice(handIndex, 1);

  // Place Piecie face-down on the field.
  // It can be activated starting next turn by the owner.
  normalizePiecieSlots(player, 4);
  const emptySlot = player.piecieSlots.findIndex(s => s === null);
  if (emptySlot < 0) {
    // Restore card to hand if placement fails.
    player.hand.splice(handIndex, 0, cardRef);
    return { state, success: false, error: 'No empty Piecie slot available' };
  }

  player.piecieSlots[emptySlot] = {
    cardId: cardRef.cardId,
    type: 'PIECIE',
    faceDown: true,
    activated: false,
    playedOnTurn: state.turnNumber,
    canActivateOnTurn: state.turnNumber + 1,
  };

  state.players[playerId].pieciesPlayedThisTurn = (state.players[playerId].pieciesPlayedThisTurn || 0) + 1;
  state.players[playerId].lastCardPlayedType = 'PIECIE';

  state = checkVictory(state);
  return { state, success: true };
}

export function activatePiecie(gameState, playerId, slotIndex) {
  let state = JSON.parse(JSON.stringify(gameState));
  let player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  if (state.activePlayerId !== playerId) {
    return { state, success: false, error: 'You can only activate Piecies on your own turn' };
  }

  normalizePiecieSlots(player, 4);
  if (!Array.isArray(player.discard)) {
    player.discard = [];
  }

  const safeSlotIndex = Number(slotIndex);
  if (!Number.isInteger(safeSlotIndex) || safeSlotIndex < 0 || safeSlotIndex >= player.piecieSlots.length) {
    return { state, success: false, error: 'Invalid Piecie slot' };
  }

  const slot = player.piecieSlots[safeSlotIndex];
  if (!slot) return { state, success: false, error: 'No Piecie in that slot' };
  if (slot.activated) return { state, success: false, error: 'Piecie already activated' };
  const slotCardId = slot.cardId;

  const canActivateOnTurn = Number.isFinite(slot.canActivateOnTurn)
    ? slot.canActivateOnTurn
    : ((Number.isFinite(slot.playedOnTurn) ? slot.playedOnTurn : state.turnNumber) + 1);
  if (state.turnNumber < canActivateOnTurn) {
    return { state, success: false, error: 'This Piecie can be activated starting next turn' };
  }

  // Resolve card definition by id for activation metadata.
  const knownCardDef = cardDefLookup(slot.cardId);
  if (!knownCardDef) {
    return { state, success: false, error: 'Unknown Piecie definition' };
  }

  if (
    state.activePlace === 'place_coerts_caravan' &&
    player.freePiecieActivationAvailable === true &&
    player.activeSlots.some(s => s && !s.isDefeated && String(s.cardId || '').includes('coert'))
  ) {
    player.freePiecieActivationAvailable = false;
    console.log('[PLACE] Coert\'s Caravan — free Piecie activation consumed');
  }

  // Check The Void restriction (blocks RESTORE and FOOD Piecies)
  if (state.activePlace === 'place_the_void') {
    const blocked = ['RESTORE', 'FOOD'];
    if (knownCardDef.tags?.some(t => blocked.includes(t))) {
      console.log('[ENGINE] The Void blocks RESTORE/FOOD Piecies');
      return { state, success: false, error: 'The Void blocks RESTORE and FOOD Piecies' };
    }
  }

  // Check reactive negation flags set by opponent's Snelle Piecies
  const flags = state._snelleFlags || {};
  const oppId = Object.keys(state.players).find(id => id !== playerId);
  const isAttack = knownCardDef.tags?.includes('ATTACK');

  // Flip face-up when activation starts
  slot.faceDown = false;
  slot.activated = true;

  // Counter Strikka: negate any Piecie
  if (oppId && flags.negateNextPiecie?.[oppId]) {
    delete state._snelleFlags.negateNextPiecie[oppId];
    console.log('[ENGINE] Counter Strikka negated:', knownCardDef.name);
    player.discard.unshift({ cardId: slotCardId, type: 'PIECIE' });
    player.piecieSlots[safeSlotIndex] = null;
    state = checkVictory(state);
    return { state, success: true, negated: true, cardDef: knownCardDef };
  }
  // Perfect Dodge: negate ATTACK Piecies + grant 15 MP
  if (oppId && isAttack && flags.negateNextAttack?.[oppId]) {
    delete state._snelleFlags.negateNextAttack[oppId];
    const oppPlayer = state.players[oppId];
    const si = oppPlayer.activeSlots.findIndex(s => s && !s.isDefeated);
    if (si >= 0) oppPlayer.activeSlots[si].mp += 15;
    console.log('[ENGINE] Perfect Dodge negated ATTACK + granted 15 MP to opponent');
    player.discard.unshift({ cardId: slotCardId, type: 'PIECIE' });
    player.piecieSlots[safeSlotIndex] = null;
    state = checkVictory(state);
    return { state, success: true, negated: true, cardDef: knownCardDef };
  }

  // Apply the effect function
  const effectFn = piecieEffects[knownCardDef.effectId];
  if (typeof effectFn === 'function') {
    const handSizeBefore = state.players[playerId].hand.length;
    state = effectFn(state, playerId);
    // Dubbele Temminks: double-trigger
    if (flags.doubleNextPiecie?.[playerId]) {
      delete state._snelleFlags.doubleNextPiecie[playerId];
      state = effectFn(state, playerId);
      console.log('[ENGINE] Dubbele Temminks: effect triggered twice');
    }
    const cardsDrawnInAction = Math.max(0, state.players[playerId].hand.length - handSizeBefore);
    if (cardsDrawnInAction > 0) {
      state = applyPlaceEffectsOnDraw(state, playerId, cardsDrawnInAction);
    }
    console.log(`[ENGINE] Piecie activated: ${knownCardDef.name} (${knownCardDef.effectId})`);
  } else {
    console.warn(`[ENGINE] No effect function found for: ${knownCardDef.effectId}`);
  }

  // Track last played piecie for Gevalletje Klakkeloos
  state._lastPiecieEffect = { effectId: knownCardDef.effectId, byPlayer: playerId };

  // Track activation counters
  state.players[playerId].pieciesActivatedThisTurn = (state.players[playerId].pieciesActivatedThisTurn || 0) + 1;
  const actions = Array.isArray(state.players[playerId].actionsThisTurn)
    ? state.players[playerId].actionsThisTurn
    : [];
  if (!actions.includes('PIECIE_ACTIVATED')) {
    state.players[playerId].actionsThisTurn = [...actions, 'PIECIE_ACTIVATED'];
  }
  const primaryTag = knownCardDef.tags?.[0] || null;
  state.players[playerId].lastCardPlayedType = primaryTag;

  state = applyPlaceEffectsOnPiecieActivate(state, playerId, slotCardId);

  // Apply Momentum Factory bonus if active (first Piecie each turn gets +10 MP)
  if (state.activePlace === 'place_momentum_factory') {
    state = placeEffects.effect_momentum_factory(state);
  }

  // Piecie resolves and is discarded.
  player = state.players[playerId];
  if (!Array.isArray(player.discard)) player.discard = [];
  normalizePiecieSlots(player, 4);
  player.discard.unshift({ cardId: slotCardId, type: 'PIECIE' });
  player.piecieSlots[safeSlotIndex] = null;

  state = checkVictory(state);
  return { state, success: true, cardDef: knownCardDef };
}

function cardDefLookup(cardId) {
  return PIECIE_LOOKUP[cardId] || null;
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// playSnellie
// Plays a Snelle Piecie (instant) card from the active player's hand.
// Snelle Piecies can be played at any time, not just on your own turn.
// cardRef â€” the hand reference object { cardId, type }
// cardDef â€” full card definition from SNELLE_PIECIES data (has effectId)
// Returns { state, success, error? }
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playSnellie(gameState, playerId, cardRef, cardDef) {
  let state = JSON.parse(JSON.stringify(gameState));
  let player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  // Defensive normalization for synced multiplayer states
  if (!Array.isArray(player.hand)) player.hand = [];
  if (!Array.isArray(player.discard)) player.discard = [];

  // Remove from hand
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };
  player.hand.splice(handIndex, 1);

  // Apply the effect function
  const effectFn = snelleEffects[cardDef.effectId];
  if (typeof effectFn === 'function') {
    const handSizeBefore = state.players[playerId].hand.length;
    state = effectFn(state, playerId);
    const cardsDrawnInAction = Math.max(0, state.players[playerId].hand.length - handSizeBefore);
    if (cardsDrawnInAction > 0) {
      state = applyPlaceEffectsOnDraw(state, playerId, cardsDrawnInAction);
    }
    console.log(`[ENGINE] Snelle Piecie played: ${cardDef.name} (${cardDef.effectId})`);
  } else {
    console.warn(`[ENGINE] No snelle effect function found for: ${cardDef.effectId}`);
  }

  // Rebind player reference because effect functions return a cloned state
  player = state.players[playerId];
  if (!Array.isArray(player.hand)) player.hand = [];
  if (!Array.isArray(player.discard)) player.discard = [];

  // Gevalletje Klakkeloos: resolve copy flag — run the copied effect immediately
  const copyFlag = state._snelleFlags?.copyLastPiecie;
  if (copyFlag?.forPlayer === playerId && copyFlag.effectId) {
    const copiedFn = piecieEffects[copyFlag.effectId];
    if (typeof copiedFn === 'function') {
      state = copiedFn(state, playerId);
      console.log('[ENGINE] Gevalletje Klakkeloos: copied effect', copyFlag.effectId);
    }
    delete state._snelleFlags.copyLastPiecie;
  }

  // Move card to discard pile
  player.discard.unshift(cardRef);

  state = checkVictory(state);
  return { state, success: true };
}

export function playMosje(gameState, playerId, cardRef) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  if (!Array.isArray(player.hand)) player.hand = [];
  if (!Array.isArray(player.activeSlots)) player.activeSlots = [null, null];
  while (player.activeSlots.length < 2) player.activeSlots.push(null);

  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId && c.type === 'MOSJE');
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };

  const openSlotIndex = player.activeSlots.findIndex(slot => slot === null);
  if (openSlotIndex < 0) {
    return { state, success: false, error: 'You can have up to 2 Mosjes on the field' };
  }

  const [removed] = player.hand.splice(handIndex, 1);
  const mosjeDef = MOSJES.find(m => m.id === removed.cardId);
  if (!mosjeDef) {
    player.hand.splice(handIndex, 0, removed);
    return { state, success: false, error: 'Unknown Mosje definition' };
  }

  const saved = removed.savedState || {};
  const slot = createMosjeSlotFromDefinition(mosjeDef);
  if (typeof saved.mp === 'number') slot.mp = saved.mp;
  if (typeof saved.level === 'number') slot.level = saved.level;
  if (saved.traits && typeof saved.traits === 'object') slot.traits = { ...saved.traits };
  if (Array.isArray(saved.statusEffects)) slot.statusEffects = [...saved.statusEffects];
  if (typeof saved.abilityUsedThisTurn === 'boolean') slot.abilityUsedThisTurn = saved.abilityUsedThisTurn;

  player.activeSlots[openSlotIndex] = slot;

  state = checkVictory(state);
  return { state, success: true, slotIndex: openSlotIndex };
}

function createMosjeSlotFromDefinition(mosjeDef) {
  let mp = Number(mosjeDef.startMP || 0);
  if (mp > 0 && mp < 10) mp = 10;
  return {
    cardId: mosjeDef.id,
    name: mosjeDef.name,
    traits: { ...(mosjeDef.traits || {}) },
    mp,
    level: 0,
    isDefeated: false,
    statusEffects: [],
    abilityUsedThisTurn: false,
    immuneThisTurn: false,
    mpLostThisTurn: 0,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// useMosjeAbility
// Activates the unique ability of one of the player's Mosjes.
// mosjeId â€” the cardId of the Mosje whose ability to activate.
// Each Mosje can only use its ability once per turn (abilityUsedThisTurn).
// Returns { state, success, error? }
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useMosjeAbility(gameState, playerId, mosjeId) {
  const player = gameState.players[playerId];
  if (!player) return { state: gameState, success: false, error: 'Player not found' };

  const slotIndex = player.activeSlots.findIndex(s => s && s.cardId === mosjeId && !s.isDefeated);
  if (slotIndex < 0) return { state: gameState, success: false, error: 'Mosje not on field or is defeated' };

  const slot = player.activeSlots[slotIndex];

  const mosjeDef = MOSJES.find(m => m.id === mosjeId);
  if (!mosjeDef?.abilityId) {
    return { state: gameState, success: false, error: 'This Mosje has no ability' };
  }

  if (!mosjeDef.unlimitedAbility && slot.abilityUsedThisTurn) {
    return { state: gameState, success: false, error: 'Ability already used this turn' };
  }

  // MP cost check for abilities with a cost
  if (mosjeDef.abilityCost && mosjeDef.abilityCost > 0) {
    if (slot.mp < mosjeDef.abilityCost) {
      return { state: gameState, success: false, error: `Not enough MP (need ${mosjeDef.abilityCost})` };
    }
  }

  const fn = mosjeAbilities[mosjeDef.abilityId];
  if (typeof fn !== 'function') {
    return { state: gameState, success: false, error: `Ability not implemented: ${mosjeDef.abilityId}` };
  }

  // Dispatch — ability functions clone the state internally and return a new state
  let state = fn(gameState, playerId, mosjeId);

  // Mark ability as used this turn (skip for unlimited abilities)
  if (!mosjeDef.unlimitedAbility) {
    state.players[playerId].activeSlots[slotIndex].abilityUsedThisTurn = true;
  }

  state = checkVictory(state);
  return { state, success: true };
}

// ─────────────────────────────────────────────────────────────
// canPlayerActNow
// Returns true if the player is allowed to play/activate this card type.
// Snelle Piecies (instant cards) are ALWAYS allowed — any turn, any phase.
// All other cards require it to be the player's own turn.
// ─────────────────────────────────────────────────────────────
export function canPlayerActNow(gameState, playerId, cardType) {
  // Snelle Piecies are always allowed as interrupts
  if (cardType === 'SNELLE_PIECIE') return true;

  const isMyTurn = gameState.activePlayerId === playerId;

  if (!isMyTurn) {
    console.log(`[ENGINE] ${playerId} attempted to act out of turn — blocked`);
    return false;
  }

  const phase = gameState.currentPhase || 'MAIN';

  if (cardType === 'QUEST') {
    if (phase !== 'QUEST' && phase !== 'MAIN') {
      console.log(`[ENGINE] Quest can only be attempted in MAIN/QUEST phase — blocked`);
      return false;
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// Place trigger dispatch helpers
// Called by startTurn / endTurn / playPiecie / quest resolution / draw.
// Each only fires when the active Place's trigger matches.
// ─────────────────────────────────────────────────────────────

export function applyPlaceEffectsOnEnd(gameState) {
  let state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  state = placeEffects.resolvePlaceEffect(state, 'END_PHASE');
  // Increment turns-active counter each end phase
  state.activePlaceTurnsActive = (state.activePlaceTurnsActive || 0) + 1;
  console.log(`[ENGINE] End-phase Place effect resolved (turns active: ${state.activePlaceTurnsActive})`);
  return state;
}

export function applyPlaceEffectsOnStart(gameState, playerId) {
  let state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  state = placeEffects.resolvePlaceEffect(state, 'START_PHASE', { playerId });
  return state;
}

export function applyPlaceEffectsOnDraw(gameState, playerId, cardsDrawn) {
  let state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  state = placeEffects.resolvePlaceEffect(state, 'ON_DRAW', { playerId, cardsDrawn });
  return state;
}

export function applyPlaceEffectsOnQuest(gameState, playerId, questCard, didSucceed) {
  let state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  const player = state.players[playerId];
  const slotIndex = player?.activeSlots.findIndex(s => s && !s.isDefeated) ?? -1;
  const mosje = slotIndex >= 0 ? player.activeSlots[slotIndex] : null;
  const questsCompletedThisTurn = player?.questsCompletedThisTurn || 0;
  state = placeEffects.resolvePlaceEffect(state, 'ON_QUEST', {
    playerId, questCard, didSucceed, mosje, questsCompletedThisTurn,
  });
  return state;
}

export function applyPlaceEffectsOnPiecieActivate(gameState, playerId, piecieCardId) {
  let state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  state = placeEffects.resolvePlaceEffect(state, 'ON_PIECIE_ACTIVATE', { playerId, piecieCardId });
  return state;
}

export function applyPlaceEffectsOnWelloe(gameState, playerId, newMosjeSlotIndex) {
  let state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  state = placeEffects.resolvePlaceEffect(state, 'ON_WELLOE', { playerId, newMosjeSlotIndex });
  return state;
}

// ─────────────────────────────────────────────────────────────
// playPlace
// Plays a Place card from the active player's hand onto the shared field.
// Destroys any currently active Place first (moves it to sharedPlaceDiscard).
// Applies PASSIVE effects immediately after placement.
// cardRef — the hand reference object { cardId, type }
// cardDef — full card definition from PLACES data (has trigger, effectId)
// Returns { state, success, error? }
// ─────────────────────────────────────────────────────────────
export function playPlace(gameState, playerId, cardRef, cardDef) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  if (state.activePlace) {
    return { state, success: false, error: 'A Place is already active. Destroy it first.' };
  }

  // Defensive normalization
  if (!Array.isArray(player.hand)) player.hand = [];
  if (!Array.isArray(player.discard)) player.discard = [];

  // Remove from hand
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };
  player.hand.splice(handIndex, 1);

  // setActivePlace handles destroying the old one + setting the new one
  state = setActivePlace(state, cardRef.cardId, playerId);

  // Apply PASSIVE effects immediately on placement
  if (cardDef.trigger === 'PASSIVE') {
    state = placeEffects.resolvePlaceEffect(state, 'PASSIVE');
  }

  console.log(`[ENGINE] Place played: ${cardDef.name} by ${playerId}`);
  state = checkVictory(state);
  return { state, success: true };
}
