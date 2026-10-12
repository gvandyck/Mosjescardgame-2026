// questLogic.js — Quest outcome hooks (Mosje/Place/Piecie reactions) and partner-synergy bonuses.
// Obby 2.0: gates live in src/engine/quests/, the attempt in rollQuestAttempt/resolveQuestAttempt.

import { rollDie } from '../engine/deckEngine.js';
import { gainMP, loseMP } from '../engine/mpManager.js';
import { roundToFive } from '../engine/roundToFive.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';
import { applyMpLossToSlot } from '../engine/mp/applyMpLossToSlot.js';
import { applyPlaceEffectsOnQuest } from '../engine/turnManager.js';

console.log('[ABILITY] questLogic.js loaded');

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function getActiveMosjes(player) {
	return (player?.activeSlots || []).filter(slot => slot && !slot.isDefeated);
}

// ─────────────────────────────────────────────────────────────
// getPartnerSynergyQuestBonus
// U6 stack step 4 — "Partner-synergy bonus (from synergy partner being on
// field)". Data-driven lookup so a future duo's category-wide quest synergy
// is one table entry, not a new hardcoded branch. Only mosje.js pairs whose
// synergyEffect text ties to a Quest CATEGORY belong here — a bonus scoped
// to one specific quest card (e.g. Kickboxing Bootcamp's both-active +20)
// stays as a perMosjeConfig override where it already lives, since that's a
// different mechanic (one card, not "every Physical quest").
//
// [Martin] Señor West + [AZN Cless]: "Physical Quests give +15 bonus MP"
// (src/data/mosjes.js) — both Mosjes declare this synergyEffect, but nothing
// consumed it until this lookup; getActiveSynergies()/hasSynergy() in
// synergyResolver.js only ever drove the Binti+Coert FOOD-double check.
// ─────────────────────────────────────────────────────────────
const PARTNER_QUEST_SYNERGIES = [
	{ pair: ['mosje_martin_senor_west', 'mosje_azn_cless'], category: 'Physical', bonus: 15 },
	{ pair: ['mosje_gandoe_destroyer', 'mosje_michelle'], category: 'Physical', bonus: 15, appliesTo: ['mosje_gandoe_destroyer'] },
];

export function getPartnerSynergyQuestBonus(gameState, playerId, category, questerCardId = null) {
	if (!category) return 0;
	const activeIds = new Set(getActiveMosjes(gameState?.players?.[playerId]).map(m => m.cardId));
	const waiverActive = gameState?.players?.[playerId]?.synergyWaiverActive === true;
	let bonus = 0;
	for (const entry of PARTNER_QUEST_SYNERGIES) {
		if (entry.category !== category) continue;
		if (questerCardId && Array.isArray(entry.appliesTo) && !entry.appliesTo.includes(questerCardId)) continue;
		const bothPresent = entry.pair.every(id => activeIds.has(id));
		const waived = waiverActive && entry.pair.some(id => activeIds.has(id));
		if (bothPresent || waived) {
			bonus += entry.bonus;
		}
	}
	return bonus;
}

// UI helper: which partner-quest-synergy bonuses are LIVE right now for this
// player (real partner present, or waived via Synergy Chamber) — lets the UI
// show a pill BEFORE a quest is attempted, rather than only revealing the
// bonus after the fact in the MP delta.
export function getActivePartnerSynergyBonuses(gameState, playerId) {
	const activeIds = new Set(getActiveMosjes(gameState?.players?.[playerId]).map(m => m.cardId));
	const waiverActive = gameState?.players?.[playerId]?.synergyWaiverActive === true;
	const active = [];
	for (const entry of PARTNER_QUEST_SYNERGIES) {
		const bothPresent = entry.pair.every(id => activeIds.has(id));
		const waived = waiverActive && entry.pair.some(id => activeIds.has(id));
		if (bothPresent || waived) {
			active.push({ category: entry.category, bonus: entry.bonus });
		}
	}
	return active;
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

// runQuestOutcomeHooks — everything that reacts to a resolved Quest AFTER its base MP was applied:
// armed questBonusMP + partner-synergy bonus (success only), Mosje auto-abilities, quest counters,
// Place and Piecie quest effects. Called by the 2.0 resolveQuestAttempt.
export function runQuestOutcomeHooks(gameState, playerId, slotIndex, questCard, didSucceed, mpGained = 0, { skipBonus = false } = {}) {
	let state = cloneState(gameState);
	const player = state.players[playerId];
	let questMpGained = mpGained;
	if (!skipBonus) {
		// questBonusMP is armed by snoeiertje/super_saiyan_mos/momentum_boost/f1_telemetry; consumed only when it applies.
		const armedBonus = didSucceed ? (player.questBonusMP || 0) : 0;
		const questingMosje = player.activeSlots[slotIndex];
		const synergyBonus = didSucceed ? getPartnerSynergyQuestBonus(state, playerId, questCard.category, questingMosje?.cardId) : 0;
		if (didSucceed && player.questBonusMP) player.questBonusMP = 0;
		const totalBonus = armedBonus + synergyBonus;
		if (totalBonus > 0) {
			questMpGained += totalBonus;
			state = gainMP(state, playerId, slotIndex, totalBonus, 'QUEST_BONUS');
			console.log(`[QUEST] Bonus MP applied: +${totalBonus} (armed=${armedBonus}, partner-synergy=${synergyBonus})`);
			if (synergyBonus > 0) state._questSynergyBonus = synergyBonus;
		}
	}

	// Fires before Place effects so the modified MP feeds into Quest Haven bonuses.
	state = applyMosjeFieldEffectsOnQuest(state, playerId, slotIndex, questMpGained, questCard, didSucceed);

	if (didSucceed) {
		state.players[playerId].questsCompleted += 1;
		state.players[playerId].questsCompletedThisTurn += 1;
		// slotIndex so Quest Haven awards the bonus to the Mosje that completed the quest.
		state = applyPlaceEffectsOnQuest(state, playerId, questCard, true, slotIndex);
		state = applyPiecieFieldEffectsOnQuest(state, playerId, true);
	} else {
		state = applyPlaceEffectsOnQuest(state, playerId, questCard, false);
	}
	return state;
}

// ─────────────────────────────────────────────────────────────
// applyMosjeFieldEffectsOnQuest
// Auto-abilities on the active Mosje that trigger after a quest resolves.
// questMpGained: the raw successMP that was applied (0 on failure/void).
// questCard/didSucceed: threaded through for abilities that need the quest's
// category or a real success/failure gate (e.g. FPS Coert), not just the MP delta.
// Attaches state._autoAbilityLog for the UI to surface in the battle log.
// ─────────────────────────────────────────────────────────────
function applyMosjeFieldEffectsOnQuest(gameState, playerId, slotIndex, questMpGained, questCard, didSucceed) {
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
				applyGainToSlot(mosje, adjustment, { turnNumber: state.turnNumber });
				label = `rolled ${roll} (4+) ✦ DOUBLED! +${adjustment} extra MP (total +${questMpGained * 2})`;
			} else {
				adjustment = -roundToFive(questMpGained / 2);  // take back half → ½ total (5-grid)
				// Take back half the reward as a loss through the 2.0 funnel. A level-up may already
				// have reset MP to 0 before this fires: nothing is left to take back, so skip (no getemt).
				if (mosje.mp > 0) applyMpLossToSlot({ state, playerId, slot: mosje, amount: -adjustment, source: 'ABILITY' });
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

		if (roll >= 5) {
			const gandoeDestroyerIndex = player.activeSlots.findIndex(
				s => s && !s.isDefeated && s.cardId === 'mosje_gandoe_destroyer'
			);
			if (gandoeDestroyerIndex >= 0) {
				state = gainMP(state, playerId, gandoeDestroyerIndex, 10, 'GAIN');
				const gandoeSlot = state.players[playerId].activeSlots[gandoeDestroyerIndex];
				state._autoAbilityLog.label += ` | [Gandoe] Destroyer synergy: roll ${roll} grants +10 MP`;
				console.log(`[SYNERGY] Gandoe+Michelle: Tough Gamble roll ${roll} -> Gandoe Destroyer +10 MP -> ${gandoeSlot?.mp} MP`);
			}
		}
	}

	// ── Jeffrey The Strongman — Brute Force ────────────────────────────────────
	// Passive: every quest success gives +10 MP. Always active while Jeffrey is
	// on field — no manual activation needed. FOOD/RESTORE block is enforced
	// separately in playPiecie (turnManager.js) also without needing activation.
	if (mosje.cardId === 'mosje_jeffrey' && questMpGained > 0) {
		applyGainToSlot(mosje, 10, { turnNumber: state.turnNumber });
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

	// ── FPS Coert — Headshot Precision ──────────────────────────────────────
	// Passive auto-trigger (2026-07-13 reconciliation: TEXT WINS): after a
	// Physical or Technical Quest SUCCESS, roll 1d6. On 6: FPS Coert +30 MP,
	// opponent's first active Mosje -15 MP.
	if (
		mosje.cardId === 'mosje_fps_coert' &&
		didSucceed &&
		['Physical', 'Technical'].includes(questCard?.category)
	) {
		const roll = rollDie(6);
		if (roll === 6) {
			applyGainToSlot(mosje, 30, { turnNumber: state.turnNumber });
			const oppId = Object.keys(state.players).find(id => id !== playerId);
			const oppSlotIndex = oppId
				? state.players[oppId].activeSlots.findIndex(s => s && !s.isDefeated)
				: -1;
			if (oppId && oppSlotIndex >= 0) {
				state = loseMP(state, oppId, oppSlotIndex, 15, 'FPS_COERT_HEADSHOT');
			}
			const label = `Headshot Precision: rolled ${roll} — +30 MP, opponent -15 MP`;
			console.log(`[ABILITY] FPS Coert ${label} | mp=${state.players[playerId].activeSlots[slotIndex].mp}`);
			if (state._autoAbilityLog) {
				state._autoAbilityLog.label += ` · [FPS Coert] ${label}`;
			} else {
				state._autoAbilityLog = {
					mosje: mosje.name,
					ability: 'Headshot Precision',
					adjustment: 30,
					label: `[FPS Coert] ${label}`,
				};
			}
		} else {
			console.log(`[ABILITY] FPS Coert Headshot Precision: rolled ${roll} — no effect`);
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
