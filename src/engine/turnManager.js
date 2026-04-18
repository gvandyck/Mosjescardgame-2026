// turnManager.js â€” Controls the 4 turn phases: DRAW â†’ MAIN â†’ QUEST â†’ END
// Coordinates which engine functions run in which order.
// The UI calls these functions; they return the updated game state.

import { drawCards } from './deckEngine.js';
import { gainMP, applyStatusEffectMP, getTotalMPForPlayer } from './mpManager.js';
import { checkVictory } from './victoryChecker.js';
import { getAllPlayerIds } from './gameState.js';
import * as placeEffects from '../abilities/placeEffects.js';
import * as piecieEffects from '../abilities/piecieEffects.js';
import * as snelleEffects from '../abilities/snelleEffects.js';
import * as mosjeAbilities from '../abilities/mosjeAbilities.js';
import { MOSJES } from '../data/mosjes.js';

console.log('[ENGINE] turnManager.js loaded');

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
  activePlayer.hasRerolledDieThisTurn = false;
  activePlayer.pieciesPlayedThisTurn = 0;
  activePlayer.lastCardPlayedType = null;
  activePlayer.instantPiecieThisTurn = false;
  activePlayer.chainReactionActive = false;
  activePlayer.abilityDoubleTrigger = false;
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

  // DRAW PHASE â€” draw 1 card
  state = phaseDrawCard(state, playerId);

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

  // END PHASE â€” fire active Place effects
  if (state.activePlace) {
    // place card IDs are like 'place_the_gym'; effect functions are 'effect_the_gym'
    const effectKey = 'effect_' + state.activePlace.replace(/^place_/, '');
    if (typeof placeEffects[effectKey] === 'function') {
      state = placeEffects[effectKey](state, playerId);
      console.log(`[ENGINE] Place effect fired: ${effectKey}`);
    }
  }

  // END PHASE â€” tick down status effects on all active Mosjes for all players
  const allPlayerIds = getAllPlayerIds(state);
  for (const pid of allPlayerIds) {
    const player = state.players[pid];
    player.activeSlots.forEach((slot, index) => {
      if (slot && !slot.isDefeated && slot.statusEffects.length > 0) {
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

  if (player.hasAttemptedQuestThisTurn) {
    console.log('[ENGINE] Quest already attempted this turn');
    return { state, questCard: null };
  }

  if (state.sharedGeneralQuestDeck.length === 0) {
    console.log('[ENGINE] General Quest deck is empty');
    return { state, questCard: null };
  }

  const questCard = state.sharedGeneralQuestDeck.shift(); // take from top
  console.log('[ENGINE] General Quest drawn:', questCard.cardId);

  player.hasAttemptedQuestThisTurn = true;

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

  if (player.hasAttemptedQuestThisTurn) {
    console.log('[ENGINE] Quest already attempted this turn');
    return { state, questCard: null, eligible: false };
  }

  const cardIndex = player.hand.findIndex(c => c.cardId === questCardId);
  if (cardIndex === -1) {
    console.log('[ENGINE] Personal Quest card not in hand:', questCardId);
    return { state, questCard: null, eligible: false };
  }

  const [questCard] = player.hand.splice(cardIndex, 1);
  player.hasAttemptedQuestThisTurn = true;
  console.log('[ENGINE] Personal Quest played from hand:', questCardId);

  return { state, questCard, eligible: true };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// playPiecie
// Plays a Piecie card from the active player's hand.
// Removes the card from hand, applies its effect, moves it to discard.
// cardRef â€” the hand reference object { cardId, type }
// cardDef â€” full card definition from PIECIES data (has effectId, tags)
// Returns { state, success, error? }
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playPiecie(gameState, playerId, cardRef, cardDef) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  // Check The Void restriction (blocks RESTORE and FOOD Piecies)
  if (state.activePlace === 'place_the_void') {
    const blocked = ['RESTORE', 'FOOD'];
    if (cardDef.tags?.some(t => blocked.includes(t))) {
      console.log('[ENGINE] The Void blocks RESTORE/FOOD Piecies');
      return { state, success: false, error: 'The Void blocks RESTORE and FOOD Piecies' };
    }
  }

  // Remove from hand
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };
  player.hand.splice(handIndex, 1);

  // Apply the effect function
  const effectFn = piecieEffects[cardDef.effectId];
  if (typeof effectFn === 'function') {
    state = effectFn(state, playerId);
    console.log(`[ENGINE] Piecie played: ${cardDef.name} (${cardDef.effectId})`);
  } else {
    console.warn(`[ENGINE] No effect function found for: ${cardDef.effectId}`);
  }

  // Track play counters
  state.players[playerId].pieciesPlayedThisTurn = (state.players[playerId].pieciesPlayedThisTurn || 0) + 1;
  const primaryTag = cardDef.tags?.[0] || null;
  state.players[playerId].lastCardPlayedType = primaryTag;

  // Apply Momentum Factory bonus if active (first Piecie each turn gets +10 MP)
  if (state.activePlace === 'place_momentum_factory') {
    state = placeEffects.effect_momentum_factory(state);
  }

  // Move card to discard pile
  state.players[playerId].discard.unshift(cardRef);

  state = checkVictory(state);
  return { state, success: true };
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
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  // Remove from hand
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };
  player.hand.splice(handIndex, 1);

  // Apply the effect function
  const effectFn = snelleEffects[cardDef.effectId];
  if (typeof effectFn === 'function') {
    state = effectFn(state, playerId);
    console.log(`[ENGINE] Snelle Piecie played: ${cardDef.name} (${cardDef.effectId})`);
  } else {
    console.warn(`[ENGINE] No snelle effect function found for: ${cardDef.effectId}`);
  }

  // Move card to discard pile
  state.players[playerId].discard.unshift(cardRef);

  state = checkVictory(state);
  return { state, success: true };
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
  if (slot.abilityUsedThisTurn) {
    return { state: gameState, success: false, error: 'Ability already used this turn' };
  }

  const mosjeDef = MOSJES.find(m => m.id === mosjeId);
  if (!mosjeDef?.abilityId) {
    return { state: gameState, success: false, error: 'This Mosje has no ability' };
  }

  const fn = mosjeAbilities[mosjeDef.abilityId];
  if (typeof fn !== 'function') {
    return { state: gameState, success: false, error: `Ability not implemented: ${mosjeDef.abilityId}` };
  }

  // Dispatch â€” ability functions clone the state internally and return a new state
  let state = fn(gameState, playerId);

  // Mark ability as used for this turn
  state.players[playerId].activeSlots[slotIndex].abilityUsedThisTurn = true;

  state = checkVictory(state);
  return { state, success: true };
}
