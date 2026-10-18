// botDriver.js — Runs the bot's full turn synchronously through the SAME
// turnManager/questLogic functions a human uses. All decisions come from
// src/bot/strategy/ (deck profiles, quest risk model, combo tags); this file
// only executes them in order. Imports only from engine, abilities, data and
// strategy — never from multiplayer.
//
// Turn phases:
//   0. Play a 2nd Mosje from hand if a field slot is free — unlocks board-
//      state synergies (e.g. West+Cless) and abilities on the SAME turn.
//   A. 'early' Mosje abilities (arm per-Piecie triggers / extra plays)
//   B. Play Piecies (tag-priority order)
//   C. Activate ready Piecies in strategic order (multipliers → MP → prep …)
//   D. 'preQuest' Mosje abilities (setup conversions)
//   E. Action phase — each Mosje takes at most one action (attack OR Quest),
//      picked by chooseMosjeAction (best expected MP swing); engine-legal only
//   F. Play a Place, activate a face-down Place
//   G. 'late' Mosje abilities
//   H. End turn

import {
  playMosje,
  playPiecie,
  activatePiecie,
  playPlace,
  useMosjeAbility,
  endTurn,
} from '../engine/turnManager.js';
import { attackMosje } from '../engine/actions/attackMosje.js';
import { rollQuestAttempt } from '../engine/quests/rollQuestAttempt.js';
import { resolveQuestAttempt } from '../engine/quests/resolveQuestAttempt.js';
import { getQuestDef } from '../engine/quests/getQuestDef.js';
import { settleMosjePauses } from './settleMosjePauses.js';
import { settleReactions } from './settleReactions.js';
import { chooseMosjeAction } from './strategy/chooseMosjeAction.js';
import { defaultAbilityInputs } from './strategy/defaultAbilityInputs.js';
import { chooseQuestChoices } from './strategy/chooseQuestChoices.js';
import { canMosjeTakeAction } from '../engine/actions/canMosjeTakeAction.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';
import { MOSJES } from '../data/mosjes.js';
import { getBotProfile } from './strategy/botProfiles.js';
import { pickBotOwnTarget } from './strategy/pickBotOwnTarget.js';
import { OWN_TARGET_EFFECT_IDS } from '../engine/targets/ownTargetEffects.js';
import { planPiecieActivations } from './strategy/planPiecieActivations.js';
import { isPiecieReady } from '../engine/table/isPiecieReady.js';
import { piecieActivationGate } from '../engine/table/piecieActivationGate.js';
import { PIECIE_SLOT_COUNT } from '../engine/table/tableRules.js';
import { asBotView } from './strategy/asBotView.js';
import { canBotAfford } from './strategy/canBotAfford.js';
import { chooseSummon } from './strategy/chooseSummon.js';
import { choosePlaceToPlay } from './strategy/choosePlaceToPlay.js';
import { shouldUseAbility } from './strategy/shouldUseAbility.js';
import { getCardTags } from './strategy/comboTags.js';
import { canMosjeAct } from '../engine/mp/canMosjeAct.js';
import { getAbilityTiming } from './strategy/abilityTiming.js';
import { emitBotMetric } from './strategy/emitBotMetric.js';

const PIECIE_LOOKUP = Object.fromEntries(PIECIES.map(c => [c.id, c]));
const PLACE_LOOKUP = Object.fromEntries(PLACES.map(c => [c.id, c]));
const MOSJE_LOOKUP = Object.fromEntries(MOSJES.map(m => [m.id, m]));

// Priority for PLAYING cards face-down (slot competition): multipliers and
// MP gains claim slots first, Personal Quests early too (high payoff later).
function playPriority(cardRef) {
  if (cardRef.type === 'QUEST') return 1.5;
  const tags = getCardTags(cardRef.cardId);
  if (tags.includes('multiplier')) return 0;
  if (tags.includes('mp-gain')) return 1;
  if (tags.includes('quest-prep')) return 2;
  if (tags.includes('attack')) return 3;
  if (tags.includes('draw')) return 4;
  return 5;
}

// Opponent board pressure from PUBLIC info only.
function getOpponentPressure(state, botPlayerId) {
  const oppId = Object.keys(state.players).find(id => id !== botPlayerId);
  const active = (state.players[oppId]?.activeSlots || []).filter(s => s && !s.isDefeated);
  const lethalPressure = active.length === 1
    && (active[0].level || 1) === 1
    && (active[0].mp || 0) <= 30
    && active[0].entryProtected !== true; // U8 — no lethal window vs protected
  // U8 — attacks fizzle while every opponent Mosje is entry-protected; the
  // planner holds attack activations for a turn when this is true.
  const opponentFullyProtected = active.length > 0
    && active.every(s => s.entryProtected === true);
  return { oppId, lethalPressure, opponentFullyProtected };
}

// Will any Mosje act this turn? Optimistic - gates quest-prep activations.
function computeQuestIntent(state, botPlayerId) {
  const slots = state.players[botPlayerId]?.activeSlots || [];
  return slots.some((_, i) => canMosjeTakeAction(state, botPlayerId, i).ok);
}

/**
 * driveBotTurnSteps
 * Runs the bot's full turn and returns an array of { state, label } snapshots —
 * one per action taken — so callers can animate each step individually.
 * driveBotTurn (below) reuses this and returns only the final state.
 *
 * @param {object} gameState — not mutated
 * @param {string} botPlayerId — must equal gameState.activePlayerId
 * @returns {Array<{state: object, label: string}>}
 */
export function driveBotTurnSteps(gameState, botPlayerId, { humanIds = [] } = {}) {
  const steps = [];
  // Defensive clone: some engine functions mutate the state they receive.
  let state = JSON.parse(JSON.stringify(gameState));
  const profile = getBotProfile(state, botPlayerId);
  const push = (label) => steps.push({ state, label });
  // BOT-02 legality signal: every engine call the bot made that the engine then refused (61-09 asserts none).
  const refused = (call, cardId, error) => emitBotMetric('engine-refused', { deck: profile.deckId, call, cardId, error });
  let halted = false; // a human must answer a reaction window first
  const finished = () => state.status === 'FINISHED' || halted;
  // Answer bot-side windows; stop (and show the window) when a human must answer.
  const settle = () => {
    const r = settleReactions(state, humanIds);
    state = r.state;
    if (r.waiting) { halted = true; push('waits for your reaction'); }
    return !halted;
  };
  // Resolve a bot Quest roll that was held back by reaction windows.
  const finishHeldQuest = () => {
    const held = state.pendingQuestRoll;
    if (!held || held.playerId !== botPlayerId || state.pendingReaction) return;
    const choices = chooseQuestChoices(state, botPlayerId, held);
    const done = resolveQuestAttempt(state, held, choices);
    if (!done.ok) { refused('resolveQuestAttempt', held.questId, done.error); state = { ...state }; delete state.pendingQuestRoll; return; }
    state = done.state;
    const slotName = state.players[botPlayerId].activeSlots[held.slotIndex]?.name;
    emitBotMetric('quest-roll', { deck: profile.deckId, quest: held.questId, dice: held.dice.length, success: done.win });
    push(`${slotName} tries ${getQuestDef(held.questId)?.name ?? held.questId}: dice [${held.dice.join(',')}] ${done.win ? 'WIN' : 'FAIL'}`);
  };
  const onCooldown = state.players[botPlayerId]?.cooldownTurn === true;

  // A bot's own turn-start pause (draw step / trigger choice) is answered first, so it can never stall.
  state = settleMosjePauses(state, humanIds).state;

  // Resume: answer an open window / finish a held Quest roll before anything else.
  if (state.pendingReaction || state.pendingQuestRoll) {
    if (settle()) finishHeldQuest();
    if (halted) return steps;
  }

  // ── Ability helper: use each eligible Mosje's ability in the given phase ──
  const useAbilitiesFor = (timing) => {
    const slotCount = (state.players[botPlayerId]?.activeSlots || []).length;
    for (let i = 0; i < slotCount; i++) {
      if (finished()) return;
      const slot = state.players[botPlayerId]?.activeSlots?.[i];
      if (!canMosjeAct(slot) || slot.abilityUsedThisTurn) continue;
      const def = MOSJE_LOOKUP[slot.cardId];
      if (!def?.abilityId || def.autoAbility) continue;
      if (getAbilityTiming(slot.cardId) !== timing) continue;
      if (!shouldUseAbility(state, botPlayerId, i, profile)) continue;

      // Clone before calling: useMosjeAbility mutates the state it receives.
      const stateForAbility = JSON.parse(JSON.stringify(state));
      // Inputs come from MOSJE_ABILITY_RULES (same data the human UI uses); no sensible answer -> skip.
      const inputs = defaultAbilityInputs(state, botPlayerId, def.abilityId);
      if (inputs === null) continue;
      stateForAbility._pendingTargets = { ...(stateForAbility._pendingTargets || {}), ...inputs };
      const result = useMosjeAbility(stateForAbility, botPlayerId, slot.cardId);
      if (result.success) {
        state = result.state;
        push(`uses ${slot.name}'s ability`);
        // A new pause (Binti: the opponent's discard pick) must never stall a bot; a human's pause is answered by the UI.
        state = settleMosjePauses(state, humanIds).state;
        if (result.reactionPending && !settle()) return; // Chris: the free activation opens a reaction window
      } else {
        refused('useMosjeAbility', slot.cardId, result.error);
      }
    }
  };

  // ── Phase 0: play a 2nd Mosje if a field slot is free ─────────────────────
  // Duo-deck synergies (West+Cless, Gandoe+Michelle's Kickboxing bonus, …)
  // require BOTH Mosjes on the field — this was previously never true in
  // bot-vs-bot play, since nothing ever called playMosje for the bot. Always
  // play it: extra turn trickle, ability access, and quest-risk backup have
  // no real downside, so this needs no risk model (unlike quests/gambles).
  // 2.0 TABLE-01 + RULE-07: chooseSummon prices the summon for real (Place discounts and the Delluft fee) and
  // checks the free slot and the cooldown turn, so the engine is never asked for a summon the bot can't pay.
  {
    const mosjeCardRef = chooseSummon(state, botPlayerId);
    if (mosjeCardRef) {
      const result = playMosje(state, botPlayerId, mosjeCardRef);
      if (result.success) {
        state = result.state;
        const mosjeDef = MOSJE_LOOKUP[mosjeCardRef.cardId];
        emitBotMetric('plays-second-mosje', { deck: profile.deckId, cardId: mosjeCardRef.cardId, slotIndex: result.slotIndex });
        push(`plays ${mosjeDef?.name ?? mosjeCardRef.cardId} to the field`);
      } else {
        refused('playMosje', mosjeCardRef.cardId, result.error);
      }
    }
  }

  // ── Phase A: early abilities ──────────────────────────────────────────────
  useAbilitiesFor('early');

  // ── Phase B: play Piecies + place Personal Quests, best cards first ──────
  const handSnapshot = [...(state.players[botPlayerId]?.hand || [])];
  const playable = handSnapshot
    .filter(c => c.type === 'PIECIE')
    .sort((a, b) => playPriority(a) - playPriority(b));
  for (const cardRef of playable) {
    if (finished()) break;
    if ((state.players[botPlayerId]?.piecieSlots || []).filter(Boolean).length >= PIECIE_SLOT_COUNT) break; // no room - never ask
    const cardDef = PIECIE_LOOKUP[cardRef.cardId];
    if (!cardDef) continue;
    const result = playPiecie(state, botPlayerId, cardRef, cardDef);
    if (result.success) {
      state = result.state;
      push(`plays ${cardDef.name}`);
    } else {
      refused('playPiecie', cardRef.cardId, result.error);
    }
  }

  // 2.0 RULE-07: a cooldown turn is only face-down Piecie placing - end it here.
  if (onCooldown) {
    if (!finished()) {
      state = endTurn(state);
      push('ends turn (cooldown)');
    }
    return steps;
  }

  // ── Phase C: activate ready Piecies in strategic order ───────────────────
  const willQuest = computeQuestIntent(state, botPlayerId);
  const { lethalPressure, opponentFullyProtected } = getOpponentPressure(state, botPlayerId);
  const activationPlan = planPiecieActivations(state, botPlayerId, profile, { willQuest, lethalPressure, opponentFullyProtected });
  for (const entry of activationPlan) {
    if (finished()) break;
    // Re-locate by cardId: earlier activations can shift or sweep slots.
    const slots = state.players[botPlayerId]?.piecieSlots || [];
    const idx = slots.findIndex(s =>
      s && s.type === 'PIECIE' && !s.activated && s.cardId === entry.cardId);
    if (idx < 0) continue;
    if (!isPiecieReady(slots[idx], state.turnNumber)) continue;
    // Checked right before each call: Energy drops (and the Delluft fee is used up) as activations are paid.
    const view = asBotView(state, botPlayerId);
    const pieDef = PIECIE_LOOKUP[slots[idx].cardId];
    if (!pieDef || !canBotAfford(view, botPlayerId, pieDef.id, 'piecie') || piecieActivationGate(view, botPlayerId, pieDef)) continue;
    const botEffectId = pieDef.effectId;
    if (OWN_TARGET_EFFECT_IDS.includes(botEffectId)) {
      const own = pickBotOwnTarget(state, botPlayerId, botEffectId);
      if (own >= 0) state = { ...state, _pendingTargets: { ...(state._pendingTargets || {}), own_slot_index: own } };
    }
    const result = activatePiecie(state, botPlayerId, idx);
    if (result.success) {
      state = result.state;
      // A Piecie that paused on a choice must never stall a bot; a human's pick is answered by the UI.
      state = settleMosjePauses(state, humanIds).state;
      if (state.pendingChoice) { halted = true; push('waits for your choice'); return steps; }
      if ((result.reactionPending || state.pendingReaction) && !settle()) return steps;
      push(`activates ${entry.cardId.replace('piecie_', '').replace(/_/g, ' ')}`);
    } else {
      refused('activatePiecie', entry.cardId, result.error);
    }
  }

  // ── Phase D: preQuest abilities ───────────────────────────────────────────
  if (!finished()) useAbilitiesFor('preQuest');

  // ── Phase E: action phase ──────────────────────────────────────────────────
  if (!finished()) runActionPhase();

  // ── Phase F: play a Place from hand (only when none is in play and the bot can pay it) ─────
  if (!finished()) {
    const placeRef = choosePlaceToPlay(state, botPlayerId);
    const cardDef = placeRef && PLACE_LOOKUP[placeRef.cardId];
    if (cardDef) {
      const result = playPlace(state, botPlayerId, placeRef, cardDef);
      if (result.success) {
        state = result.state;
        push(`plays Place: ${cardDef.name}`);
      } else {
        refused('playPlace', placeRef.cardId, result.error);
      }
    }
  }

  // ── Phase G: late abilities ───────────────────────────────────────────────
  if (!finished()) useAbilitiesFor('late');

  // ── Phase H: end turn ─────────────────────────────────────────────────────
  if (!finished()) {
    state = endTurn(state);
    push('ends turn');
  }

  return steps;

  // ── Action phase internals (closures over state/steps/profile) ───────────

  function runActionPhase() {
    const slotCount = (state.players[botPlayerId]?.activeSlots || []).length;
    for (let i = 0; i < slotCount && !finished(); i++) {
      const slot = state.players[botPlayerId].activeSlots[i];
      const action = chooseMosjeAction(state, botPlayerId, i);
      if (!action) {
        if (slot) emitBotMetric('action-skip', { deck: profile.deckId, reason: canMosjeTakeAction(state, botPlayerId, i).error || 'no-positive-swing' });
        continue;
      }
      if (action.kind === 'attack') {
        const res = attackMosje(state, botPlayerId, { attackerSlotIndex: i, targetPlayerId: action.targetPlayerId, targetSlotIndex: action.targetSlotIndex });
        if (!res.ok) { refused('attackMosje', slot.cardId, res.error); emitBotMetric('action-skip', { deck: profile.deckId, reason: res.error }); continue; }
        const targetName = state.players[action.targetPlayerId].activeSlots[action.targetSlotIndex]?.name;
        state = res.state;
        if (res.reactionPending) {
          if (!settle()) return;
          push(`${slot.name} attacks ${targetName}`);
          continue;
        }
        emitBotMetric('attack', { deck: profile.deckId, power: res.power, final: res.final });
        push(`${slot.name} attacks ${targetName} for ${res.final}`);
        continue;
      }
      const roll = rollQuestAttempt(state, botPlayerId, { slotIndex: i, stackId: action.stackId, costChoice: action.costChoice, dieChoices: action.dieChoices });
      if (!roll.ok) { refused('rollQuestAttempt', slot.cardId, roll.error); emitBotMetric('action-skip', { deck: profile.deckId, reason: roll.error }); continue; }
      if (roll.reactionPending) {
        state = roll.state;
        if (settle()) finishHeldQuest();
        continue;
      }
      const questName = getQuestDef(roll.pending.questId)?.name ?? roll.pending.questId;
      const choices = chooseQuestChoices(roll.state, botPlayerId, roll.pending);
      const done = resolveQuestAttempt(roll.state, roll.pending, choices);
      if (!done.ok) { refused('resolveQuestAttempt', roll.pending.questId, done.error); emitBotMetric('action-skip', { deck: profile.deckId, reason: done.error }); continue; }
      state = done.state;
      emitBotMetric('quest-roll', { deck: profile.deckId, quest: roll.pending.questId, dice: roll.pending.dice.length, success: done.win });
      push(`${slot.name} tries ${questName}: dice [${roll.pending.dice.join(',')}] ${done.win ? 'WIN' : 'FAIL'}`);
    }
  }
}

/**
 * driveBotTurn
 * Executes the bot's full turn and returns only the final state after endTurn.
 * Same brain as driveBotTurnSteps — it IS driveBotTurnSteps, minus the steps.
 *
 * @param {object} gameState  - Current immutable game state (not mutated)
 * @param {string} botPlayerId - Player id of the bot (must be activePlayerId)
 * @returns {object} New game state after the bot's complete turn
 */
export function driveBotTurn(gameState, botPlayerId) {
  const steps = driveBotTurnSteps(gameState, botPlayerId);
  return steps.length ? steps[steps.length - 1].state : gameState;
}
