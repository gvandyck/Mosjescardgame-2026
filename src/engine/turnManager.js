// turnManager.js â€” Controls the 4 turn phases: DRAW â†’ MAIN â†’ QUEST â†’ END
// Coordinates which engine functions run in which order.
// The UI calls these functions; they return the updated game state.

import { withReactionWindow } from './reactions/withReactionWindow.js';
import { PIECIE_SLOT_COUNT } from './table/tableRules.js';
import { isPiecieReady } from './table/isPiecieReady.js';
import { finishPiecieActivation } from './table/finishPiecieActivation.js';
import { sweepStaysSlots } from './table/sweepStaysSlots.js';
import { runEndOfTurnLosses } from './turn/runEndOfTurnLosses.js';
import { canLeaveWelloePile } from './table/canLeaveWelloePile.js';
import { drawCards, shuffleDeck } from './deckEngine.js';
import { placeEmptyFieldMosje } from './turn/placeEmptyFieldMosje.js';
import { clearOwnerProtections } from './turn/clearOwnerProtections.js';
import { expireThisTurnEffects } from './turn/expireThisTurnEffects.js';
import { snapBackTacticianSet } from './mp/snapBackTacticianSet.js';
import { getNextPlayerId } from './turn/getNextPlayerId.js';
import { isCooldownBlocked, COOLDOWN_ERROR } from './turn/isCooldownBlocked.js';
import { applyStatusEffectMP, getTotalMPForPlayer } from './mpManager.js';
import { checkVictory, markMosjeDefeated } from './victoryChecker.js';
import { getAllPlayerIds, setActivePlace, destroyActivePlace, clearReturnedMosjesAtTurnEnd } from './gameState.js';
import { isHolderTextActive } from './synergy/isHolderTextActive.js';
import * as placeEffects from '../abilities/placeEffects.js';
import * as piecieEffects from '../abilities/piecieEffects.js';
import * as snelleEffects from '../abilities/snelleEffects.js';
import * as mosjeAbilities from '../abilities/mosjeAbilities.js';
import { MOSJES } from '../data/mosjes.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';
import { SNELLE_PIECIES } from '../data/snellePiecies.js';
import { QUESTS } from '../data/quests.js';
import { toGraveyardEntry } from './graveyardUtils.js';
import { createMosjeSlot } from './mp/createMosjeSlot.js';
import { applyGainToSlot } from './mp/applyGainToSlot.js';
import { roundToFive } from './roundToFive.js';
import { gainEnergy } from './energy/gainEnergy.js';
import { checkWin } from './winLose/checkWin.js';
import { payEnergy } from './energy/payEnergy.js';
import { canPay } from './energy/canPay.js';
import { canMosjeAct } from './mp/canMosjeAct.js';
import { getAbilityEnergyCost } from './energy/getAbilityEnergyCost.js';
import { piecieActivationGate } from './table/piecieActivationGate.js';
import { runPiecieEffect } from './piecies/runPiecieEffect.js';
import { afterPiecieEffect } from './piecies/afterPiecieEffect.js';
import { runMosjeTriggers } from './mosje/runMosjeTriggers.js';
import { getDrawStepOptions } from './mosje/getDrawStepOptions.js';
import { armSetAside } from './mosje/armSetAside.js';
import { returnSetAside } from './mosje/returnSetAside.js';
import { MOSJE_ABILITY_RULES } from '../rules/mosjeAbilityRules.js';

console.log('[ENGINE] turnManager.js loaded');

// Perfect Rhythm checks whether its draw was already armed before the current
// Piecie effect began. This prevents the first Rhythm from drawing off itself,
// while allowing a later Rhythm copy and DDR-chained activations to benefit.
export function applyPerfectRhythmDraw(state, playerId, wasArmedBeforeActivation) {
  if (!wasArmedBeforeActivation) return state;
  const player = state.players[playerId];
  if (!player) return state;

  if (player.deck.length > 0) {
    player.hand.push(player.deck.shift());
    state = applyPlaceEffectsOnDraw(state, playerId, 1);
    console.log('[ABILITY] Perfect Rhythm: later Piecie activation drew 1 card');
  } else {
    console.log('[ABILITY] Perfect Rhythm: later Piecie activation had no card to draw');
  }
  return state;
}

const PIECIE_LOOKUP = Object.fromEntries(PIECIES.map(card => [card.id, card]));
const SNELLE_PIECIE_LOOKUP = Object.fromEntries(SNELLE_PIECIES.map(card => [card.id, card]));
const PLACE_LOOKUP = Object.fromEntries(PLACES.map(card => [card.id, card]));
const QUEST_LOOKUP = Object.fromEntries(QUESTS.map(card => [card.id, card]));

// Redbull (abilityDoubleTrigger) does NOT echo these abilities — re-running them
// would bypass a once-per-game/use-cap/cooldown guard, fizzle (needs a fresh
// target/guess that isn't available without UI), or no-op (passive).
// Ruling: "triggers twice". The echo re-runs the ability function verbatim, so
// the cost is whatever the function charges itself: cost-free abilities double for
// free, and SELF-CHARGING cost abilities (e.g. Coert: pay 10 MP, draw 1) re-pay on
// the echo — "triggers twice" = pay twice, draw twice. Those are SAFE to echo and
// are intentionally NOT listed here. Only un-repeatable abilities below.
const NO_DOUBLE_ABILITIES = new Set([
  'ability_gandoe_destroyer_elimination_strike',  // once per game
  'ability_ronald_mastermind_master_plan',        // once per turn + discard target
  'ability_jeffrey_gambler_high_stakes',          // once per turn + stake
  'ability_youri_speed_activate',                 // once per turn + placed-this-turn target
  'ability_ronald_chef_strategic_insight',        // cooldown + target
  'ability_ming_predictor_future_sight',          // once per turn + quest target
  'ability_binti_cutting_words',                  // once per turn + discard target
  'ability_michelle_tough_gamble',                // passive (auto, no manual trigger)
  'ability_jeffrey_brute_force',                  // passive (auto)
  'ability_coert_kasteluck_morning_luck',          // trigger (startOfTurn roll)
  'ability_fps_coert_headshot_precision',           // passive (auto, quest-success roll)
  'ability_chris_ddr_perfect_combo_chain',          // passive (auto, roll after every Piecie activation)
  // Group B (2026-06-17): once-per-turn / cooldown / per-game-cap abilities.
  // The echo runs the fn directly, AFTER abilityUsedThisTurn is set, so it would
  // otherwise bypass the per-turn brake and fire twice. Redbull is a powerup
  // "within bounds" — these stay single. (Some cooldowns/caps are not yet
  // enforced inside the fn either; tracked in the rework todo.)
  'ability_tuk_healer_healing_presence',          // once per turn
  'ability_martin_driver_perfect_line',           // Pit Stop: once per turn + discard cost
  'ability_chris_perfect_setup',                  // once per turn
  'ability_tactician_mp_manipulation',            // once per turn
  'ability_martin_historian_time_control',        // once per turn (draw-phase skip)
  'ability_hacker_system_hack',                   // once / 5 turns (cooldown)
  'ability_amplifier_power_boost',                // max 2 uses per game (cap)
]);

// Group A (2026-06-17): input abilities Redbull SHOULD double, but only with a
// FRESH prompt — they record a guess/selection in _pendingTargets that goes stale
// on a headless re-run. For these the engine does NOT echo and does NOT consume
// the Redbull flag; it sets state._redbullAwaitingReprompt so the UI (main.js)
// re-runs the activation flow once with new input, then consumes the flag.
// (No once-per-turn / once-per-game bound on these — they are repeatable in spirit.)
const REPROMPT_DOUBLE_ABILITIES = new Set([
  'ability_martin_senor_west_calculated_guess',   // card-type guess + top-card reveal
  'ability_west_calculated_guess',                // alias of the above
  'ability_fps_west_tactical_analysis',           // opponent-hand card-type guess
  'ability_tuk_architect_perfect_placement',      // 15 MP + top-5 selection
  'ability_jisca_perfect_combo',                  // fresh d6 roll + Piecie target (when 5-6 rolled)
  'ability_binti_creator_quick_sketch',           // discard 2 FOOD + deck-search tutor
]);

export function normalizePiecieSlots(player, slotCount = PIECIE_SLOT_COUNT) {
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// startTurn
// Called at the beginning of a player's turn.
// Runs: Momentum Domination check â†’ draw 1 card â†’ passive MP gains.
// Returns updated gameState.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function startTurn(gameState) {
  let state = JSON.parse(JSON.stringify(gameState));
  const playerId = state.activePlayerId;
  // Obby 2.0 §2b: the win check is the FIRST thing at turn start (hold Level 3).
  state = checkWin(state, playerId);
  if (state.status === 'FINISHED') return state;
  state = sweepStaysSlots(state, playerId, 'start'); // startOfNextTurn Stays leave now
  console.log(`[ENGINE] â”€â”€ Turn ${state.turnNumber} START â€” Player: ${playerId} â”€â”€`);

  // Reset per-turn trackers for the active player
  const activePlayer = state.players[playerId];

  // Obby 2.0 Core Numbers §1a: +1 Energy at the start of each own turn (max 6),
  // a cooldown turn still gets +1.
  gainEnergy(state, playerId);

  activePlayer.questsCompletedThisTurn = 0;
  activePlayer.questsAttemptedThisTurn = 0;
  activePlayer.hasRerolledDieThisTurn = false;
  activePlayer.pieciesPlayedThisTurn = 0;
  activePlayer.lastCardPlayedType = null;
  activePlayer.instantPiecieThisTurn = false;
  activePlayer.chainReactionActive = false;
  activePlayer.abilityDoubleTrigger = false;
  activePlayer.drawsThisTurn = 0;
  activePlayer.pieciesActivatedThisTurn = 0;
  activePlayer.piecieActivationsThisTurn = 0; // Build Gadget / Speed Run conditions (56-03)
  activePlayer.cardsDrawnThisTurn = 0; // Artistic Expression (56-03)
  activePlayer.actionsThisTurn = [];
  activePlayer.freePiecieActivationAvailable = false;
  activePlayer.attackPieciePlayedThisTurn = false;
  activePlayer.ddrChainsThisTurn = 0; // Dancing/DDR Chris: max 2 free chains per turn
  activePlayer.jiscaRolledThisTurn = false; // Jisca: once per turn

  // Dead-flag turn hygiene (Phase 18): clear stale single-turn effect flags so a
  // flag set but never triggered does not leak into a later turn. These live on
  // `state` (global), not on activePlayer.
  delete state._snelleBlocked;
  delete state._battleConcertActive;
  delete state._rerollGranted;

  // Ronald, The Master Chef: cards set aside from this player's hand return at the end of THIS turn.
  armSetAside(state, playerId);

  for (const slot of activePlayer.activeSlots) {
    if (slot) {
      slot.abilityUsedThisTurn = false;
      slot.abilityUsesThisTurn = 0;
      slot.immuneThisTurn = false;
      // decision 1 (54-11): sideways = this Mosje skips this owner turn
      if (slot.sideways) slot.sidewaysArmed = true;
      slot.mpLostThisTurn = 0;
      // MP Adjuster: reverse the temporary delta applied last turn
      if (slot._mpAdjustDelta !== undefined) {
        // Restore of a temporary absolute set: floor 0, on the 5-grid, never levels or getemts.
        slot.mp = roundToFive(Math.max(0, slot.mp - slot._mpAdjustDelta)); // mp-direct-ok: reverting a temporary MP Adjuster set
        console.log(`[ENGINE] MP Adjuster: reverted ${slot._mpAdjustDelta} MP delta for ${playerId}`);
        delete slot._mpAdjustDelta;
      }
    }
  }

  // DRAW PHASE â€” draw 1 card
  // Draw-step abilities (Coert Tech, Martin Historian) pause here until finishDrawStep settles them.
  const drawOptions = getDrawStepOptions(state, playerId);
  if (drawOptions.length) {
    state.pendingDrawStep = { playerId, options: drawOptions };
    return state;
  }
  return finishStartTurn(state, playerId, {});
}

// The rest of startTurn: draw (unless a draw-step ability replaced it), R1, Places, Mosje triggers.
export function finishStartTurn(state, playerId, opts = {}) {
  if (opts.skipDraw) {
    delete state.firstTurnDrawSkipPending;
  } else if (state.firstTurnDrawSkipPending) {
    // R5: the first player skips their very first draw (the flag is one-shot).
    const skipDraw = playerId === state.firstPlayerId;
    delete state.firstTurnDrawSkipPending;
    if (skipDraw) console.log(`[ENGINE] R5: ${playerId} skips the first draw`);
    else {
      state = phaseDrawCard(state, playerId);
      state = applyPlaceEffectsOnDraw(state, playerId, 1);
    }
  } else {
    state = phaseDrawCard(state, playerId);
    // ON_DRAW Place effects — fires if active Place has trigger 'ON_DRAW'
    state = applyPlaceEffectsOnDraw(state, playerId, 1);
  }
  // R1 (Obby 2.0): an empty field gets the cheapest Mosje free and fresh.
  const r1 = placeEmptyFieldMosje(state, playerId);
  state = r1.state;
  if (r1.r1Event) state._r1Event = r1.r1Event;

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

  state = checkVictory(state);
  if (state.status === 'FINISHED') return state;

  // START PHASE — fire active Place effects (START_PHASE trigger only)
  state = applyPlaceEffectsOnStart(state, playerId);

  // 2.0 Mosje triggers: own start-of-turn, then each opponent-start-of-turn (before fresh flags clear).
  state = runMosjeTriggers(state, 'startOfTurn', { playerId });
  if (!state.pendingChoice) state = runMosjeTriggers(state, 'oppStartOfTurn', { playerId });
  state = checkVictory(state);
  if (state.status === 'FINISHED') return state;

  // Passive turn-start MP (e.g. DJ 80/20 gains 10 MP automatically)
  // Ability functions will hook into this in Phase 4.
  console.log('[ENGINE] DRAW phase complete');

  // R2/U8: this player's fresh and level-up flags end now (the R1 Mosje stays fresh, E9).
  clearOwnerProtections(state.players[playerId], r1.placedSlotIndex >= 0 ? [r1.placedSlotIndex] : []);

  return state;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// phaseDrawCard
// Draws 1 card from the player's personal deck into their hand.
// If the deck is empty but the discard has cards, reshuffle it into a new deck, draw 1,
// and set cooldownTurn (2.0 RULE-07) — also stamping a one-shot _deckOutEvent
// marker for the UI. If deck AND discard are both empty, no draw and no penalty.
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
    if (player.graveyard.length === 0) {
      console.log('[ENGINE] Draw phase: deck AND discard empty — no draw, no penalty');
      return state;
    }
    // Reshuffle discard into deck (deck-out rule per D-06)
    player.deck = shuffleDeck([...player.graveyard]);
    player.graveyard = [];
    const { drawn, remaining } = drawCards(player.deck, 1);
    player.deck = remaining;
    player.hand.push(...drawn);
    player.drawsThisTurn = (player.drawsThisTurn || 0) + drawn.length;
    player.cardsDrawnThisTurn = (player.cardsDrawnThisTurn || 0) + drawn.length;
    player.cooldownTurn = true; // Obby 2.0 RULE-07: this player's next own turn is a cooldown turn
    // One-shot marker for the UI: rides the existing gameState sync so BOTH clients can
    // show the deck-out notice. Not cleared here — each client de-dupes on its own.
    state._deckOutEvent = {
      playerId,
      turnNumber: state.turnNumber,
      reshuffledCount: player.deck.length + drawn.length, // cards recycled from discard
    };
    console.log(`[ENGINE] Draw phase: deck-out — reshuffled ${player.deck.length + 1} cards, drew ${drawn.length}, cooldown turn set`);
    return state;
  }

  const { drawn, remaining } = drawCards(player.deck, count);
  player.deck = remaining;
  player.hand.push(...drawn);
  player.drawsThisTurn = (player.drawsThisTurn || 0) + drawn.length;
  player.cardsDrawnThisTurn = (player.cardsDrawnThisTurn || 0) + drawn.length;
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
  // RULE-07: the cooldown turn ends with this turn.
  if (state.players[playerId]) state.players[playerId].cooldownTurn = false;

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
  normalizePiecieSlots(state.players[playerId]);
  state = sweepStaysSlots(state, playerId, 'end');
  // Call of the Welloes: if anchor Piecie has left play, defeat the summoned Mosje (D-12/D-14)
  for (let i = 0; i < state.players[playerId].activeSlots.length; i++) {
    const aSlot = state.players[playerId].activeSlots[i];
    if (aSlot?.summonedByPiecie === 'piecie_call_of_welloes' && !aSlot.isDefeated) {
      const piecieStillOnField = state.players[playerId].piecieSlots.some(
        p => p?.cardId === 'piecie_call_of_welloes'
      );
      if (!piecieStillOnField) {
        state = markMosjeDefeated(state, playerId, i);
        console.log('[ENGINE] endTurn sweep: summoned Mosje defeated — anchor Piecie no longer on field');
      }
    }
  }

  // decision 1 (54-11): Mosjes that sat out this turn stand up at its end
  for (const s of state.players[playerId].activeSlots) {
    if (s?.sideways && s.sidewaysArmed) {
      s.sideways = false;
      delete s.sidewaysArmed;
      console.log(`[ENGINE] ${s.name} stands up (end of ${playerId}'s turn)`);
    }
  }

  // Reset questPrepBonus at end of turn — per-turn bonus (BUG-05)
  state.players[playerId].questPrepBonus = 0;
  state.players[playerId].perfectRhythmDrawNextPiecie = false;

  // Leipe Swap: at the end of the swapper's turn, swap the two slots' current MP back.
  if (state._leipeSwap && state._leipeSwap.byPlayerId === playerId) {
    const rec = state._leipeSwap;
    const a = state.players[rec.byPlayerId]?.activeSlots?.[rec.yourSlotIndex];
    const b = state.players[rec.oppId]?.activeSlots?.[rec.oppSlotIndex];
    if (a && b) {
      const tmp = a.mp;
      a.mp = b.mp; // mp-direct-ok: Leipe Swap exchanges two existing on-grid values, no gain or loss
      b.mp = tmp; // mp-direct-ok: Leipe Swap swap-back
      console.log('[PIECIE] Leipe Swap: end-of-turn swap-back');
    }
    delete state._leipeSwap;
  }

  state = runMosjeTriggers(state, 'endOfTurn', { playerId });
  returnSetAside(state, playerId); // Ronald's Strategic Insight: set-aside cards come back now
  snapBackTacticianSet(state);
  state = runEndOfTurnLosses(state, playerId); // "at the end of the turn it loses N MP" (Te Hard Gaan ...)
  expireThisTurnEffects(state);

  state = checkVictory(state);
  if (state.status === 'FINISHED') return state;

  // Advance to next player
  const next = getNextPlayerId(state, playerId);
  state.activePlayerId = next.nextPlayerId;

  // Increment turn number when play wraps back to the first player
  if (next.wrapsRound) {
    state.turnNumber += 1;
    console.log(`[ENGINE] Round complete. Turn ${state.turnNumber} begins.`);
  }

  console.log(`[ENGINE] Next player: ${state.activePlayerId}`);
  return state;
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
  normalizePiecieSlots(player);
  if (!Array.isArray(player.hand)) player.hand = [];
  if (!Array.isArray(player.graveyard)) player.graveyard = [];

  // Remove from hand
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };

  // 2.0: 3 Piecie-only slots; an active Place never occupies one.
  const filledSlots = player.piecieSlots.filter(slot => slot !== null && slot !== undefined).length;
  if (filledSlots >= PIECIE_SLOT_COUNT) {
    return { state, success: false, error: 'You can place up to 3 Piecies' };
  }

  player.hand.splice(handIndex, 1);

  // Place Piecie face-down on the field.
  // It can be activated starting next turn by the owner.
  normalizePiecieSlots(player);
  const emptySlot = player.piecieSlots.findIndex(s => s === null);
  if (emptySlot < 0) {
    // Restore card to hand if placement fails.
    player.hand.splice(handIndex, 0, cardRef);
    return { state, success: false, error: 'No empty Piecie slot available' };
  }

  const chrisYouriSynergy = isHolderTextActive(state, playerId, 'mosje_youri');
  if (chrisYouriSynergy) {
    console.log('[SYNERGY] Youri holder text: Piecie placed with instant activation (canActivateOnTurn = ' + state.turnNumber + ')');
  }
  player.piecieSlots[emptySlot] = {
    cardId: cardRef.cardId,
    type: 'PIECIE',
    faceDown: true,
    activated: false,
    playedOnTurn: state.turnNumber,
    canActivateOnTurn: chrisYouriSynergy ? state.turnNumber : state.turnNumber + 1,
  };

  state.players[playerId].pieciesPlayedThisTurn = (state.players[playerId].pieciesPlayedThisTurn || 0) + 1;
  state.players[playerId].lastCardPlayedType = 'PIECIE';
  if (cardDef?.subtype === 'ATTACK') {
    state.players[playerId].attackPieciePlayedThisTurn = true;
  }

  state = runMosjeTriggers(state, 'cardPlayedFromHand', { playerId, cardType: 'PIECIE' });
  state = checkVictory(state);
  return { state, success: true };
}

export function activatePiecie(gameState, playerId, slotIndex, opts = {}) {
  return withReactionWindow(gameState, playerId, { type: 'activatePiecie', args: [playerId, slotIndex], skipReactions: opts.skipReactions },
    (st) => activatePiecieCore(st, playerId, slotIndex));
}

function activatePiecieCore(gameState, playerId, slotIndex) {
  let state = JSON.parse(JSON.stringify(gameState));
  let player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };
  if (isCooldownBlocked(state, playerId)) return { state, success: false, error: COOLDOWN_ERROR };

  if (state.activePlayerId !== playerId) {
    return { state, success: false, error: 'You can only activate Piecies on your own turn' };
  }

  normalizePiecieSlots(player);
  if (!Array.isArray(player.graveyard)) {
    player.graveyard = [];
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

  if (!isPiecieReady(slot, state.turnNumber)) {
    return { state, success: false, error: 'This Piecie can be activated starting next turn' };
  }

  // Resolve card definition by id for activation metadata.
  const knownCardDef = cardDefLookup(slot.cardId);
  if (!knownCardDef) {
    return { state, success: false, error: 'Unknown Piecie definition' };
  }

  // Rules that block the activation outright (The Void, Jeffrey) - shared with free activations.
  const gateError = piecieActivationGate(state, playerId, knownCardDef);
  if (gateError) {
    console.log('[ENGINE] Piecie activation blocked:', gateError);
    return { state, success: false, error: gateError };
  }

  // Dingetje Toch wildcard: if state._dingetjeTochActive is true, the UI layer must bypass
  // any single failing trait/type requirement before calling activatePiecie, then clear the flag.
  // Consumption point: in main.js handleActivatePiecie(), before the activatePiecie() call,
  // check state._dingetjeTochActive — if set, skip the single failing requirement check and
  // delete state._dingetjeTochActive before passing state to activatePiecie.
  // STUB-07: UI-side implementation deferred to UI wiring phase.

  // Energy: pay the card's cost after validation, before any mutation (free chains never reach here)
  const piecieEnergyPay = payEnergy(state, playerId, Number(knownCardDef.cost) || 0);
  if (!piecieEnergyPay.success) {
    return { state: gameState, success: false, error: piecieEnergyPay.error || 'Not enough Energy' };
  }

  return resolvePiecieActivation(state, playerId, safeSlotIndex, knownCardDef, { free: false });
}

// Everything after the Energy payment, shared by activatePiecie and activatePiecieFree.
// slotIndex -1 = the Piecie is not in a slot (free activation from deck/discard/hand).
// opts.free: ctx.free for the piecieActivated triggers; a free activation never starts a chain roll (Jisca / DDR Chris / Teaching Moment).
export function resolvePiecieActivation(state, playerId, safeSlotIndex, knownCardDef, opts = {}) {
  const free = opts.free === true;
  const hasSlot = safeSlotIndex >= 0;
  let player = state.players[playerId];
  const slot = hasSlot ? player.piecieSlots[safeSlotIndex] : null;
  const slotCardId = knownCardDef.id;
  const flags = state._snelleFlags || {};
  const oppId = Object.keys(state.players).find(id => id !== playerId);
  const isAttack = knownCardDef.tags?.includes('ATTACK');
  if (!Array.isArray(player.graveyard)) player.graveyard = [];

  // Flip face-up when activation starts
  if (slot) {
    slot.faceDown = false;
    slot.activated = true;
  }

  // Counter Strikka: negate any Piecie
  if (oppId && flags.negateNextPiecie?.[oppId]) {
    delete state._snelleFlags.negateNextPiecie[oppId];
    console.log('[ENGINE] Counter Strikka negated:', knownCardDef.name);
    player.graveyard.push(toGraveyardEntry(slotCardId, 'played'));
    if (hasSlot) player.piecieSlots[safeSlotIndex] = null;
    state = checkVictory(state);
    return { state, success: true, negated: true, cardDef: knownCardDef };
  }
  // Perfect Dodge: negate ATTACK Piecies + grant 15 MP
  if (oppId && isAttack && flags.negateNextAttack?.[oppId]) {
    delete state._snelleFlags.negateNextAttack[oppId];
    const oppPlayer = state.players[oppId];
    const si = oppPlayer.activeSlots.findIndex(s => s && !s.isDefeated);
    if (si >= 0) applyGainToSlot(oppPlayer.activeSlots[si], 15, { turnNumber: state.turnNumber });
    console.log('[ENGINE] Perfect Dodge negated ATTACK + granted 15 MP to opponent');
    player.graveyard.push(toGraveyardEntry(slotCardId, 'played'));
    if (hasSlot) player.piecieSlots[safeSlotIndex] = null;
    state = checkVictory(state);
    return { state, success: true, negated: true, cardDef: knownCardDef };
  }

  // Apply the effect (it may pause on a choice; resumePiecieChoice then finishes the activation)
  const after = {
    handSizeBefore: state.players[playerId].hand.length,
    rhythmWasArmed: state.players[playerId].perfectRhythmDrawNextPiecie === true,
  };
  const run = runPiecieEffect(state, playerId, knownCardDef, { slotIndex: safeSlotIndex, free }, { after });
  state = run.state;
  console.log(`[ENGINE] Piecie activated: ${knownCardDef.name} (${knownCardDef.effectId})`);
  if (run.paused) return { state, success: true, paused: true, cardDef: knownCardDef };

  const done = afterPiecieEffect(state, playerId, safeSlotIndex, knownCardDef, after, { free });
  console.log(`[ENGINE] piecieSlots after activation:`, done.state.players[playerId].piecieSlots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | '));
  return done;
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
export function playSnellie(gameState, playerId, cardRef, cardDef, opts = {}) {
  return withReactionWindow(gameState, playerId, { type: 'playSnelle', args: [playerId, cardRef, cardDef], skipReactions: opts.skipReactions },
    (st) => playSnellieCore(st, playerId, cardRef, cardDef));
}

function playSnellieCore(gameState, playerId, cardRef, cardDef) {
  let state = JSON.parse(JSON.stringify(gameState));
  let player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };
  if (isCooldownBlocked(state, playerId)) return { state, success: false, error: COOLDOWN_ERROR };


  // Those Eyelashes: this player's Snelles are blocked this turn
  if (state._snelleBlocked === playerId) {
    return { state, success: false, error: 'Your Snelle Piecies are blocked this turn (Those Eyelashes).' };
  }

  // Defensive normalization for synced multiplayer states
  normalizePiecieSlots(player);
  if (!Array.isArray(player.hand)) player.hand = [];

  // 2.0 (E23): only filled Piecie slots count; an active Place never occupies one.
  const filledSlots = player.piecieSlots.filter(slot => slot !== null && slot !== undefined).length;
  if (filledSlots >= PIECIE_SLOT_COUNT) {
    return { state, success: false, error: 'Cannot play a Snelle: all 3 Piecie slots are full.' };
  }
  if (!Array.isArray(player.graveyard)) player.graveyard = [];

  // Remove from hand and place face-up in a piecie slot (swept to discard at end of turn)
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };
  const snellePay = payEnergy(state, playerId, Number(cardDef.cost) || 0);
  if (!snellePay.success) return { state: gameState, success: false, error: snellePay.error || 'Not enough Energy' };
  const [playedCard] = player.hand.splice(handIndex, 1);

  normalizePiecieSlots(player);
  const snelleSlot = player.piecieSlots.findIndex(s => s === null);
  player.piecieSlots[snelleSlot] = {
    cardId: playedCard.cardId,
    type: 'SNELLE_PIECIE',
    faceDown: false,
    activated: true,
    playedOnTurn: state.turnNumber,
  };

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
  if (!Array.isArray(player.graveyard)) player.graveyard = [];

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

  // Resolved: slot is freed at once, except Stays cards (Blensen!) which sweep at end of turn.
  const doneSlots = state.players[playerId].piecieSlots;
  const doneIdx = doneSlots.findIndex(s => s?.cardId === playedCard.cardId && s?.type === 'SNELLE_PIECIE');
  if (doneIdx >= 0) state = finishPiecieActivation(state, playerId, doneIdx, cardDef);

  state = runMosjeTriggers(state, 'cardPlayedFromHand', { playerId, cardType: 'SNELLE_PIECIE' });
  state = checkVictory(state);
  return { state, success: true };
}

export function confirmCallOfWelloes(gameState, playerId, mosjeCardId) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };
  if (!canLeaveWelloePile(state)) return { state, success: false, error: 'Mosjes cannot leave the Welloe pile while Welloe Graveyard is in play' };
  if (!Array.isArray(player.activeSlots)) player.activeSlots = [null, null];
  // Always summon into the rightmost slot so the Mosje appears next to the Piecie zone.
  // If rightmost is occupied, shift that Mosje left to the first free slot first.
  const hasFreeSlot = player.activeSlots.some(s => s === null);
  if (!hasFreeSlot) return { state, success: false, error: 'No free slot' };
  const rightmost = player.activeSlots.length - 1;
  if (player.activeSlots[rightmost] !== null) {
    const leftFree = player.activeSlots.findIndex(s => s === null);
    player.activeSlots[leftFree] = player.activeSlots[rightmost];
    player.activeSlots[rightmost] = null;
  }
  const openSlot = rightmost;
  if (!Array.isArray(player.welloePile)) return { state, success: false, error: 'No Welloe pile' };
  const gIdx = player.welloePile.findIndex(e => e.cardId === mosjeCardId && e.type === 'MOSJE');
  if (gIdx < 0) return { state, success: false, error: 'Mosje not in Welloe pile' };

  const [record] = player.welloePile.splice(gIdx, 1);
  const mosjeDef = MOSJES.find(m => m.id === record.cardId);
  // Fresh summon at Level 1, 50 MP — NOT restored from welloe record (D-05/D-06)
  const slot = mosjeDef ? createMosjeSlot(mosjeDef, { level: 1, mp: 50 }) : { ...record, mp: 50, level: 1 };
  slot.entryProtected = true; // U8 — also on the raw-record fallback path
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
  const finalState = checkVictory(state);
  return { state: finalState, success: true, slotIndex: openSlot };
}

export function playMosje(gameState, playerId, cardRef) {
  let state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };
  if (isCooldownBlocked(state, playerId)) return { state, success: false, error: COOLDOWN_ERROR };
  if (state.activePlayerId !== playerId) return { state, success: false, error: 'Not your turn' };


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

  // Obby 2.0 TABLE-01: summoning from hand costs the Mosje's Energy cost (setup Mosje is free, placed elsewhere).
  const paid = payEnergy(state, playerId, mosjeDef.cost ?? 0);
  if (!paid.success) {
    player.hand.splice(handIndex, 0, removed);
    return { state, success: false, error: paid.error };
  }

  const saved = removed.savedState || {};
  const slot = createMosjeSlot(mosjeDef, {
    level: typeof saved.level === 'number' ? saved.level : 1,
    mp: typeof saved.mp === 'number' ? saved.mp : undefined,
  });
  if (saved.traits && typeof saved.traits === 'object') slot.traits = { ...saved.traits };
  if (Array.isArray(saved.statusEffects)) slot.statusEffects = [...saved.statusEffects];
  if (typeof saved.abilityUsedThisTurn === 'boolean') slot.abilityUsedThisTurn = saved.abilityUsedThisTurn;

  slot.entryProtected = true; // fresh on arrival, also for savedState returns
  player.activeSlots[openSlotIndex] = slot;

  state = runMosjeTriggers(state, 'cardPlayedFromHand', { playerId, cardType: 'MOSJE' });
  state = checkVictory(state);
  return { state, success: true, slotIndex: openSlotIndex };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// useMosjeAbility
// Activates the unique ability of one of the player's Mosjes.
// mosjeId â€” the cardId of the Mosje whose ability to activate.
// Each Mosje can only use its ability once per turn (abilityUsedThisTurn).
// Returns { state, success, error? }
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// NOTE: Energy cost from src/rules/abilityEnergyCosts.js is checked before and paid after a successful ability (54-03); MP is never a cost.
export function useMosjeAbility(gameState, playerId, mosjeId) {
  const player = gameState.players[playerId];
  if (!player) return { state: gameState, success: false, error: 'Player not found' };
  if (isCooldownBlocked(gameState, playerId)) return { state: gameState, success: false, error: COOLDOWN_ERROR };

  const slotIndex = player.activeSlots.findIndex(s => s && s.cardId === mosjeId && !s.isDefeated);
  if (slotIndex < 0) return { state: gameState, success: false, error: 'Mosje not on field or is defeated' };

  const slot = player.activeSlots[slotIndex];
  if (!canMosjeAct(slot)) return { state: gameState, success: false, error: 'This Mosje is sideways' };
  // Was a double-trigger armed BEFORE this ability ran? Only then do we echo/consume it
  // below — so an ability that ARMS the flag itself (Amplifier) doesn't eat its own grant.
  const hadDoubleTrigger = player.abilityDoubleTrigger === true;

  const mosjeDef = MOSJES.find(m => m.id === mosjeId);
  if (!mosjeDef?.abilityId) {
    return { state: gameState, success: false, error: 'This Mosje has no ability' };
  }

  // 2.0 rules data decides who may use an ability, when, and how often (hidden V4 Mosjes: legacy defaults).
  const rule = MOSJE_ABILITY_RULES[mosjeDef.abilityId] || { kind: 'activated', per: 'turn', maxPerTurn: 1, ownTurnOnly: false };
  if (rule.kind !== 'activated') {
    return { state: gameState, success: false, error: 'This ability works on its own' };
  }
  if (rule.ownTurnOnly !== false && gameState.activePlayerId !== playerId) {
    return { state: gameState, success: false, error: 'You can only use this ability on your own turn' };
  }
  if (rule.per === 'game' && slot.abilityUsedThisGame) {
    return { state: gameState, success: false, error: 'Ability already used this game' };
  }
  const maxPerTurn = rule.maxPerTurn ?? 1;
  const usesThisTurn = slot.abilityUsesThisTurn ?? (slot.abilityUsedThisTurn ? 1 : 0);
  if (usesThisTurn >= maxPerTurn) {
    return { state: gameState, success: false, error: 'Ability already used this turn' };
  }

  const fn = mosjeAbilities[mosjeDef.abilityId];
  if (typeof fn !== 'function') {
    return { state: gameState, success: false, error: `Ability not implemented: ${mosjeDef.abilityId}` };
  }

  const energyCost = getAbilityEnergyCost(mosjeDef.abilityId);
  if (!canPay(player, energyCost)) {
    return { state: gameState, success: false, error: 'Not enough Energy' };
  }

  // Dispatch â€” ability functions clone the state internally and return a new state
  // Wrap in try/catch: some abilities require pending targets (e.g. Binti’s discard) that
  // are not present when called without UI interaction (e.g. from the bot driver).
  // In that case, treat the ability as unusable rather than crashing.
  let state;
  let extraFields = {};
  try {
    const result = fn(gameState, playerId, mosjeId);
    // Ability functions may return either a raw state object OR a result envelope
    // { state, success, error, ...extras }. Unwrap the envelope if present.
    if (result && typeof result === 'object' && 'state' in result && 'success' in result) {
      if (!result.success) {
        return { state: gameState, success: false, error: result.error };
      }
      const { state: innerState, success: _s, error: _e, ...rest } = result;
      state = innerState;
      extraFields = rest;
    } else {
      state = result;
    }
  } catch (err) {
    console.warn(`[ENGINE] useMosjeAbility: ability ${mosjeDef.abilityId} threw — needs UI input:`, err.message);
    return { state: gameState, success: false, error: err.message };
  }

  // Pay the printed Energy cost now that the ability succeeded.
  if (energyCost > 0) payEnergy(state, playerId, energyCost);

  // Record the use (per turn counter, per game flag).
  const usedSlot = state.players[playerId].activeSlots[slotIndex];
  usedSlot.abilityUsesThisTurn = usesThisTurn + 1;
  usedSlot.abilityUsedThisTurn = usedSlot.abilityUsesThisTurn >= maxPerTurn;
  if (rule.per === 'game') usedSlot.abilityUsedThisGame = true;

  // Redbull free-echo: if abilityDoubleTrigger is set, run the ability EFFECT once
  // more at no extra cost (mirrors the doubleNextPiecie pattern for piecies). Skip
  // abilities that can't safely repeat (NO_DOUBLE_ABILITIES). The flag is consumed
  // after the active Mosje's ability whether or not it actually doubled.
  delete state._redbullEchoFizzled;
  delete state._redbullAwaitingReprompt;
  if (hadDoubleTrigger) {
    if (REPROMPT_DOUBLE_ABILITIES.has(mosjeDef.abilityId)) {
      // Needs a fresh UI prompt to fire again. Do NOT echo (headless re-run would
      // reuse stale input) and do NOT consume the flag — signal the UI to re-run
      // the activation flow, which consumes the flag before the second cast.
      state._redbullAwaitingReprompt = mosjeId;
      console.log('[ENGINE] Redbull: ability needs a second prompt (UI re-fire) —', mosjeDef.abilityId);
    } else if (NO_DOUBLE_ABILITIES.has(mosjeDef.abilityId)) {
      // Cannot echo by design (once-per-game / target / passive). Spend Redbull.
      console.log('[ENGINE] Redbull: ability cannot double-trigger —', mosjeDef.abilityId);
      state.players[playerId].abilityDoubleTrigger = false;
    } else {
      let echoFired = false;
      try {
        const echo = fn(state, playerId, mosjeId);
        const echoState = (echo && typeof echo === 'object' && 'state' in echo && 'success' in echo)
          ? (echo.success ? echo.state : null)
          : echo;
        if (echoState) {
          state = echoState;
          echoFired = true;
          console.log('[ENGINE] Redbull: ability double-triggered —', mosjeDef.abilityId);
        }
      } catch (err) {
        console.log('[ENGINE] Redbull: second trigger could not fire —', err.message);
      }
      if (echoFired) {
        // Doubled successfully — spend Redbull.
        state.players[playerId].abilityDoubleTrigger = false;
      } else {
        // Couldn't afford / fire the second trigger. Keep Redbull armed — it persists
        // to end of turn, so the player can gain MP and cash it in later (or use it on
        // another ability). Flag the fizzle so the UI can surface it.
        state._redbullEchoFizzled = true;
        console.log('[ENGINE] Redbull: second trigger skipped (e.g. not enough MP) — Redbull stays active this turn');
      }
    }
  }

  state = checkVictory(state);
  return { state, success: true, ...extraFields };
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
  if (isCooldownBlocked(state, playerId)) return { state, success: false, error: COOLDOWN_ERROR };
  if (state.activePlayerId !== playerId) {
    return { state, success: false, error: 'You can only play a Place on your own turn' };
  }
  if (state.activePlace) return { state, success: false, error: 'A Place is already in play' };
  if (!Array.isArray(player.hand)) player.hand = [];
  const handIndex = player.hand.findIndex(c => c.cardId === cardRef.cardId);
  if (handIndex === -1) return { state, success: false, error: 'Card not in hand' };

  const def = cardDef || PLACE_LOOKUP[cardRef.cardId] || {};
  const pay = payEnergy(state, playerId, Number(def.cost) || 0);
  if (!pay.success) return { state: gameState, success: false, error: pay.error || 'Not enough Energy' };
  state = pay.state;
  state.players[playerId].hand.splice(handIndex, 1);

  state = setActivePlace(state, cardRef.cardId, playerId);
  if (def.trigger === 'PASSIVE') {
    state = placeEffects.resolvePlaceEffect(state, 'PASSIVE');
  }
  console.log(`[ENGINE] Place played: ${def.name} by ${playerId}`);
  state = runMosjeTriggers(state, 'cardPlayedFromHand', { playerId, cardType: 'PLACE' });
  state = checkVictory(state);
  return { state, success: true, cardDef: def };
}
