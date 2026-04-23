// questLogic.js — Checks whether a Quest's requirements are met
// and applies MP rewards or penalties after the dice roll.
//
// canAttemptPersonalQuest() is implemented here now (Phase 2 update).
// Full requirement/reward functions are filled in Phase 4.

import { rollDie } from '../engine/deckEngine.js';
import { gainMP, loseMP } from '../engine/mpManager.js';
import { applyPlaceEffectsOnQuest } from '../engine/turnManager.js';
import { getSynergyChamberDiceBonus } from './placeEffects.js';

console.log('[ABILITY] questLogic.js loaded');

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function getFirstActiveMosjeSlotIndex(player) {
  return player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
}

function getFirstActiveMosje(player) {
  const idx = getFirstActiveMosjeSlotIndex(player);
  return idx >= 0 ? player.activeSlots[idx] : null;
}

function getActiveMosjes(player) {
	return (player?.activeSlots || []).filter(slot => slot && !slot.isDefeated);
}

function hasActiveMosjeCard(gameState, playerId, cardId) {
	return getActiveMosjes(gameState?.players?.[playerId]).some(m => m.cardId === cardId);
}

export function getMosjeTrait(gameState, playerId, activeMosjeId, traitName) {
	const trait = String(traitName || '').toLowerCase();
	const player = gameState?.players?.[playerId];
	if (!player || !trait) return 0;
	const slot = (player.activeSlots || []).find(s => s && !s.isDefeated && s.cardId === activeMosjeId);
	return Number(slot?.traits?.[trait] || 0);
}

export function checkTraitRoll(gameState, playerId, activeMosjeId, traitName, thresholds, fallbackThreshold = 5) {
	const roll = rollDie();
	const rating = getMosjeTrait(gameState, playerId, activeMosjeId, traitName);
	let threshold = fallbackThreshold;

	if (Array.isArray(thresholds) && thresholds.length) {
		threshold = fallbackThreshold;
		for (const entry of thresholds) {
			if (rating >= Number(entry.rating || 0)) {
				threshold = Number(entry.threshold || fallbackThreshold);
				break;
			}
		}
	}

	return {
		canAttempt: true,
		diceRoll: roll,
		threshold,
		success: roll >= threshold,
	};
}

function getTraitFromMosje(mosje, traitName) {
	return Number(mosje?.traits?.[traitName] || 0);
}

function applyQuestMpResult(mosje, questCard, didSucceed) {
  if (didSucceed) {
    mosje.mp += questCard.successMP;
    return;
  }
  const failValue = typeof questCard.failMP === 'number'
    ? questCard.failMP
    : (typeof questCard.failureMP === 'number' ? questCard.failureMP : 0);
  mosje.mp += failValue;
}

// General Quests can be attempted by any active Mosje with non-negative MP.
export function canAttemptGeneralQuest(questCard, gameState, playerId) {
  console.log('[QUEST] Checking General Quest eligibility:', questCard.id);
  const player = gameState.players[playerId];
  if (!player) return false;
  const activeMosje = getFirstActiveMosje(player);
  if (!activeMosje) {
    console.log('[QUEST] No active Mosje on field — cannot attempt General Quest');
    return false;
  }
  if (activeMosje.mp < 0) {
    console.log('[QUEST] Active Mosje has negative MP — cannot attempt General Quest');
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// canAttemptPersonalQuest
// Checks whether the player has the required Mosje on the field
// before they are allowed to attempt a Personal Quest.
//
// questCard   — the PERSONAL Quest card object from QUESTS array
// gameState   — the full game state object
// playerId    — the id of the player trying to attempt
//
// Returns true if allowed, false if not.
// ─────────────────────────────────────────────────────────────
export function canAttemptPersonalQuest(questCard, gameState, playerId) {
  console.log('[QUEST] Checking Personal Quest eligibility:', questCard.id);

  const player = gameState.players[playerId];
  if (!player) {
    console.log('[QUEST] Player not found:', playerId);
    return false;
  }

  // activeSlots contains Mosje state objects with a cardId property.
  // Defeated Mosjes do NOT count as active for Personal Quest checks.
	const activeMosjes = player.activeSlots.filter(
    slot => slot !== null && !slot.isDefeated
  );
  const hasRequiredMosje = activeMosjes.some(
    mosje => mosje.cardId === questCard.requiredMosjeId
  );

  if (!hasRequiredMosje) {
    console.log(
      '[QUEST] Required Mosje not on field — cannot attempt.',
      'Needs:', questCard.requiredMosjeId
    );
    return false;
  }

	// Additional requirement checks for specific Personal Quests.
	if (questCard.requirementId === 'quest_req_iron_will') {
		const totalDamageTaken = gameState.players[playerId].totalDamageTaken || 0;
		if (totalDamageTaken < 40) {
			console.log('[QUEST] Iron Will blocked — not enough total damage taken:', totalDamageTaken);
			return false;
		}
	}

	if (questCard.requirementId === 'quest_req_perfect_sync') {
		const hasWest = hasActiveMosjeCard(gameState, playerId, 'mosje_west');
		const hasCoert = hasActiveMosjeCard(gameState, playerId, 'mosje_coert_tech');
		if (!hasWest || !hasCoert) {
			console.log('[QUEST] Perfect Sync blocked — West + Coert both required');
			return false;
		}
	}

	if (questCard.requirementId === 'quest_req_lucky_crescendo') {
		const placeId = gameState?.activePlace;
		if (placeId !== 'place_skiffa') {
			console.log('[QUEST] Lucky Crescendo blocked — Skiffa must be active Place');
			return false;
		}
	}

  console.log('[QUEST] Personal Quest eligible — required Mosje is on field.');
  return true;
}

// ─────────────────────────────────────────────────────────────
// getQuestDiceThreshold
// Returns the minimum die result (1–6) needed for success.
// A return value of 7 means the quest cannot be attempted
// (e.g. Artistic Expression without the required trait).
//
// questCard    — full quest card definition from QUESTS data
// activeMosje  — the live Mosje slot object (has .traits)
// ─────────────────────────────────────────────────────────────
export function getQuestDiceThreshold(questCard, activeMosje) {
  const roll = questCard.roll;
  if (!roll) return 1; // no dice roll (auto-success or UI prompt)

  if (roll.trait) {
    const stars = Math.min(3, Math.max(1, Number(activeMosje?.traits?.[roll.trait] || 1)));
    return roll.thresholds[stars] ?? 4;
  }

  return roll.thresholds[1] ?? 4;
}

// Resolves the MP result of a quest and updates completion counters.
// The caller provides didSucceed after rolling/checking requirements.
export function resolveQuest(gameState, playerId, questCard, didSucceed, targetSlotIndex = -1) {
	let state = cloneState(gameState);
	const damageTotalsBefore = Object.fromEntries(
		Object.entries(state.players || {}).map(([pid, playerState]) => [pid, Number(playerState?.totalDamageTaken || 0)])
	);
	const player = state.players[playerId];
  if (!player) {
    console.log('[QUEST] resolveQuest: player not found:', playerId);
    return state;
  }

  const firstActive = getFirstActiveMosjeSlotIndex(player);
  if (firstActive < 0) {
    console.log('[QUEST] resolveQuest: no active Mosje found for player:', playerId);
    return state;
  }
  const isValidTarget = (
    typeof targetSlotIndex === 'number' &&
    targetSlotIndex >= 0 &&
    player.activeSlots[targetSlotIndex] &&
    !player.activeSlots[targetSlotIndex].isDefeated
  );
  const slotIndex = isValidTarget ? targetSlotIndex : firstActive;

	// Perfect Sync auto-succeeds when requirement gate passed.
	if (questCard.requirementId === 'quest_req_perfect_sync') {
		didSucceed = true;
	}

	// The Void nullifies direct Quest MP gain/loss; quest still resolves.
	const baseQuestMpBlocked = state.activePlace === 'place_the_void';

	if (!baseQuestMpBlocked) {
		if (didSucceed) {
			state = gainMP(state, playerId, slotIndex, questCard.successMP);
		} else {
			const failValue = Math.abs(typeof questCard.failMP === 'number' ? questCard.failMP : 0);
			state = loseMP(state, playerId, slotIndex, failValue, 'QUEST');
		}
	}

  if (didSucceed) {
		state.players[playerId].questsCompleted += 1;
		state.players[playerId].questsCompletedThisTurn += 1;

		// Apply active Place bonuses/penalties for quest success.
		state = applyPlaceEffectsOnQuest(state, playerId, questCard, true);

		// Placeholder hook for persistent Piecies that react to quest outcomes.
		state = applyPiecieFieldEffectsOnQuest(state, playerId, true);

		// Personal quest side effects.
		state = resolvePersonalQuestSideEffects(state, questCard, playerId);

		const liveMosje = state.players[playerId].activeSlots[slotIndex];
		console.log('[QUEST] Quest success:', questCard.id, '| MP now:', liveMosje?.mp);
  } else {
		// Apply active Place bonuses/penalties for quest failure.
		state = applyPlaceEffectsOnQuest(state, playerId, questCard, false);

		const liveMosje = state.players[playerId].activeSlots[slotIndex];
		console.log('[QUEST] Quest failed:', questCard.id, '| MP now:', liveMosje?.mp);
  }

	state = enqueueAadRecoveryPrompt(state, questCard, damageTotalsBefore);
  return state;
}

function applyPiecieFieldEffectsOnQuest(gameState, playerId, didSucceed) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	// Current engine does not store fully modeled face-up piecie state yet.
	// Keep this hook so quest-reactive persistent Piecies can be added safely.
	const faceUpPiecies = (player.piecieSlots || []).filter(slot => !!slot && slot.faceDown === false);
	for (const piecie of faceUpPiecies) {
		console.log('[QUEST] Checked active Piecie field effect:', piecie.cardId, '| success:', didSucceed);
	}
	return state;
}

function resolvePersonalQuestSideEffects(gameState, questCard, playerId) {
	let state = cloneState(gameState);

	if (questCard.id === 'quest_personal_perfect_sync' && state.activeQuest) {
		const opponentId = Object.keys(state.players || {}).find(pid => pid !== playerId);
		const revealedOpponentHandNames = opponentId
			? (state.players[opponentId]?.hand || []).map(card => card.cardId || card.id || 'Unknown card')
			: [];
		state.activeQuest = {
			...state.activeQuest,
			revealOpponentHand: true,
			revealedOpponentHandNames,
		};
		console.log('[QUEST] Perfect Sync side effect — opponent hand revealed');
	}

	if (questCard.id === 'quest_personal_lucky_crescendo') {
		for (const [pid, player] of Object.entries(state.players)) {
			if (pid === playerId) continue;
			player.activeSlots.forEach((slot, slotIndex) => {
				if (slot && !slot.isDefeated) {
					state = loseMP(state, pid, slotIndex, 20);
				}
			});
		}
		console.log('[QUEST] Lucky Crescendo side effect — all opponents lose 20 MP');
	}

	return state;
}

function enqueueAadRecoveryPrompt(gameState, questCard, damageTotalsBefore) {
	const state = cloneState(gameState);
	if (questCard?.id !== 'quest_geen_raad_vraag_aad') {
		return state;
	}

	const before = damageTotalsBefore || {};
	const eligiblePlayerIds = Object.entries(state.players || {})
		.filter(([pid, player]) => {
			const damageBefore = Number(before[pid] || 0);
			const damageAfter = Number(player?.totalDamageTaken || 0);
			const handSize = Array.isArray(player?.hand) ? player.hand.length : 0;
			return damageAfter > damageBefore && handSize > 0;
		})
		.map(([pid]) => pid);

	if (!eligiblePlayerIds.length) {
		return state;
	}

	const existing = state._pendingAadRecovery || {};
	const mergedEligible = [...new Set([
		...(Array.isArray(existing.eligiblePlayerIds) ? existing.eligiblePlayerIds : []),
		...eligiblePlayerIds,
	])];
	const resolved = Array.isArray(existing.resolvedPlayerIds) ? existing.resolvedPlayerIds : [];

	state._pendingAadRecovery = {
		questId: 'quest_geen_raad_vraag_aad',
		mpGain: 40,
		discardCount: 1,
		eligiblePlayerIds: mergedEligible,
		resolvedPlayerIds: resolved.filter(pid => mergedEligible.includes(pid)),
	};
	return state;
}

// ─────────────────────────────────────────
// QUEST REQUIREMENT IMPLEMENTATIONS
// All return { canAttempt: true/false, diceRoll: number?, threshold: number?, success: true/false? }
// ─────────────────────────────────────────

// PHYSICAL QUESTS
export function quest_req_arm_wrestling(questCard, mosje) {
	return checkTraitRoll(
		{ players: { _tmp: { activeSlots: [{ cardId: mosje?.cardId || '_tmp', traits: mosje?.traits || {}, isDefeated: false }] } } },
		'_tmp',
		mosje?.cardId || '_tmp',
		'physical',
		[
			{ rating: 3, threshold: 2 },
			{ rating: 2, threshold: 3 },
		],
		5
	);
}

export function quest_req_parkour_challenge(questCard, mosje) {
	const roll = rollDie();
	const physical = mosje.traits?.physical || 0;
	let threshold;
	if (physical >= 3) threshold = 2;
	else if (physical >= 2) threshold = 4;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_endurance_test(questCard, mosje) {
	const roll = rollDie();
	const physical = mosje.traits?.physical || 0;
	const resilient = mosje.traits?.resilient || 0;
	let threshold;
	if (physical >= 3) threshold = 3;
	else if (physical >= 2) threshold = 4;
	else threshold = 5;
	if (resilient >= 2) threshold -= 1;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_sprint_race(questCard, mosje) {
	const roll = rollDie();
	const physical = mosje.traits?.physical || 0;
	let threshold;
	if (physical >= 3) threshold = 2;
	else if (physical >= 2) threshold = 4;
	else threshold = 6;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

// MENTAL QUESTS
export function quest_req_quick_thinking(questCard, mosje) {
	return checkTraitRoll(
		{ players: { _tmp: { activeSlots: [{ cardId: mosje?.cardId || '_tmp', traits: mosje?.traits || {}, isDefeated: false }] } } },
		'_tmp',
		mosje?.cardId || '_tmp',
		'mental',
		[
			{ rating: 3, threshold: 3 },
			{ rating: 2, threshold: 4 },
		],
		5
	);
}

export function quest_req_strategy_puzzle(questCard, mosje) {
	const roll = rollDie();
	const mental = mosje.traits?.mental || 0;
	let threshold;
	if (mental >= 3) threshold = 2;
	else if (mental >= 2) threshold = 3;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_calculate_odds(questCard, mosje) {
	const roll = rollDie();
	const mental = mosje.traits?.mental || 0;
	const technical = mosje.traits?.technical || 0;
	let threshold;
	if (mental >= 3) threshold = 3;
	else if (mental >= 2) threshold = 4;
	else threshold = 6;
	if (technical >= 2) threshold -= 1;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_master_plan(questCard, mosje) {
	const roll = rollDie();
	const mental = mosje.traits?.mental || 0;
	let threshold;
	if (mental >= 3) threshold = 3;
	else if (mental >= 2) threshold = 5;
	else threshold = 6;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

// SOCIAL QUESTS
export function quest_req_inspire_crowd(questCard, mosje) {
	const roll = rollDie();
	const social = mosje.traits?.social || 0;
	let threshold;
	if (social >= 3) threshold = 2;
	else if (social >= 2) threshold = 3;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_form_alliance(questCard, mosje) {
	const roll = rollDie();
	const social = mosje.traits?.social || 0;
	let threshold;
	if (social >= 3) threshold = 3;
	else if (social >= 2) threshold = 4;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_negotiation(questCard, mosje) {
	const roll = rollDie();
	const social = mosje.traits?.social || 0;
	let threshold;
	if (social >= 3) threshold = 2;
	else if (social >= 2) threshold = 4;
	else threshold = 6;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_team_building(questCard, mosje) {
	const roll = rollDie();
	const social = mosje.traits?.social || 0;
	let threshold;
	if (social >= 3) threshold = 2;
	else if (social >= 2) threshold = 3;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

// CREATIVE QUESTS
export function quest_req_artistic_expression(questCard, mosje) {
	const creative = mosje.traits?.creative || 0;
	// Requires Creative ★★ + draw 2 cards (checked by caller)
	const canAttempt = creative >= 2;
	return { canAttempt, success: canAttempt };
}

export function quest_req_improvise(questCard, mosje) {
	const roll = rollDie();
	const creative = mosje.traits?.creative || 0;
	let threshold;
	if (creative >= 3) threshold = 2;
	else if (creative >= 2) threshold = 3;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_create_masterpiece(questCard, mosje) {
	const roll = rollDie();
	const creative = mosje.traits?.creative || 0;
	let threshold;
	if (creative >= 3) threshold = 3;
	else if (creative >= 2) threshold = 4;
	else threshold = 6;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_lucky_break(questCard, mosje) {
	const roll = rollDie();
	// 1-2 = fail, 3-4 = partial, 5-6 = success
	// For simplicity, 1-2 = fail, 3+ = succeed
	return { canAttempt: true, diceRoll: roll, threshold: 3, success: roll >= 3 };
}

// TECHNICAL QUESTS
export function quest_req_debug_system(questCard, mosje) {
	return checkTraitRoll(
		{ players: { _tmp: { activeSlots: [{ cardId: mosje?.cardId || '_tmp', traits: mosje?.traits || {}, isDefeated: false }] } } },
		'_tmp',
		mosje?.cardId || '_tmp',
		'technical',
		[
			{ rating: 3, threshold: 2 },
			{ rating: 2, threshold: 3 },
		],
		5
	);
}

export function quest_req_hack_mainframe(questCard, mosje) {
	const roll = rollDie();
	const technical = mosje.traits?.technical || 0;
	let threshold;
	if (technical >= 3) threshold = 3;
	else if (technical >= 2) threshold = 4;
	else threshold = 6;
	// Hacker/FPS Mosje: -1 threshold (name-based check)
	const isHacker = mosje.mosjeId && (mosje.mosjeId.toLowerCase().includes('hacker') || mosje.mosjeId.toLowerCase().includes('fps'));
	if (isHacker) threshold -= 1;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_build_gadget(questCard, mosje) {
	const roll = rollDie();
	const technical = mosje.traits?.technical || 0;
	let threshold;
	if (technical >= 3) threshold = 2;
	else if (technical >= 2) threshold = 3;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_precision_work(questCard, mosje) {
	const roll = rollDie();
	const technical = mosje.traits?.technical || 0;
	const creative = mosje.traits?.creative || 0;
	let threshold;
	if (technical >= 3) threshold = 3;
	else if (technical >= 2) threshold = 4;
	else threshold = 5;
	if (creative >= 2) threshold -= 1;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

// RESILIENT QUESTS
export function quest_req_leap_of_faith(questCard, mosje) {
	const roll = rollDie();
	// 1-3 = fail, 4-6 = success
	return { canAttempt: true, diceRoll: roll, threshold: 4, success: roll >= 4 };
}

export function quest_req_survive_storm(questCard, mosje) {
	return checkTraitRoll(
		{ players: { _tmp: { activeSlots: [{ cardId: mosje?.cardId || '_tmp', traits: mosje?.traits || {}, isDefeated: false }] } } },
		'_tmp',
		mosje?.cardId || '_tmp',
		'resilient',
		[
			{ rating: 3, threshold: 2 },
			{ rating: 2, threshold: 3 },
		],
		5
	);
}

export function quest_req_endure_pain(questCard, mosje) {
	// Auto-succeed at 20 MP or less
	if (mosje.mp <= 20) return { canAttempt: true, success: true, autoSuccess: true };
	const roll = rollDie();
	const resilient = mosje.traits?.resilient || 0;
	let threshold;
	if (resilient >= 3) threshold = 2;
	else if (resilient >= 2) threshold = 3;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_never_give_up(questCard, mosje) {
	// Auto-succeed if below 30 MP
	if (mosje.mp < 30) return { canAttempt: true, success: true, autoSuccess: true };
	const roll = rollDie();
	// Otherwise: roll 4+
	return { canAttempt: true, diceRoll: roll, threshold: 4, success: roll >= 4 };
}

export function quest_req_tough_it_out(questCard, mosje) {
	const roll = rollDie();
	const resilient = mosje.traits?.resilient || 0;
	let threshold;
	if (resilient >= 3) threshold = 2;
	else if (resilient >= 2) threshold = 3;
	else threshold = 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

// MIXED/SPECIAL QUESTS
export function quest_req_momentum_master(questCard, mosje, gameState) {
	// Must have used 2+ Piecies this turn
	const pieciesUsed = gameState?.players[gameState.activePlayerId]?.pieciesPlayedThisTurn || 0;
	if (pieciesUsed < 2) return { canAttempt: false };
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 3, success: roll >= 3 };
}

export function quest_req_the_gauntlet(questCard, mosje) {
	// Roll twice. Both must succeed (Physical and Mental thresholds)
	const roll1 = rollDie();
	const roll2 = rollDie();
	const physical = mosje.traits?.physical || 0;
	const mental = mosje.traits?.mental || 0;
	const physicalThreshold = physical >= 2 ? 3 : 5;
	const mentalThreshold = mental >= 2 ? 3 : 5;
	const success = roll1 >= physicalThreshold && roll2 >= mentalThreshold;
	return { canAttempt: true, diceRoll1: roll1, threshold1: physicalThreshold, diceRoll2: roll2, threshold2: mentalThreshold, success };
}

export function quest_req_ultimate_challenge(questCard, mosje) {
	// Roll 5+. Must have 3 main traits (Physical + Mental + Creative or similar)
	const physical = mosje.traits?.physical || 0;
	const mental = mosje.traits?.mental || 0;
	const creative = mosje.traits?.creative || 0;
	const hasThreeTraits = physical >= 1 && mental >= 1 && creative >= 1;
	if (!hasThreeTraits) return { canAttempt: false };
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 5, success: roll >= 5 };
}

export function quest_req_speed_run(questCard, mosje, gameState, isFirstAction) {
	// Must be first action of turn
	if (!isFirstAction) return { canAttempt: false };
	const roll = rollDie();
	const technical = mosje.traits?.technical || 0;
	const threshold = technical >= 3 ? 3 : 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_sustained_assault(questCard, mosje, gameState) {
	// Must have used an ATTACK Piecie this turn
	const attackUsed = gameState?.players[gameState.activePlayerId]?.lastCardPlayedType === 'ATTACK' || false;
	if (!attackUsed) return { canAttempt: false };
	const roll = rollDie();
	const physical = mosje.traits?.physical || 0;
	let threshold;
	if (physical >= 3) threshold = 2;
	else if (physical >= 2) threshold = 3;
	else threshold = 4;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_perfect_timing(questCard, mosje) {
	if (questCard?.activePlace === 'place_momentum_stabilizer') {
		return { canAttempt: true, success: true, autoSuccess: true };
	}

	// Roll exactly 6 (no threshold, must be exact match)
	const raw = rollDie();
	const roll = raw + getSynergyChamberDiceBonus(questCard?.gameState || null);
	return { canAttempt: true, diceRoll: roll, threshold: 6, exact: true, success: roll === 6 };
}

export function quest_req_elimination_challenge(questCard, mosje) {
	// Roll 4+. On success: opponent loses 30 MP + you gain 30 MP
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 4, success: roll >= 4, isElimination: true };
}

export function quest_req_chain_master(questCard, mosje, gameState) {
	// Must have 3+ Piecies in discard this turn
	const discard = gameState?.players[gameState.activePlayerId]?.discard || [];
	// Count Piecies played this turn (newly added to discard)
	const pieciesInDiscard = discard.filter(c => c.type === 'PIECIE').length;
	if (pieciesInDiscard < 3) return { canAttempt: false };
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 3, success: roll >= 3 };
}

export function quest_req_synergy_mastery(questCard, mosje, gameState) {
	// Check if synergy Mosje is on field (simplified: just check if any Mosje has synergy trait)
	const player = gameState?.players[gameState.activePlayerId];
	const hasSynergyMosje = player?.activeSlots.some(slot => slot && !slot.isDefeated && (slot.traits?.synergy >= 1));
	const threshold = hasSynergyMosje ? 3 : 5;
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

// DUTCH SPECIAL QUESTS
export function quest_req_regelaar(questCard, mosje) {
	const social = getTraitFromMosje(mosje, 'social');
	let threshold;
	if (social >= 3) return { canAttempt: true, success: true, autoSuccess: true }; // auto-succeed
	else if (social >= 2) threshold = 3;
	else threshold = 5;
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_late_night_questing(questCard, mosje) {
	// Roll 3+. Success draws 2 extra cards
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 3, success: roll >= 3, drawExtra: 2 };
}

export function quest_req_larry_temmen(questCard, mosje) {
	// Roll 1d6: 1-2 = both lose 20, 3-4 = nothing, 5-6 = gain 40 + opponent -20
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, isSpecial: true, success: roll >= 5 };
}

export function quest_req_geen_raad_vraag_aad(questCard, mosje) {
	// Select card type in UI, then compare against opponent hand types.
	return {
		canAttempt: true,
		requiresUIPrompt: true,
		promptType: 'SELECT_CARD_TYPE',
		requiresHiddenOpponentCard: true,
		allowedTypes: ['QUEST_PERSONAL', 'PIECIE', 'PLACE', 'MOSJE', 'SNELLE_PIECIE'],
	};
}

export function quest_req_parkeren_delft(questCard, mosje) {
	const roll = rollDie();
	const technical = getTraitFromMosje(mosje, 'technical');
	const threshold = technical >= 3 ? 3 : 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_shotje_obby(questCard, mosje, gameState) {
	// Roll 4+. At Obby #1 Place: auto-succeed
	const currentPlace = gameState?.activePlace;
	if (currentPlace?.id === 'place_obby_1') return { canAttempt: true, success: true, autoSuccess: true };
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 4, success: roll >= 4 };
}

// PERSONAL QUESTS
export function quest_req_west_perfect_read(questCard, mosje) {
	// Correctly name the type of the top 3 cards of any deck (UI prompt required)
	return { canAttempt: true, requiresUIPrompt: true, promptType: 'GUESS_CARD_TYPES', cardCount: 3 };
}

export function quest_req_iron_will(gameState, playerId) {
	console.log('[QUEST] Iron Will requirement check');
	const jeffreyActive = hasActiveMosjeCard(gameState, playerId, 'mosje_jeffrey');
	if (!jeffreyActive) {
		return { canAttempt: false, reason: 'Jeffrey The Strongman must be on your field.' };
	}

	const totalDamageTaken = gameState.players[playerId]?.totalDamageTaken || 0;
	if (totalDamageTaken < 40) {
		return {
			canAttempt: false,
			reason: `You need to have taken 40+ MP damage this game (currently: ${totalDamageTaken}).`,
		};
	}

	const roll = rollDie();
	return {
		canAttempt: true,
		diceRoll: roll,
		threshold: 4,
		success: roll >= 4,
	};
}

export function quest_req_perfect_sync(gameState, playerId) {
	console.log('[QUEST] Perfect Sync requirement check');
	const westActive = hasActiveMosjeCard(gameState, playerId, 'mosje_west');
	const coertActive = hasActiveMosjeCard(gameState, playerId, 'mosje_coert_tech');

	if (!westActive) return { canAttempt: false, reason: '[West] Sr.Tactical must be on your field.' };
	if (!coertActive) return { canAttempt: false, reason: '[Coert] The Tech Savant must be on your field.' };

	return {
		canAttempt: true,
		success: true,
		diceRoll: null,
		threshold: null,
	};
}

export function quest_req_lucky_crescendo(gameState, playerId) {
	console.log('[QUEST] Lucky Crescendo requirement check');
	const djActive = hasActiveMosjeCard(gameState, playerId, 'mosje_dj_8020');
	if (!djActive) {
		return { canAttempt: false, reason: '[DJ 80/20] The Lucky Mixer must be on your field.' };
	}

	if (gameState?.activePlace !== 'place_skiffa') {
		return { canAttempt: false, reason: 'Skiffa must be the active Place card.' };
	}

	const roll = rollDie();
	return {
		canAttempt: true,
		diceRoll: roll,
		threshold: 5,
		success: roll >= 5,
		allowReroll: true,
		rerollSource: 'mosje_dj_8020',
	};
}

