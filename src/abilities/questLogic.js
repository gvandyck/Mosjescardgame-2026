// questLogic.js — Quest outcome hooks (Mosje/Place/Piecie reactions) and partner-synergy bonuses.
// Obby 2.0: gates live in src/engine/quests/, the attempt in rollQuestAttempt/resolveQuestAttempt.

import { gainMP } from '../engine/mpManager.js';
import { roundToFive } from '../engine/roundToFive.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';
import { applyMpLossToSlot } from '../engine/mp/applyMpLossToSlot.js';
import { applyPlaceEffectsOnQuest } from '../engine/turnManager.js';
import { isHolderTextActive } from '../engine/synergy/isHolderTextActive.js';

console.log('[ABILITY] questLogic.js loaded');

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function getActiveMosjes(player) {
	return (player?.activeSlots || []).filter(slot => slot && !slot.isDefeated);
}

// ─────────────────────────────────────────────────────────────
// Holder-text quest bonuses (2.0). Live only through isHolderTextActive.
// Senor West holder: your Mosjes' Physical Quest wins gain +15 extra.
// ─────────────────────────────────────────────────────────────
const SENOR_WEST_PHYSICAL_BONUS = 15;

export function getPartnerSynergyQuestBonus(gameState, playerId, category) {
	if (category !== 'Physical') return 0;
	return isHolderTextActive(gameState, playerId, 'mosje_martin_senor_west') ? SENOR_WEST_PHYSICAL_BONUS : 0;
}

// UI helper: which quest bonuses are live right now (pill before a Quest is attempted).
export function getActivePartnerSynergyBonuses(gameState, playerId) {
	return getPartnerSynergyQuestBonus(gameState, playerId, 'Physical') > 0
		? [{ category: 'Physical', bonus: SENOR_WEST_PHYSICAL_BONUS }]
		: [];
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
		// questBonusMP: a one-shot bonus flag (no 2.0 Piecie arms it any more); consumed only on a success.
		const armedBonus = didSucceed ? (player.questBonusMP || 0) : 0;
		const questingMosje = player.activeSlots[slotIndex];
		const synergyBonus = didSucceed ? getPartnerSynergyQuestBonus(state, playerId, questCard.category) : 0;
		if (didSucceed && player.questBonusMP) player.questBonusMP = 0;
		const totalBonus = armedBonus + synergyBonus;
		if (totalBonus > 0) {
			questMpGained += totalBonus;
			state = gainMP(state, playerId, slotIndex, totalBonus, 'QUEST_BONUS');
			console.log(`[QUEST] Bonus MP applied: +${totalBonus} (armed=${armedBonus}, partner-synergy=${synergyBonus})`);
			if (synergyBonus > 0) state._questSynergyBonus = synergyBonus;
		}
	}

	// FPS West holder text: when FPS West or FPS Coert wins a Quest, both gain 10.
	const winnerId = player.activeSlots[slotIndex]?.cardId;
	if (didSucceed && (winnerId === 'mosje_fps_west' || winnerId === 'mosje_fps_coert') && isHolderTextActive(state, playerId, 'mosje_fps_west')) {
		state.players[playerId].activeSlots.forEach((slot, idx) => {
			if (slot && !slot.isDefeated && (slot.cardId === 'mosje_fps_west' || slot.cardId === 'mosje_fps_coert')) {
				state = gainMP(state, playerId, idx, 10, 'GAIN');
			}
		});
		console.log('[SYNERGY] FPS West holder text: both FPS Mosjes gain 10 MP');
	}

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
