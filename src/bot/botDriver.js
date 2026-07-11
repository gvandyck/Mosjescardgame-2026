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
//   B. Play Piecies + place Personal Quests face-down (tag-priority order)
//   C. Activate ready Piecies in strategic order (multipliers → MP → prep …)
//   D. 'preQuest' Mosje abilities (setup conversions)
//   E. Quest phase — ready Personal Quest if worth it, else reveal a General
//      Quest, risk-assess it per Mosje slot, pay the 20 MP attempt cost and
//      roll exactly like the human path — or discard it as too risky
//   F. Play a Place, activate a face-down Place
//   G. 'late' Mosje abilities
//   H. End turn

import {
  playMosje,
  playPiecie,
  activatePiecie,
  playPlace,
  activatePlace,
  attemptGeneralQuest,
  playPersonalQuest,
  activatePersonalQuest,
  useMosjeAbility,
  endTurn,
} from '../engine/turnManager.js';
import { canAttemptGeneralQuest, canAttemptPersonalQuest, resolveQuest } from '../abilities/questLogic.js';
import { loseMP } from '../engine/mpManager.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';
import { QUESTS } from '../data/quests.js';
import { MOSJES } from '../data/mosjes.js';
import { getBotProfile } from './strategy/botProfiles.js';
import { planPiecieActivations } from './strategy/planPiecieActivations.js';
import { assessQuestRisk, QUEST_ATTEMPT_COST, classifyLossSeverity, getRequiredConfidence } from './strategy/assessQuestRisk.js';
import { rollBotQuestDice } from './strategy/rollBotQuestDice.js';
import { getCardTags } from './strategy/comboTags.js';
import { getAbilityTiming } from './strategy/abilityTiming.js';
import { emitBotMetric } from './strategy/emitBotMetric.js';

const PIECIE_LOOKUP = Object.fromEntries(PIECIES.map(c => [c.id, c]));
const PLACE_LOOKUP = Object.fromEntries(PLACES.map(c => [c.id, c]));
const QUEST_LOOKUP = Object.fromEntries(QUESTS.map(c => [c.id, c]));
const MOSJE_LOOKUP = Object.fromEntries(MOSJES.map(m => [m.id, m]));

/**
 * If Varkenspootjes left a pending target selection, resolve it for the bot:
 * prefer targeting Binti (for +60 MP), else target the opponent's first Mosje (-30 MP),
 * else fall back to own first Mosje. Always clears the flag.
 */
function resolveBotVarkenspootjesPending(state, botPlayerId) {
  if (!state._varkenspootjesPending) return state;
  const allPlayers = Object.entries(state.players);
  const opponentId = allPlayers.find(([pid]) => pid !== botPlayerId)?.[0];

  let targetPid = null;
  let targetIdx = -1;

  // Prefer Binti (own or opponent) for the +60
  outer: for (const [pid, player] of allPlayers) {
    for (let i = 0; i < (player.activeSlots || []).length; i++) {
      const slot = player.activeSlots[i];
      if (slot && !slot.isDefeated && String(slot.cardId).startsWith('mosje_binti')) {
        targetPid = pid;
        targetIdx = i;
        break outer;
      }
    }
  }

  // Otherwise target opponent's first Mosje (-30 damage to them).
  // U8 — skip entry-protected Mosjes: damage would fizzle anyway.
  if (targetIdx === -1 && opponentId) {
    const opp = state.players[opponentId];
    for (let i = 0; i < (opp?.activeSlots || []).length; i++) {
      const oppSlot = opp.activeSlots[i];
      if (oppSlot && !oppSlot.isDefeated && oppSlot.entryProtected !== true) {
        targetPid = opponentId;
        targetIdx = i;
        break;
      }
    }
  }

  // Fallback: own first Mosje
  if (targetIdx === -1) {
    const own = state.players[botPlayerId];
    for (let i = 0; i < (own?.activeSlots || []).length; i++) {
      if (own.activeSlots[i] && !own.activeSlots[i].isDefeated) {
        targetPid = botPlayerId;
        targetIdx = i;
        break;
      }
    }
  }

  delete state._varkenspootjesPending;

  if (targetIdx === -1) return state;

  const slot = state.players[targetPid].activeSlots[targetIdx];
  if (String(slot.cardId).startsWith('mosje_binti')) {
    slot.mp += 60;
    console.log(`[BOT] Varkenspootjes resolved: Binti +60 MP`);
  } else {
    slot.mp = Math.max(0, slot.mp - 30);
    console.log(`[BOT] Varkenspootjes resolved: ${slot.name} -30 MP`);
  }
  return state;
}

// Cheapest hand card to feed discard costs (Binti's Cutting Words).
function pickDiscardFodder(hand) {
  const score = (cardRef) => {
    if (cardRef.type === 'MOSJE') return 100;
    if (cardRef.type === 'QUEST') return 90;
    if (cardRef.type === 'PLACE') return 60;
    const tags = getCardTags(cardRef.cardId);
    if (tags.includes('multiplier') || tags.includes('mp-gain')) return 50;
    if (tags.includes('quest-prep') || tags.includes('attack')) return 40;
    if (tags.includes('draw') || tags.includes('defense')) return 30;
    return 10;
  };
  const ranked = [...(hand || [])].sort((a, b) => score(a) - score(b));
  return ranked.length ? (ranked[0].cardId || ranked[0]) : null;
}

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
    && (active[0].level || 0) === 0
    && (active[0].mp || 0) <= 30
    && active[0].entryProtected !== true; // U8 — no lethal window vs protected
  // U8 — attacks fizzle while every opponent Mosje is entry-protected; the
  // planner holds attack activations for a turn when this is true.
  const opponentFullyProtected = active.length > 0
    && active.every(s => s.entryProtected === true);
  return { oppId, lethalPressure, opponentFullyProtected };
}

// Will the bot (probably) attempt a quest this turn? Optimistic on MP — the
// answer gates quest-prep activations, and MP boosters may still lift MP.
function computeQuestIntent(state, botPlayerId) {
  const player = state.players[botPlayerId];
  if (!player) return false;
  const maxQuests = state.activePlace === 'place_quest_haven' ? 2 : 1;
  if ((player.questsAttemptedThisTurn ?? 0) >= maxQuests) return false;
  const firstActive = (player.activeSlots || []).find(s => s && !s.isDefeated);
  if (!firstActive) return false;
  if (firstActive.statusEffects?.some(e => e.type === 'QUEST_BLOCKED')) return false;
  const generalAvailable = (state.sharedGeneralQuestDeck?.length || 0) > 0
    || (state.sharedGeneralQuestDiscard?.length || 0) > 0;
  const personalReady = (player.piecieSlots || []).some(s =>
    s && s.type === 'QUEST' && state.turnNumber >= (s.canActivateOnTurn ?? Infinity));
  return generalAvailable || personalReady;
}

// Kickboxing Bootcamp-style per-Mosje reward override (mirrors main.js
// questDefForMosje): resolve with the configured successMP, +20 when both
// Gandoe and Michelle train together.
function questDefWithPerMosje(questDef, mosje, player) {
  const perCfg = questDef.perMosjeConfig?.[mosje?.cardId];
  if (!perCfg) return questDef;
  let successMP = perCfg.successMP;
  if (questDef.id === 'quest_personal_kickboxing_bootcamp') {
    const active = (player?.activeSlots || []).filter(s => s && !s.isDefeated);
    const bothActive = active.some(s => String(s.cardId).includes('gandoe'))
      && active.some(s => s.cardId === 'mosje_michelle');
    if (bothActive) successMP += 20;
  }
  return { ...questDef, successMP };
}

// Gate costly/situational abilities so the bot doesn't burn its quest MP.
function shouldUseAbility(state, botPlayerId, slot, def, profile) {
  const cost = def.abilityCost || 0;
  if (def.abilityId === 'ability_gandoe_destroyer_elimination_strike') {
    return shouldUseEliminationStrike(state, botPlayerId, slot, cost);
  }
  if (def.abilityId === 'ability_azn_cless_risk_reward') {
    return shouldUseRiskReward(state, botPlayerId, slot, profile);
  }
  // Keep enough MP after the ability to still afford a quest attempt.
  if (cost > 0 && (slot.mp || 0) < cost + QUEST_ATTEMPT_COST) return false;
  return true;
}

// AZN Cless — Risk and Reward: a manually-triggered d6 gamble, even → +25 MP,
// odd → -15 MP (see mosjeAbilities.js — the card text calls this an automatic
// end-of-turn roll, but it is a real ability-button activation with no MP
// cost, so the generic cost gate above never applies). Fixed 50% odds either
// way; reuse the same severity/confidence vocabulary as quest risk (U8-safe:
// classifyLossSeverity already treats a Level-0, no-backup Mosje as fatal)
// so the bot only skips the flip when a real loss would be a real problem.
const RISK_REWARD_LOSS = 15;
function shouldUseRiskReward(state, botPlayerId, slot, profile) {
  const severity = classifyLossSeverity({
    mpBefore: slot.mp || 0,
    level: slot.level,
    lossAmount: RISK_REWARD_LOSS,
    gameState: state,
    playerId: botPlayerId,
    slotIndex: state.players[botPlayerId]?.activeSlots?.indexOf(slot) ?? -1,
  });
  const requiredP = getRequiredConfidence(severity, profile);
  return 0.5 >= requiredP; // fixed odds — either side of the coin is equally likely
}

// Elimination Strike (80 MP, once per game): only when it sets up the
// knockout (opponent down to one Mosje) or removes a leveled threat.
function shouldUseEliminationStrike(state, botPlayerId, slot, cost) {
  if ((slot.mp || 0) < cost) return false;
  const oppId = Object.keys(state.players).find(id => id !== botPlayerId);
  const oppActive = (state.players[oppId]?.activeSlots || []).filter(s => s && !s.isDefeated);
  if (oppActive.length === 0) return false;
  // U8 — the strike auto-targets the lowest-level Mosje (no redirect). If that
  // target just entered play, the ability would throw — don't attempt it.
  const target = [...oppActive].sort((a, b) =>
    (a.level || 0) - (b.level || 0) || (a.mp || 0) - (b.mp || 0))[0];
  if (target?.entryProtected === true) return false;
  const setsUpKnockout = oppActive.length === 1;
  const removesLeveledThreat = oppActive.some(s => (s.level || 0) >= 1);
  if (setsUpKnockout || removesLeveledThreat) {
    emitBotMetric('elimination-strike', { knockout: setsUpKnockout });
    return true;
  }
  return false;
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
export function driveBotTurnSteps(gameState, botPlayerId) {
  const steps = [];
  // Defensive clone: some engine functions mutate the state they receive.
  let state = JSON.parse(JSON.stringify(gameState));
  const profile = getBotProfile(state, botPlayerId);
  let setupActivations = 0; // multipliers/MP/prep fired before the quest — metric
  const push = (label) => steps.push({ state, label });
  const finished = () => state.status === 'FINISHED';

  // ── Ability helper: use each eligible Mosje's ability in the given phase ──
  const useAbilitiesFor = (timing) => {
    const slotCount = (state.players[botPlayerId]?.activeSlots || []).length;
    for (let i = 0; i < slotCount; i++) {
      if (finished()) return;
      const slot = state.players[botPlayerId]?.activeSlots?.[i];
      if (!slot || slot.isDefeated || slot.abilityUsedThisTurn) continue;
      const def = MOSJE_LOOKUP[slot.cardId];
      if (!def?.abilityId || def.autoAbility) continue;
      if (getAbilityTiming(slot.cardId) !== timing) continue;
      if (!shouldUseAbility(state, botPlayerId, slot, def, profile)) continue;

      // Clone before calling: useMosjeAbility mutates the state it receives.
      const stateForAbility = JSON.parse(JSON.stringify(state));
      if (def.abilityId === 'ability_binti_cutting_words') {
        const fodder = pickDiscardFodder(state.players[botPlayerId].hand);
        if (!fodder) continue;
        stateForAbility._pendingTargets = {
          ...(stateForAbility._pendingTargets || {}),
          binti_discard: fodder,
        };
      }
      const result = useMosjeAbility(stateForAbility, botPlayerId, slot.cardId);
      if (result.success) {
        state = result.state;
        push(`uses ${slot.name}'s ability`);
      }
    }
  };

  // ── Phase 0: play a 2nd Mosje if a field slot is free ─────────────────────
  // Duo-deck synergies (West+Cless, Gandoe+Michelle's Kickboxing bonus, …)
  // require BOTH Mosjes on the field — this was previously never true in
  // bot-vs-bot play, since nothing ever called playMosje for the bot. Always
  // play it: extra turn trickle, ability access, and quest-risk backup have
  // no real downside, so this needs no risk model (unlike quests/gambles).
  {
    const mosjeCardRef = (state.players[botPlayerId]?.hand || []).find(c => c.type === 'MOSJE');
    const hasFreeSlot = (state.players[botPlayerId]?.activeSlots || []).some(s => s === null);
    if (mosjeCardRef && hasFreeSlot) {
      const result = playMosje(state, botPlayerId, mosjeCardRef);
      if (result.success) {
        state = result.state;
        const mosjeDef = MOSJE_LOOKUP[mosjeCardRef.cardId];
        emitBotMetric('plays-second-mosje', { deck: profile.deckId, cardId: mosjeCardRef.cardId, slotIndex: result.slotIndex });
        push(`plays ${mosjeDef?.name ?? mosjeCardRef.cardId} to the field`);
      }
    }
  }

  // ── Phase A: early abilities ──────────────────────────────────────────────
  useAbilitiesFor('early');

  // ── Phase B: play Piecies + place Personal Quests, best cards first ──────
  const handSnapshot = [...(state.players[botPlayerId]?.hand || [])];
  const playable = handSnapshot
    .filter(c => c.type === 'PIECIE'
      || (c.type === 'QUEST'
        && QUEST_LOOKUP[c.cardId]?.questType === 'PERSONAL'
        && canAttemptPersonalQuest(QUEST_LOOKUP[c.cardId], state, botPlayerId)))
    .sort((a, b) => playPriority(a) - playPriority(b));
  for (const cardRef of playable) {
    if (finished()) break;
    if (cardRef.type === 'QUEST') {
      const result = playPersonalQuest(state, botPlayerId, cardRef);
      if (result.success) {
        state = result.state;
        push(`places Personal Quest face-down: ${QUEST_LOOKUP[cardRef.cardId]?.name ?? cardRef.cardId}`);
      } else if (result.error && /slot|full/i.test(result.error)) {
        break;
      }
      continue;
    }
    const cardDef = PIECIE_LOOKUP[cardRef.cardId];
    if (!cardDef) continue;
    const result = playPiecie(state, botPlayerId, cardRef, cardDef);
    if (result.success) {
      state = result.state;
      push(`plays ${cardDef.name}`);
    } else if (result.error && /slot|full/i.test(result.error)) {
      break; // No more room — stop trying
    }
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
    if (state.turnNumber < (slots[idx].canActivateOnTurn ?? Infinity)) continue;
    const result = activatePiecie(state, botPlayerId, idx);
    if (result.success) {
      state = result.state;
      state = resolveBotVarkenspootjesPending(state, botPlayerId);
      if (entry.tags.some(t => t === 'multiplier' || t === 'mp-gain' || t === 'quest-prep')) {
        setupActivations += 1;
      }
      push(`activates ${entry.cardId.replace('piecie_', '').replace(/_/g, ' ')}`);
    }
  }

  // ── Phase D: preQuest abilities ───────────────────────────────────────────
  if (!finished()) useAbilitiesFor('preQuest');

  // ── Phase E: quest phase ──────────────────────────────────────────────────
  if (!finished()) runQuestPhase();

  // ── Phase F: play a Place, then activate a face-down Place ───────────────
  if (!finished()) {
    for (const cardRef of [...(state.players[botPlayerId]?.hand || [])]) {
      if (cardRef.type !== 'PLACE') continue;
      const cardDef = PLACE_LOOKUP[cardRef.cardId];
      if (!cardDef) continue;
      const result = playPlace(state, botPlayerId, cardRef, cardDef);
      if (result.success) {
        state = result.state;
        push(`plays Place: ${cardDef.name}`);
        break;
      }
    }
    const slotsForPlace = state.players[botPlayerId]?.piecieSlots || [];
    for (let i = 0; i < slotsForPlace.length; i++) {
      const slot = slotsForPlace[i];
      if (!slot || slot.type !== 'PLACE' || slot.activated) continue;
      if (state.turnNumber < (slot.canActivateOnTurn ?? Infinity)) continue;
      const result = activatePlace(state, botPlayerId, i);
      if (result.success) {
        state = result.state;
        push(`activates Place: ${slot.cardId.replace('place_', '').replace(/_/g, ' ')}`);
        break;
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

  // ── Quest phase internals (closures over state/steps/profile) ────────────

  // Pick the best Mosje slot to attempt questDef with. Returns
  // { targetSlotIndex, decision } — decision may say attempt:false.
  function bestQuestSlot(questDef) {
    const player = state.players[botPlayerId];
    const requiredId = questDef.requiredMosjeId || null;
    const perMosjeIds = questDef.perMosjeConfig ? Object.keys(questDef.perMosjeConfig) : null;
    let best = { targetSlotIndex: -1, decision: null };
    (player.activeSlots || []).forEach((slot, i) => {
      if (!slot || slot.isDefeated) return;
      if (requiredId && slot.cardId !== requiredId) return;
      if (perMosjeIds && !perMosjeIds.includes(slot.cardId)) return;
      const decision = assessQuestRisk({
        questDef, mosje: slot, slotIndex: i, gameState: state, playerId: botPlayerId, profile,
      });
      const better = !best.decision
        || (decision.attempt && !best.decision.attempt)
        || (decision.attempt === best.decision.attempt
          && (decision.pSuccess > best.decision.pSuccess
            || (decision.pSuccess === best.decision.pSuccess && slot.mp > (player.activeSlots[best.targetSlotIndex]?.mp || 0))));
      if (better) best = { targetSlotIndex: i, decision };
    });
    return best;
  }

  function attemptQuestWithRoll(questDef, targetSlotIndex, kind) {
    state = loseMP(state, botPlayerId, targetSlotIndex, QUEST_ATTEMPT_COST, 'QUEST_COST');
    const player = state.players[botPlayerId];
    const resolveDef = questDefWithPerMosje(questDef, player.activeSlots[targetSlotIndex], player);
    const rollRes = rollBotQuestDice(state, botPlayerId, resolveDef, targetSlotIndex);
    state = rollRes.state;
    state = resolveQuest(state, botPlayerId, resolveDef, rollRes.didSucceed, targetSlotIndex);
    let label = `quests "${questDef.name}" — roll ${rollRes.roll}`
      + (rollRes.diceBonus ? `+${rollRes.diceBonus}` : '')
      + ` vs ${rollRes.threshold}+ → ${rollRes.didSucceed ? '✓ success' : '✗ failed'}`;
    if (state._autoAbilityLog) {
      label += ` · ${state._autoAbilityLog.label}`;
      delete state._autoAbilityLog;
    }
    emitBotMetric('quest-roll', {
      kind,
      deck: profile.deckId,
      quest: questDef.id,
      roll: rollRes.roll,
      bonus: rollRes.diceBonus,
      threshold: rollRes.threshold,
      success: rollRes.didSucceed,
    });
    return label;
  }

  function runQuestPhase() {
    const player = state.players[botPlayerId];
    if (!player) return;
    const firstActive = (player.activeSlots || []).find(s => s && !s.isDefeated);
    if (!firstActive) return;
    if (firstActive.statusEffects?.some(e => e.type === 'QUEST_BLOCKED')) {
      emitBotMetric('quest-skip', { kind: 'blocked', deck: profile.deckId, reason: 'quest-blocked' });
      return;
    }

    // E1: a ready Personal Quest on the field beats a blind General draw.
    const fieldSlots = player.piecieSlots || [];
    for (let i = 0; i < fieldSlots.length; i++) {
      const s = fieldSlots[i];
      if (!s || s.type !== 'QUEST') continue;
      if (state.turnNumber < (s.canActivateOnTurn ?? Infinity)) continue;
      const questDef = QUEST_LOOKUP[s.cardId];
      if (!questDef || !canAttemptPersonalQuest(questDef, state, botPlayerId)) continue;
      const { targetSlotIndex, decision } = bestQuestSlot(questDef);
      emitBotMetric('quest-decision', {
        kind: 'personal',
        deck: profile.deckId,
        quest: questDef.id,
        attempt: !!decision?.attempt,
        reason: decision?.reason ?? 'no-slot',
        p: decision?.pSuccess ?? 0,
        need: decision?.requiredP,
        mp: player.activeSlots[targetSlotIndex]?.mp ?? null,
        setupActs: setupActivations,
      });
      if (!decision?.attempt) continue; // leave face-down for a better turn
      const act = activatePersonalQuest(state, botPlayerId, i);
      if (!act.success) continue;
      state = act.state;
      const label = attemptQuestWithRoll(questDef, targetSlotIndex, 'personal');
      push(label);
      return;
    }

    // E2: General Quest — revealing consumes the attempt, so only reveal
    // when at least one Mosje can pay the 20 MP cost.
    const anyAffordable = (player.activeSlots || [])
      .some(s => s && !s.isDefeated && (s.mp || 0) >= QUEST_ATTEMPT_COST);
    if (!anyAffordable) {
      emitBotMetric('quest-skip', { kind: 'general', deck: profile.deckId, reason: 'cannot-afford-cost' });
      return;
    }
    const revealed = attemptGeneralQuest(state);
    state = revealed.state;
    const questCard = revealed.questCard;
    if (!questCard) return;
    const questDef = QUEST_LOOKUP[questCard.cardId];
    const discardQuest = () => {
      state = {
        ...state,
        sharedGeneralQuestDiscard: [...(state.sharedGeneralQuestDiscard || []), questCard],
      };
    };
    if (!questDef || !canAttemptGeneralQuest(questDef, state, botPlayerId)) {
      discardQuest();
      emitBotMetric('quest-skip', {
        kind: 'general', deck: profile.deckId, quest: questCard.cardId, reason: 'requirement-not-met',
      });
      return;
    }
    const { targetSlotIndex, decision } = bestQuestSlot(questDef);
    emitBotMetric('quest-decision', {
      kind: 'general',
      deck: profile.deckId,
      quest: questDef.id,
      attempt: !!decision?.attempt,
      reason: decision?.reason ?? 'no-slot',
      p: decision?.pSuccess ?? 0,
      need: decision?.requiredP,
      mp: player.activeSlots[targetSlotIndex]?.mp ?? null,
      setupActs: setupActivations,
    });
    if (!decision?.attempt) {
      discardQuest();
      push(`skips quest "${questDef.name}" (${Math.round((decision?.pSuccess ?? 0) * 100)}% chance, needs ${Math.round((decision?.requiredP ?? 1) * 100)}%)`);
      return;
    }
    const label = attemptQuestWithRoll(questDef, targetSlotIndex, 'general');
    discardQuest();
    push(label);
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
