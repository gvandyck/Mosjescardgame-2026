// turnManager.js â€” Controls the 4 turn phases: DRAW â†’ MAIN â†’ QUEST â†’ END
// Coordinates which engine functions run in which order.
// The UI calls these functions; they return the updated game state.

import { drawCards, shuffleDeck } from './deckEngine.js';
import { gainMP, applyStatusEffectMP, getTotalMPForPlayer } from './mpManager.js';
import { checkVictory, markMosjeDefeated } from './victoryChecker.js';
import { getAllPlayerIds, setActivePlace, destroyActivePlace, clearReturnedMosjesAtTurnEnd } from './gameState.js';
import * as placeEffects from '../abilities/placeEffects.js';
import * as piecieEffects from '../abilities/piecieEffects.js';
import * as snelleEffects from '../abilities/snelleEffects.js';
import * as mosjeAbilities from '../abilities/mosjeAbilities.js';
import { MOSJES } from '../data/mosjes.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';

console.log('[ENGINE] turnManager.js loaded');

const PIECIE_LOOKUP = Object.fromEntries(PIECIES.map(card => [card.id, card]));
const PLACE_LOOKUP = Object.fromEntries(PLACES.map(card => [card.id, card]));

function normalizePiecieSlots(player, slotCount = 4) {
  let source;
  if (Array.isArray(player?.piecieSlots)) {
    source = player.piecieSlots;
  } else if (player?.piecieSlots && typeof player.piecieSlots === 'object') {
    // Firebase RTDB strips null values from arrays, returning an object with
    // integer keys instead (e.g. [null, {cardId:'x'}, null] → {"1":{cardId:'x'}}).
    // Reconstruct the full-length array so no cards are silently lost.
    source = Array.from({ length: slotCount }, (_, i) => player.piecieSlots[i] ?? null);
  } else {
    source = [];
  }
  const normalized = source.slice(0, slotCount).map(slot => (slot == null ? null : slot));
  while (normalized.length < slotCount) normalized.push(null);
  player.piecieSlots = normalized;
}

// Ronald Strategic Insight: a hand card locked by an opponent cannot be played.
function isHandCardLocked(gameState, playerId, cardRef) {
  const playedId = cardRef?.cardId ?? cardRef;
  return gameState.players?.[playerId]?._lockedCard?.cardId === playedId;
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

  // Deck-out penalty: skip this entire turn (per D-06)
  if (activePlayer.skipNextTurn === true) {
    activePlayer.skipNextTurn = false;
    console.log(`[ENGINE] startTurn: ${playerId} skips turn (deck-out penalty)`);
    const playerIds = getAllPlayerIds(state);
    const currentIndex = playerIds.indexOf(playerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    state.activePlayerId = playerIds[nextIndex];
    if (nextIndex === 0) {
      state.turnNumber += 1;
      console.log(`[ENGINE] Round complete during skip. Turn ${state.turnNumber} begins.`);
    }
    return state;
  }

  activePlayer.questsCompletedThisTurn = 0;
  activePlayer.questsAttemptedThisTurn = 0;
  activePlayer.hasAttemptedQuestThisTurn = false;
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
  activePlayer.attackPieciePlayedThisTurn = false;

  // Dead-flag turn hygiene (Phase 18): clear stale single-turn effect flags so a
  // flag set but never triggered does not leak into a later turn. These live on
  // `state` (global), not on activePlayer.
  delete state._snelleBlocked;
  delete state._battleConcertActive;
  delete state._rerollGranted;

  // Phase 19 — Ronald Strategic Insight hygiene:
  // tick the cooldown on the starting player's slots
  for (const s of activePlayer.activeSlots) {
    if (s && typeof s.strategicInsightCooldown === 'number' && s.strategicInsightCooldown > 0) {
      s.strategicInsightCooldown -= 1;
    }
  }
  // a lock expires when the player who set it begins their next turn
  for (const pid of Object.keys(state.players)) {
    if (state.players[pid]._lockedCard?.byPlayer === playerId) {
      delete state.players[pid]._lockedCard;
    }
  }

  for (const slot of activePlayer.activeSlots) {
    if (slot) {
      slot.abilityUsedThisTurn = false;
      slot.immuneThisTurn = false;
      slot.mpLostThisTurn = 0;
      // MP Adjuster: reverse the temporary delta applied last turn
      if (slot._mpAdjustDelta !== undefined) {
        slot.mp = Math.max(0, slot.mp - slot._mpAdjustDelta);
        console.log(`[ENGINE] MP Adjuster: reverted ${slot._mpAdjustDelta} MP delta for ${playerId}`);
        delete slot._mpAdjustDelta;
      }
    }
  }

  // Welloe Force: decrement turn counter when the card owner's turn starts
  if (state._welloeForceActive?.ownerId === playerId) {
    state._welloeForceActive.turnsRemaining -= 1;
    if (state._welloeForceActive.turnsRemaining <= 0) {
      delete state._welloeForceActive;
      console.log('[ENGINE] Welloe Force: 3-turn redirect expired');
    } else {
      console.log(`[ENGINE] Welloe Force: ${state._welloeForceActive.turnsRemaining} turn(s) remaining`);
    }
  }

  // Momentum Domination check happens at TURN START
  state.momentumCheckPhase = true;
  state = checkVictory(state);
  state.momentumCheckPhase = false;
  if (state.status === 'FINISHED') return state;

  // START PHASE — fire active Place effects (START_PHASE trigger only)
  state = applyPlaceEffectsOnStart(state, playerId);

  // TURN TRICKLE — every active Mosje of the active player gains +10 MP at turn start
  const tricklePlayer = state.players[playerId];
  for (let i = 0; i < tricklePlayer.activeSlots.length; i++) {
    const slot = tricklePlayer.activeSlots[i];
    if (slot && !slot.isDefeated) {
      state = gainMP(state, playerId, i, 10);
      console.log(`[ENGINE] Turn trickle: ${slot.name} +10 MP → ${state.players[playerId].activeSlots[i].mp} MP`);
    }
  }

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
export function phaseDrawCard(gameState, playerId, count = 1, isOpponentTriggered = false) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];

  // negateNextSearch: Jammertje Gepakt flag — negate opponent-triggered search/draw only.
  // Regular turn draw (isOpponentTriggered=false) is NOT negated.
  if (isOpponentTriggered) {
    const oppId = Object.keys(state.players).find(id => id !== playerId);
    if (oppId && state._snelleFlags?.negateNextSearch?.[oppId]) {
      delete state._snelleFlags.negateNextSearch[oppId];
      console.log('[ENGINE] Jammertje Gepakt: opponent search/draw negated for', playerId);
      return state;
    }
  }

  if (player.deck.length === 0) {
    if (player.discard.length === 0) {
      console.log('[ENGINE] Draw phase: deck AND discard empty — no draw, no penalty');
      return state;
    }
    // Reshuffle discard into deck (deck-out rule per D-06)
    player.deck = shuffleDeck([...player.discard]);
    player.discard = [];
    const { drawn, remaining } = drawCards(player.deck, 1);
    player.deck = remaining;
    player.hand.push(...drawn);
    player.drawsThisTurn = (player.drawsThisTurn || 0) + drawn.length;
    player.skipNextTurn = true;
    console.log(`[ENGINE] Draw phase: deck-out — reshuffled ${player.deck.length + 1} cards, drew ${drawn.length}, skipNextTurn set`);
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

  // Sweep Snelle Piecies and persistent regular Piecies from field to discard at end of turn
  normalizePiecieSlots(state.players[playerId], 4);
  for (let i = 0; i < state.players[playerId].piecieSlots.length; i++) {
    const slot = state.players[playerId].piecieSlots[i];
    // Call of the Welloes persistence: do not sweep this Piecie while its linked Mosje is alive (D-16)
    if (slot?.cardId === 'piecie_call_of_welloes' && slot.linkedMosjeCardId) {
      const linkedAlive = state.players[playerId].activeSlots.some(
        s => s?.cardId === slot.linkedMosjeCardId && s?.summonedByPiecie === 'piecie_call_of_welloes'
      );
      if (linkedAlive) continue;
    }
    if (slot?.type === 'SNELLE_PIECIE') {
      if (!Array.isArray(state.players[playerId].discard)) state.players[playerId].discard = [];
      state.players[playerId].discard.push(slot.cardId);
      state.players[playerId].piecieSlots[i] = null;
      console.log(`[ENGINE] Snelle Piecie swept to discard: ${slot.cardId}`);
    } else if (slot?.persistUntilEoT === true) {
      if (!Array.isArray(state.players[playerId].discard)) state.players[playerId].discard = [];
      state.players[playerId].discard.push(slot.cardId);
      state.players[playerId].piecieSlots[i] = null;
      console.log(`[ENGINE] Persistent Piecie swept to discard at EoT: ${slot.cardId}`);
    }
  }
  // Call of the Welloes: if anchor Piecie has left play, defeat the summoned Mosje (D-12/D-14)
  for (let i = 0; i < state.players[playerId].activeSlots.length; i++) {
    const aSlot = state.players[playerId].activeSlots[i];
    if (aSlot?.summonedByPiecie === 'piecie_call_of_welloes') {
      const piecieStillOnField = state.players[playerId].piecieSlots.some(
        p => p?.cardId === 'piecie_call_of_welloes'
      );
      if (!piecieStillOnField) {
        state = markMosjeDefeated(state, playerId, i);
        console.log('[ENGINE] endTurn sweep: summoned Mosje defeated — anchor Piecie no longer on field');
      }
    }
  }

  // Reset questPrepBonus at end of turn — same lifecycle as persistUntilEoT Piecies (BUG-05)
  state.players[playerId].questPrepBonus = 0;

  // Leipe Swap: at the end of the swapper's turn, swap the two slots' current MP back.
  if (state._leipeSwap && state._leipeSwap.byPlayerId === playerId) {
    const rec = state._leipeSwap;
    const a = state.players[rec.byPlayerId]?.activeSlots?.[rec.yourSlotIndex];
    const b = state.players[rec.oppId]?.activeSlots?.[rec.oppSlotIndex];
    if (a && b) {
      const tmp = a.mp;
      a.mp = b.mp;
      b.mp = tmp;
      console.log('[PIECIE] Leipe Swap: end-of-turn swap-back');
    }
    delete state._leipeSwap;
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

  const questHavenActive = state.activePlace === 'place_quest_haven';
  const maxQuestsThisTurn = questHavenActive ? 2 : 1;
  const questsAttempted = player.questsAttemptedThisTurn ?? (player.hasAttemptedQuestThisTurn ? 1 : 0);

  if (questsAttempted >= maxQuestsThisTurn) {
    console.log('[ENGINE] Quest already attempted the maximum times this turn');
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

  const questCard = state.sharedGeneralQuestDeck.shift();
  console.log('[ENGINE] General Quest drawn:', questCard.cardId);

  player.questsAttemptedThisTurn = questsAttempted + 1;
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

  const questHavenActive = state.activePlace === 'place_quest_haven';
  const maxQuestsThisTurn = questHavenActive ? 2 : 1;
  const questsAttempted = player.questsAttemptedThisTurn ?? (player.hasAttemptedQuestThisTurn ? 1 : 0);

  if (questsAttempted >= maxQuestsThisTurn) {
    console.log('[ENGINE] Quest already attempted the maximum times this turn');
    return { state, questCard: null, eligible: false };
  }

  const cardIndex = player.hand.findIndex(c => c.cardId === questCardId);
  if (cardIndex === -1) {
    console.log('[ENGINE] Personal Quest card not in hand:', questCardId);
    return { state, questCard: null, eligible: false };
  }

  const [questCard] = player.hand.splice(cardIndex, 1);
  player.discard.push(questCard.cardId);
  player.questsAttemptedThisTurn = questsAttempted + 1;
  player.hasAttemptedQuestThisTurn = true;
  console.log('[ENGINE] Personal Quest played from hand and moved to discard:', questCardId);

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

  if (isHandCardLocked(state, playerId, cardRef)) {
    return { state, success: false, error: 'That card is locked by Ronald Strategic Insight — you cannot play it this turn.' };
  }

  // Defensive normalization for synced multiplayer states
  normalizePiecieSlots(player, 4);
  if (!Array.isArray(player.hand)) player.hand = [];
  if (!Array.isArray(player.discard)) player.discard = [];

  // Remove from hand
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };

  // Check if field already has 4 Piecies/Places (count activePlace as 1 slot, but only if player played it)
  const filledSlots = player.piecieSlots.filter(slot => slot !== null && slot !== undefined).length;
  const activePlaceCount = (state.activePlace && state.activePlacePlayedBy === playerId) ? 1 : 0;
  const totalSlots = filledSlots + activePlaceCount;
  if (totalSlots >= 4) {
    return { state, success: false, error: 'You can place up to 4 Piecies/Places total' };
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
  if (cardDef?.subtype === 'ATTACK') {
    state.players[playerId].attackPieciePlayedThisTurn = true;
  }


  state = checkVictory(state);
  return { state, success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// playPersonalQuest
// Places a Personal Quest card face-down on the field (like a Piecie).
// Player must wait one turn before activating (attempting) it.
// ─────────────────────────────────────────────────────────────────────────────
export function playPersonalQuest(gameState, playerId, cardRef) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  if (state.activePlayerId !== playerId) {
    return { state, success: false, error: 'You can only place quests on your own turn' };
  }

  normalizePiecieSlots(player, 4);
  if (!Array.isArray(player.hand)) player.hand = [];

  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };

  const filledSlots = player.piecieSlots.filter(s => s !== null).length;
  const activePlaceCount = (state.activePlace && state.activePlacePlayedBy === playerId) ? 1 : 0;
  if (filledSlots + activePlaceCount >= 4) {
    return { state, success: false, error: 'No slot available — field is full' };
  }

  player.hand.splice(handIndex, 1);
  const emptySlot = player.piecieSlots.findIndex(s => s === null);
  player.piecieSlots[emptySlot] = {
    cardId: cardRef.cardId,
    type: 'QUEST',
    faceDown: true,
    activated: false,
    playedOnTurn: state.turnNumber,
    canActivateOnTurn: state.turnNumber + 1,
  };

  console.log(`[ENGINE] Personal Quest placed face-down: ${cardRef.cardId} by ${playerId}`);
  return { state, success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// activatePersonalQuest
// Removes the quest from its piecie slot and marks the attempt so the UI
// can run the dice-roll flow.
// ─────────────────────────────────────────────────────────────────────────────
export function activatePersonalQuest(gameState, playerId, slotIndex) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  if (state.activePlayerId !== playerId) {
    return { state, success: false, error: 'You can only activate quests on your own turn' };
  }

  normalizePiecieSlots(player, 4);
  const slot = player.piecieSlots[slotIndex];
  if (!slot || slot.type !== 'QUEST') {
    return { state, success: false, error: 'No Personal Quest in that slot' };
  }

  const canActivateOnTurn = Number.isFinite(slot.canActivateOnTurn) ? slot.canActivateOnTurn : 0;
  if (state.turnNumber < canActivateOnTurn) {
    return { state, success: false, error: 'This Quest can be activated starting next turn' };
  }

  const questHavenActive = state.activePlace === 'place_quest_haven';
  const maxQuestsThisTurn = questHavenActive ? 2 : 1;
  const questsAttempted = player.questsAttemptedThisTurn ?? 0;
  if (questsAttempted >= maxQuestsThisTurn) {
    return { state, success: false, error: 'You have already attempted a quest this turn' };
  }

  const questCardId = slot.cardId;
  player.piecieSlots[slotIndex] = null;
  if (!Array.isArray(player.discard)) player.discard = [];
  player.discard.push(questCardId);
  player.questsAttemptedThisTurn = questsAttempted + 1;
  player.hasAttemptedQuestThisTurn = true;

  console.log(`[ENGINE] Personal Quest activated from field: ${questCardId} by ${playerId}`);
  return { state, success: true, questCardId };
}

export function activatePlace(gameState, playerId, slotIndex) {
  let state = JSON.parse(JSON.stringify(gameState));
  let player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  if (state.activePlayerId !== playerId) {
    return { state, success: false, error: 'You can only activate Places on your own turn' };
  }

  normalizePiecieSlots(player, 4);
  const slot = player.piecieSlots[slotIndex];
  if (!slot || slot.type !== 'PLACE') {
    return { state, success: false, error: 'No Place in this slot' };
  }

  if (slot.activated) {
    return { state, success: false, error: 'This Place is already activated' };
  }

  const canActivateOnTurn = Number.isFinite(slot.canActivateOnTurn)
    ? slot.canActivateOnTurn
    : 0;
  if (state.turnNumber < canActivateOnTurn) {
    return { state, success: false, error: `This Place cannot be activated until turn ${canActivateOnTurn}` };
  }

  const cardId = slot.cardId;
  const cardDef = PLACE_LOOKUP[cardId];
  if (!cardDef) return { state, success: false, error: 'Card definition not found' };

  // Remove from piecieSlots
  player.piecieSlots[slotIndex] = null;

  // Set as active Place
  state = setActivePlace(state, cardId, playerId);

  // Apply PASSIVE effects on activation
  if (cardDef.trigger === 'PASSIVE') {
    state = placeEffects.resolvePlaceEffect(state, 'PASSIVE');
  }

  console.log(`[ENGINE] Place activated: ${cardDef.name} by ${playerId}`);
  state = checkVictory(state);
  return { state, success: true, cardDef };
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
  console.log(`[ENGINE] activatePiecie called: player=${playerId} slotIndex=${safeSlotIndex} turn=${state.turnNumber}`);
  console.log(`[ENGINE] piecieSlots before activation:`, player.piecieSlots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | '));
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

  // Jeffrey The Strongman: cannot use FOOD or RESTORE Piecies
  const jeffreyActive = player.activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_jeffrey');
  if (jeffreyActive) {
    const blocked = ['FOOD', 'RESTORE'];
    if (knownCardDef.tags?.some(t => blocked.includes(t))) {
      console.log('[ENGINE] Jeffrey The Strongman blocks FOOD/RESTORE Piecies');
      return { state, success: false, error: 'Jeffrey The Strongman cannot use FOOD or RESTORE Piecies' };
    }
  }

  // Dingetje Toch wildcard: if state._dingetjeTochActive is true, the UI layer must bypass
  // any single failing trait/type requirement before calling activatePiecie, then clear the flag.
  // Consumption point: in main.js handleActivatePiecie(), before the activatePiecie() call,
  // check state._dingetjeTochActive — if set, skip the single failing requirement check and
  // delete state._dingetjeTochActive before passing state to activatePiecie.
  // STUB-07: UI-side implementation deferred to UI wiring phase.

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
    player.discard.push(slotCardId);
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
    player.discard.push(slotCardId);
    player.piecieSlots[safeSlotIndex] = null;
    state = checkVictory(state);
    return { state, success: true, negated: true, cardDef: knownCardDef };
  }

  // Apply the effect function
  const effectFn = piecieEffects[knownCardDef.effectId];
  const handSizeBeforeEffect = state.players[playerId].hand.length;
  if (typeof effectFn === 'function') {
    state = effectFn(state, playerId);
    // STUB-05 (doubleNextPiecie / Double Trigger) — IMPLEMENTED. Flag is set by
    // effect_snelle_dubbele_temminks in snelleEffects.js and consumed here.
    // Dubbele Temminks: double-trigger
    if (flags.doubleNextPiecie?.[playerId]) {
      delete state._snelleFlags.doubleNextPiecie[playerId];
      state = effectFn(state, playerId);
      console.log('[ENGINE] Dubbele Temminks: effect triggered twice');
    }
    console.log(`[ENGINE] Piecie activated: ${knownCardDef.name} (${knownCardDef.effectId})`);
  } else {
    console.warn(`[ENGINE] No effect function found for: ${knownCardDef.effectId}`);
  }

  // Fire ON_DRAW place effect for cards drawn by this Piecie (e.g. Bank Chilling)
  const piecieCardsDrawn = Math.max(0, state.players[playerId].hand.length - handSizeBeforeEffect);
  if (piecieCardsDrawn > 0) {
    state = applyPlaceEffectsOnDraw(state, playerId, piecieCardsDrawn);
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

  // Piecie resolves — persistent cards stay in slot until end-of-turn sweep.
  player = state.players[playerId];
  if (!Array.isArray(player.discard)) player.discard = [];
  normalizePiecieSlots(player, 4);
  if (knownCardDef.persistUntilEndOfTurn === true) {
    // Mark slot as persistent — will be swept to discard in endTurn()
    player.piecieSlots[safeSlotIndex].persistUntilEoT = true;
    player.piecieSlots[safeSlotIndex].faceDown = false;
    console.log(`[ENGINE] Piecie persisting until EoT: ${knownCardDef.name}`);
  } else {
    player.discard.push(slotCardId);
    player.piecieSlots[safeSlotIndex] = null;
  }
  console.log(`[ENGINE] piecieSlots after activation:`, player.piecieSlots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | '));

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

  if (isHandCardLocked(state, playerId, cardRef)) {
    return { state, success: false, error: 'That card is locked by Ronald Strategic Insight — you cannot play it this turn.' };
  }

  // Those Eyelashes: this player's Snelles are blocked this turn
  if (state._snelleBlocked === playerId) {
    return { state, success: false, error: 'Your Snelle Piecies are blocked this turn (Those Eyelashes).' };
  }

  // Defensive normalization for synced multiplayer states
  normalizePiecieSlots(player, 4);
  if (!Array.isArray(player.hand)) player.hand = [];

  // Check if all 4 Piecie/Place slots are full — cannot play Snelle Piecie if board is full
  const filledSlots = player.piecieSlots.filter(slot => slot !== null && slot !== undefined).length;
  const activePlaceCount = state.activePlace ? 1 : 0;
  const totalSlots = filledSlots + activePlaceCount;
  if (totalSlots >= 4) {
    return { state, success: false, error: 'Cannot play Snelle Piecie — all Piecie/Place slots are full.' };
  }
  if (!Array.isArray(player.discard)) player.discard = [];

  // Remove from hand and place face-up in a piecie slot (swept to discard at end of turn)
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };
  const [playedCard] = player.hand.splice(handIndex, 1);

  normalizePiecieSlots(player, 4);
  const snelleSlot = player.piecieSlots.findIndex(s => s === null);
  if (snelleSlot >= 0) {
    player.piecieSlots[snelleSlot] = {
      cardId: playedCard.cardId,
      type: 'SNELLE_PIECIE',
      faceDown: false,
      activated: true,
      playedOnTurn: state.turnNumber,
    };
  } else {
    player.discard.push(playedCard.cardId);
  }

  // Apply the effect function
  const effectFn = snelleEffects[cardDef.effectId];
  if (typeof effectFn === 'function') {
    state = effectFn(state, playerId);
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

  state = checkVictory(state);
  return { state, success: true };
}

export function confirmCallOfWelloes(gameState, playerId, mosjeCardId) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };
  if (!Array.isArray(player.activeSlots)) player.activeSlots = [null, null];
  const openSlot = player.activeSlots.findIndex(s => s === null);
  if (openSlot < 0) return { state, success: false, error: 'No free slot' };
  if (!Array.isArray(player.welloe)) return { state, success: false, error: 'No Welloe pile' };
  const welloeIdx = player.welloe.findIndex(w => w.cardId === mosjeCardId);
  if (welloeIdx < 0) return { state, success: false, error: 'Mosje not in Welloe pile' };

  const [record] = player.welloe.splice(welloeIdx, 1);
  const mosjeDef = MOSJES.find(m => m.id === record.cardId);
  const slot = mosjeDef ? createMosjeSlotFromDefinition(mosjeDef) : { ...record };
  // Fresh summon at Level 1, 50 MP — NOT restored from welloe record (D-05/D-06)
  slot.mp = 50;
  slot.level = 1;
  // traits and statusEffects are not restored — fresh summon per D-05/D-06
  slot.summonedByPiecie = 'piecie_call_of_welloes';
  slot.isDefeated = false;

  player.activeSlots[openSlot] = slot;
  const piecieSlotIdx = player.piecieSlots
    ? player.piecieSlots.findIndex(s => s?.cardId === 'piecie_call_of_welloes')
    : -1;
  if (piecieSlotIdx >= 0) {
    player.piecieSlots[piecieSlotIdx].linkedMosjeCardId = mosjeCardId;
  }
  console.log(`[ENGINE] confirmCallOfWelloes: summoned ${slot.name} at 50 MP / Lvl 1`);
  return { state, success: true, slotIndex: openSlot };
}

export function playMosje(gameState, playerId, cardRef) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  if (isHandCardLocked(state, playerId, cardRef)) {
    return { state, success: false, error: 'That card is locked by Ronald Strategic Insight — you cannot play it this turn.' };
  }

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
    subtype: mosjeDef.subtype,
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
// NOTE: the engine does NOT enforce abilityCost before calling fn(). Each individual
// ability function is responsible for checking/deducting its own cost. The UI
// cantAffordAbility display is the primary guard against insufficient-MP activations.
// UI must also check dierenasielActive before disabling PET Mosje abilities (STUB-09).
export function useMosjeAbility(gameState, playerId, mosjeId) {
  const player = gameState.players[playerId];
  if (!player) return { state: gameState, success: false, error: 'Player not found' };

  const slotIndex = player.activeSlots.findIndex(s => s && s.cardId === mosjeId && !s.isDefeated);
  if (slotIndex < 0) return { state: gameState, success: false, error: 'Mosje not on field or is defeated' };

  const slot = player.activeSlots[slotIndex];

  // Dierenasiel 0-MP PET cost-waiver: when Dierenasiel place is active, PET-tagged
  // ability activations are allowed even at 0 MP. The individual ability function
  // must not throw for 0 MP in this case.
  // STUB-09: engine-level guard documented here. UI cantAffordAbility must also check
  // dierenasielActive before displaying the disabled state for PET Mosjes (UI phase).
  const dierenasielWaiver = gameState.dierenasielActive === true;
  if (dierenasielWaiver) {
    console.log('[ENGINE] Dierenasiel: 0-MP PET ability activation allowed for', mosjeId);
  }

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
  // Wrap in try/catch: some abilities require pending targets (e.g. Binti’s discard) that
  // are not present when called without UI interaction (e.g. from the bot driver).
  // In that case, treat the ability as unusable rather than crashing.
  // Synergy Chamber: ability activation costs 5 fewer MP when place_synergy_chamber is active.
  // Pre-adjust the Mosje MP so individual ability functions see the reduced effective cost.
  const synergyDiscount = placeEffects.getSynergyChambercostReduction(gameState);
  let stateForAbility = gameState;
  if (synergyDiscount > 0 && mosjeDef.abilityCost > 0) {
    stateForAbility = JSON.parse(JSON.stringify(gameState));
    const s = stateForAbility.players[playerId].activeSlots[slotIndex];
    s.mp += synergyDiscount; // grant the discount pre-payment
    console.log('[ENGINE] Synergy Chamber: ability cost reduced by', synergyDiscount, 'for', mosjeId);
  }

  let state;
  try {
    state = fn(stateForAbility, playerId, mosjeId);
  } catch (err) {
    console.warn(`[ENGINE] useMosjeAbility: ability ${mosjeDef.abilityId} threw — needs UI input:`, err.message);
    return { state: gameState, success: false, error: err.message };
  }

  // Mark ability as used — skip for unlimited-use abilities (e.g. Coert)
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

export function applyPlaceEffectsOnQuest(gameState, playerId, questCard, didSucceed, targetSlotIndex = -1) {
  let state = JSON.parse(JSON.stringify(gameState));
  if (!state.activePlace) return state;
  const player = state.players[playerId];
  // Use the caller-supplied slot when available; fall back to first active Mosje.
  const fallbackSlot = player?.activeSlots.findIndex(s => s && !s.isDefeated) ?? -1;
  const slotIndex = (targetSlotIndex >= 0) ? targetSlotIndex : fallbackSlot;
  const mosje = slotIndex >= 0 ? player.activeSlots[slotIndex] : null;
  const questsCompletedThisTurn = player?.questsCompletedThisTurn || 0;
  state = placeEffects.resolvePlaceEffect(state, 'ON_QUEST', {
    playerId, questCard, didSucceed, mosje, questsCompletedThisTurn, targetSlotIndex: slotIndex,
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
// Destroys any currently active Place first (moves it to its owner's discard pile).
// Applies PASSIVE effects immediately after placement.
// cardRef — the hand reference object { cardId, type }
// cardDef — full card definition from PLACES data (has trigger, effectId)
// Returns { state, success, error? }
// ─────────────────────────────────────────────────────────────
export function playPlace(gameState, playerId, cardRef, cardDef) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };

  if (isHandCardLocked(state, playerId, cardRef)) {
    return { state, success: false, error: 'That card is locked by Ronald Strategic Insight — you cannot play it this turn.' };
  }

  // Defensive normalization — ensures piecieSlots is always 4 elements with null for empty
  normalizePiecieSlots(player, 4);
  if (!Array.isArray(player.hand)) player.hand = [];
  if (!Array.isArray(player.discard)) player.discard = [];

  // Check if all 4 slots are full
  const filledSlots = player.piecieSlots.filter(slot => slot !== null && slot !== undefined).length;
  if (filledSlots >= 4) {
    return { state, success: false, error: 'Cannot place a Place — all Piecie slots are full.' };
  }

  // Remove from hand
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };
  player.hand.splice(handIndex, 1);

  // Find empty slot and place face-down (like a Piecie)
  const emptySlot = player.piecieSlots.findIndex(slot => slot === null);
  if (emptySlot === -1) {
    player.hand.splice(handIndex, 0, cardRef);
    return { state, success: false, error: 'No empty Piecie slot available' };
  }

  player.piecieSlots[emptySlot] = {
    cardId: cardRef.cardId,
    type: 'PLACE',
    faceDown: true,
    activated: false,
    playedOnTurn: state.turnNumber,
    canActivateOnTurn: state.turnNumber + 1,
    slotIndex: emptySlot,
  };

  console.log(`[ENGINE] Place played face-down: ${cardDef.name} by ${playerId}`);
  state = checkVictory(state);
  return { state, success: true };
}
