// chooseReaction — the bot's answer to state.pendingReaction: a Snelle cardId, or null to pass.
// Simple policy (Phase 61 makes it smarter): defender stops getemt / Welloe moves; actor tops up dice or rerolls a loss.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { getQuestDiceCount } from '../../engine/quests/getQuestDiceCount.js';

const costOf = (id) => Number(SNELLE_PIECIES.find(d => d.id === id)?.cost) || 0;

export function chooseReaction(state, responderId) {
	const p = state.pendingReaction;
	if (!p || p.responderId !== responderId) return null;
	const has = (id) => p.eligible.includes(id);
	if (p.moments.includes('beforeOwnQuestRoll')) {
		const { slotIndex, stackId } = p.action.args[1] || {};
		const slot = state.players[responderId]?.activeSlots?.[slotIndex];
		const quest = getQuestDef(state.questStacks?.[stackId]?.faceUp);
		if (has('snelle_sleutelpuntje') && slot && quest && getQuestDiceCount(state, responderId, slot, quest) < 4) return 'snelle_sleutelpuntje';
		return null;
	}
	if (p.moments.includes('afterOwnQuestRoll')) {
		return has('snelle_lucky_coin') && state.pendingQuestRoll?.win === false ? 'snelle_lucky_coin' : null;
	}
	if (p.moments.includes('afterOwnPiecieActivation') || p.moments.includes('afterQuestRoll') || p.moments.includes('jensenPlayed')) return null;
	if (p.preview?.getemt?.length || p.preview?.toWelloe) {
		return [...p.eligible].sort((a, b) => costOf(a) - costOf(b))[0] ?? null;
	}
	return null;
}
