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
	// Eendjes Voeren Place: treat resilient as ★★★ (max 3) for all Mosjes while active
	if (trait === 'resilient' && gameState?.activePlace === 'place_eendjes_voeren') {
		return 3;
	}
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
// Cards with extra preconditions (e.g. Momentum Master) are enforced here too.
export function canAttemptGeneralQuest(questCard, gameState, playerId) {
  console.log('[QUEST] Checking General Quest eligibility:', questCard.id);
  const player = gameState.players[playerId];
  if (!player) return false;
  const activeMosje = getFirstActiveMosje(player);
  if (!activeMosje) {
    console.log('[QUEST] No active Mosje on field — cannot attempt General Quest');
    return false;
  }
  // Block quest attempts when Tikker's QUEST_BLOCKED status is active
  if (activeMosje?.statusEffects?.some(e => e.type === 'QUEST_BLOCKED')) {
    console.log('[QUEST] QUEST_BLOCKED status active — cannot attempt quest this turn');
    return false;
  }
  if (activeMosje.mp < 0) {
    console.log('[QUEST] Active Mosje has negative MP — cannot attempt General Quest');
    return false;
  }
  if (questCard.requirementId === 'quest_req_momentum_master') {
    const mp = activeMosje.mp || 0;
    if (mp < 80 || mp > 100) {
      console.log('[QUEST] Momentum Master blocked — Active Mosje MP not between 80-100:', mp);
      return false;
    }
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

  // Block quest attempts when Tikker's QUEST_BLOCKED status is active
  const firstActiveMosje = getFirstActiveMosje(player);
  if (firstActiveMosje?.statusEffects?.some(e => e.type === 'QUEST_BLOCKED')) {
    console.log('[QUEST] QUEST_BLOCKED status active — cannot attempt personal quest this turn');
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
		const hasWest = hasActiveMosjeCard(gameState, playerId, 'mosje_martin_senor_west');
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

	if (questCard.requirementId === 'quest_req_winston_tijd') {
		if (gameState?.activePlace !== 'place_tesla') {
			console.log('[QUEST] Winston blocked — Tesla must be the active Place');
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
//
// IMPORTANT: This function computes the DISPLAY threshold for the quest modal.
// The actual roll threshold is computed independently by the quest requirement
// function (questCard.requirementId, e.g. quest_req_strategy_puzzle).
// Both code paths MUST agree for every quest and stat level.
// Verified by: tests/engine/quest-threshold.test.ts
// BUG-01 status: static analysis confirmed both paths agree. If the modal
// shows a wrong value at runtime, check that activeMosje passed here is the
// same live object received by the requirement function — a stale reference
// (captured before a stat update) can cause a display/roll disagreement.
// ─────────────────────────────────────────────────────────────
export function getQuestDiceThreshold(questCard, activeMosje) {
  const roll = questCard.roll;
  if (!roll) return 1; // no dice roll (auto-success or UI prompt)

  if (roll.trait) {
    const stars = Math.min(3, Math.max(1, Number(activeMosje?.traits?.[roll.trait] || 1)));
    return roll.thresholds?.[stars] ?? 4;
  }

  return roll.thresholds?.[1] ?? 4;
}

// Resolves the MP result of a quest and updates completion counters.
// The caller provides didSucceed after rolling/checking requirements.
export function resolveQuest(gameState, playerId, questCard, didSucceed, targetSlotIndex = -1) {
	let state = cloneState(gameState);
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

	// Winston Tijd auto-succeeds — Tesla presence already enforced by canAttemptPersonalQuest
	if (questCard.id === 'quest_personal_winston_tijd') {
		didSucceed = true;
	}

	// The Void nullifies direct Quest MP gain/loss; quest still resolves.
	const baseQuestMpBlocked = state.activePlace === 'place_the_void';

	// Perfect Sync defers gainMP to the UI layer (player picks target mosje after seeing opponent hand)
	const defersMPToUI = questCard.id === 'quest_personal_perfect_sync' && didSucceed;

	// Track how much MP was actually gained on success — used by Mosje auto-abilities (e.g. Michelle).
	let questMpGained = 0;

	// Battle Concert: redirect Alyssa's quest-failure damage to an opponent's Mosje (once).
	// When redirected, the normal failMP application below is skipped so Alyssa is not double-hit.
	let failRedirected = false;
	if (!didSucceed && !baseQuestMpBlocked && state._battleConcertActive === playerId) {
		const questingMosje = player.activeSlots[slotIndex];
		const isAlyssa = questingMosje && String(questingMosje.cardId).includes('alyssa');
		if (isAlyssa) {
			const oppId = Object.keys(state.players).find(id => id !== playerId);
			const oppSlotIndex = oppId
				? state.players[oppId].activeSlots.findIndex(s => s && !s.isDefeated)
				: -1;
			const failAmount = Math.abs(questCard.failMP || 0);
			if (oppId && oppSlotIndex >= 0 && failAmount > 0) {
				state = loseMP(state, oppId, oppSlotIndex, failAmount, 'BATTLE_CONCERT');
				delete state._battleConcertActive;
				failRedirected = true;
				console.log('[QUEST] Battle Concert: Alyssa quest-failure damage redirected to opponent');
			}
		}
	}

	if (!baseQuestMpBlocked && !defersMPToUI) {
		// Support both old format (successMP/failMP) and new format (onSuccess/onFailure effects)
		const effects = didSucceed ? (questCard.onSuccess || []) : (questCard.onFailure || []);

		if (effects.length > 0) {
			// Extract MP amounts from effect expressions (new format)
			for (const effect of effects) {
				if (effect.primitive === 'gainMP' && effect.params?.amount) {
					if (didSucceed) questMpGained += effect.params.amount;
					state = gainMP(state, playerId, slotIndex, effect.params.amount);
				} else if (effect.primitive === 'loseMP' && effect.params?.amount && !failRedirected) {
					state = loseMP(state, playerId, slotIndex, effect.params.amount, 'QUEST');
				}
			}
		} else {
			// Fall back to old format (successMP/failMP)
			if (didSucceed) {
				questMpGained = questCard.successMP ?? 0;
				state = gainMP(state, playerId, slotIndex, questCard.successMP);
			} else if (!failRedirected) {
				const failValue = Math.abs(typeof questCard.failMP === 'number' ? questCard.failMP : 0);
				state = loseMP(state, playerId, slotIndex, failValue, 'QUEST');
			}
		}
	}

	// Draw-on-success (quest-def driven). Use FRESH state — gainMP/loseMP above reassigned `state`.
	if (didSucceed && questCard.drawOnSuccess > 0) {
		const p = state.players[playerId];
		for (let i = 0; i < questCard.drawOnSuccess && p.deck.length > 0; i++) {
			p.hand.push(p.deck.shift());
		}
		console.log('[QUEST] drawOnSuccess: drew', questCard.drawOnSuccess);
	}
	// Elimination side-effect: opponent's first active Mosje loses MP on success (skipped under The Void).
	if (didSucceed && !baseQuestMpBlocked && questCard.opponentLoseMP > 0) {
		const oppId = Object.keys(state.players).find(id => id !== playerId);
		const oppSlotIndex = oppId
			? state.players[oppId].activeSlots.findIndex(s => s && !s.isDefeated)
			: -1;
		if (oppId && oppSlotIndex >= 0) {
			state = loseMP(state, oppId, oppSlotIndex, questCard.opponentLoseMP, 'QUEST_ELIMINATION');
			console.log('[QUEST] Elimination Challenge: opponent loses', questCard.opponentLoseMP, 'MP');
		}
	}

	// Mosje auto-abilities that react to quest outcomes (e.g. Michelle Tough Gamble).
	// Fires before Place effects so the modified MP feeds into Quest Haven bonuses.
	state = applyMosjeFieldEffectsOnQuest(state, playerId, slotIndex, questMpGained);

  if (didSucceed) {
		state.players[playerId].questsCompleted += 1;
		state.players[playerId].questsCompletedThisTurn += 1;

		// Apply active Place bonuses/penalties for quest success.
		// Pass slotIndex so Quest Haven (and other places) award the bonus to the
		// correct Mosje — the one that actually completed the quest.
		state = applyPlaceEffectsOnQuest(state, playerId, questCard, true, slotIndex);

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

  return state;
}

// ─────────────────────────────────────────────────────────────
// applyMosjeFieldEffectsOnQuest
// Auto-abilities on the active Mosje that trigger after a quest resolves.
// questMpGained: the raw successMP that was applied (0 on failure/void).
// Attaches state._autoAbilityLog for the UI to surface in the battle log.
// ─────────────────────────────────────────────────────────────
function applyMosjeFieldEffectsOnQuest(gameState, playerId, slotIndex, questMpGained) {
	let state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player || slotIndex < 0) return state;
	const mosje = player.activeSlots[slotIndex];
	if (!mosje || mosje.isDefeated) return state;

	// ── Michelle — Tough Gamble ─────────────────────────────────────────────
	// After each quest: roll d6. 4-6 → double the quest reward. 1-3 → half it.
	// Only modifies success rewards (questMpGained > 0); failure is unaffected.
	if (mosje.cardId === 'mosje_michelle') {
		const roll = rollDie(6);
		let adjustment = 0;
		let label = '';

		if (questMpGained > 0) {
			if (roll >= 4) {
				adjustment = questMpGained;           // add same amount again → 2× total
				mosje.mp += adjustment;
				label = `rolled ${roll} (4+) ✦ DOUBLED! +${adjustment} extra MP (total +${questMpGained * 2})`;
			} else {
				adjustment = -Math.floor(questMpGained / 2);  // take back half → ½ total
				mosje.mp += adjustment;
				label = `rolled ${roll} (1-3) ✦ Halved. ${adjustment} MP (total +${questMpGained + adjustment})`;
			}
		} else {
			label = `rolled ${roll} — no success reward to modify`;
		}

		console.log(`[ABILITY] Michelle Tough Gamble: ${label} | base=${questMpGained} adj=${adjustment} mp=${mosje.mp}`);
		mosje.abilityUsedThisTurn = true;
		state._autoAbilityLog = {
			mosje: mosje.name,
			ability: 'Tough Gamble',
			roll,
			adjustment,
			label: `[Michelle] Tough Gamble: ${label}`,
		};
	}

	// ── Jeffrey The Strongman — Brute Force ────────────────────────────────────
	// Passive: every quest success gives +10 MP. Always active while Jeffrey is
	// on field — no manual activation needed. FOOD/RESTORE block is enforced
	// separately in playPiecie (turnManager.js) also without needing activation.
	if (mosje.cardId === 'mosje_jeffrey' && questMpGained > 0) {
		mosje.mp += 10;
		const label = `Brute Force: +10 MP bonus (total quest gain ${questMpGained + 10})`;
		console.log(`[ABILITY] Jeffrey ${label} | mp=${mosje.mp}`);
		// Append to existing auto-ability log if Michelle also fired (edge case),
		// otherwise start a new entry.
		if (state._autoAbilityLog) {
			state._autoAbilityLog.label += ` · [Jeffrey] ${label}`;
		} else {
			state._autoAbilityLog = {
				mosje: mosje.name,
				ability: 'Brute Force',
				adjustment: 10,
				label: `[Jeffrey] ${label}`,
			};
		}
	}

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

	if (questCard.id === 'quest_personal_winston_tijd') {
		// Tesla returns to the player's hand
		state.activePlace = null;
		state.players[playerId].hand.push({ cardId: 'place_tesla' });
		// Recover Varkenspootjes from discard if present
		const vi = state.players[playerId].discard.findIndex(
			c => (c.cardId || c) === 'piecie_varkenspootjes'
		);
		if (vi >= 0) {
			const [recovered] = state.players[playerId].discard.splice(vi, 1);
			state.players[playerId].hand.push(recovered);
			console.log('[QUEST] Winston: Varkenspootjes recovered from discard');
		}
		console.log('[QUEST] Winston: Tesla returned to hand');
	}

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
	// Auto-succeed for Creative ★★+.
	// Draw-on-success (2 cards) is wired via the quest-def `drawOnSuccess` field, consumed by resolveQuest.
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
	// Hacker/FPS Mosje: -1 threshold (id-based check).
	// The passed `mosje` carries `cardId` (mosjeId is always undefined); prefer cardId, fall back to mosjeId.
	const hackId = String(mosje?.cardId ?? mosje?.mosjeId ?? '').toLowerCase();
	const isHacker = hackId.includes('hacker') || hackId.includes('fps');
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
	// Active Mosje must have between 80 and 100 MP (auto-succeed if requirement met)
	const mp = mosje?.mp || 0;
	const canAttempt = mp >= 80 && mp <= 100;
	return { canAttempt, success: canAttempt };
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
	// SIMPLIFIED: isFirstAction gate removed — the parameter is never passed by the quest activation flow,
	// so the gate blocked all attempts. Roll 3+ (Technical ★★★) or 5+ (otherwise) now always available.
	// DEFERRED: re-add first-action gating once UI layer passes the isFirstAction flag.
	const roll = rollDie();
	const technical = mosje.traits?.technical || 0;
	const threshold = technical >= 3 ? 3 : 5;
	return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}

export function quest_req_sustained_assault(questCard, mosje, gameState) {
	// SIMPLIFIED: ATTACK gate removed — lastCardPlayedType is set to 'PIECIE' (not 'ATTACK') when cards
	// are played, so the gate permanently blocked all attempts. Roll with Physical scaling now always available.
	// DEFERRED: re-add the ATTACK-Piecie-this-turn gate once the card-play pipeline tracks attack source separately.
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
	// Roll 4+. The opponent-loses-30-MP side effect is driven by the quest-def `opponentLoseMP` field, consumed by resolveQuest on success.
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 4, success: roll >= 4, isElimination: true };
}

export function quest_req_chain_master(questCard, mosje, gameState) {
	// Requires 3+ Piecies in the active player's discard pile. Roll 3+ to succeed.
	// DEFERRED: discard currently accumulates all-time Piecies, not just this-turn Piecies —
	// a per-turn Piecie counter is needed to enforce the "this turn" rule properly.
	const discard = gameState?.players[gameState.activePlayerId]?.discard || [];
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
	// Roll 3+. The draw-2-on-success side effect is driven by the quest-def `drawOnSuccess` field, consumed by resolveQuest.
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 3, success: roll >= 3, drawExtra: 2 };
}

export function quest_req_larry_temmen(questCard, mosje) {
	// SIMPLIFIED: collapsed 3-way outcome (1-2 lose, 3-4 nothing, 5-6 gain) to standard 2-way roll.
	// The 3-way variant required resolveQuest to handle a "nothing" middle tier which it doesn't support.
	// Rolls 5+ = success (gain 40 MP). Rolls 1-4 = fail (standard failMP applies).
	// DEFERRED: restore 3-way outcome (rolls 3-4 = no effect) once resolveQuest supports a neutral tier.
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 5, success: roll >= 5 };
}

export function quest_req_geen_raad_vraag_aad(questCard, mosje) {
	// SIMPLIFIED: replaced UI-prompt guess with a straight roll 4+.
	// The original requiresUIPrompt return is not handled by resolveQuest, so the quest never resolved.
	// DEFERRED: restore card-guess mechanic (opponent hand reveal + player input) once UI layer supports GUESS_CARD prompts.
	const roll = rollDie();
	return { canAttempt: true, diceRoll: roll, threshold: 4, success: roll >= 4 };
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
	if (currentPlace === 'place_obby_1') return { canAttempt: true, success: true, autoSuccess: true };
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
	const westActive = hasActiveMosjeCard(gameState, playerId, 'mosje_martin_senor_west');
	const coertActive = hasActiveMosjeCard(gameState, playerId, 'mosje_coert_tech');

	if (!westActive) return { canAttempt: false, reason: '[Martin] Señor West must be on your field.' };
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

// ─────────────────────────────────────────
// getKickboxingBootcampDiceBonus
// Returns +2 dice bonus for quest_personal_kickboxing_bootcamp when
// any Gandoe Mosje is simultaneously active on the player's field.
// Call from main.js alongside existing diceBonus reads in quest activation handlers.
// ─────────────────────────────────────────
export function getKickboxingBootcampDiceBonus(questCard, gameState, playerId) {
	if (questCard?.id !== 'quest_personal_kickboxing_bootcamp') return 0;
	const player = gameState?.players?.[playerId];
	if (!player) return 0;
	const gandoeOnField = (player.activeSlots || []).some(
		s => s && !s.isDefeated && String(s.cardId).includes('gandoe')
	);
	if (gandoeOnField) {
		console.log('[QUEST] Kickboxing Bootcamp: Gandoe hypes Michelle — +2 dice bonus');
		return 2;
	}
	return 0;
}
