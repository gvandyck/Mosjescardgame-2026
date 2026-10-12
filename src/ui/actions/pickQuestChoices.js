// pickQuestChoices — the human's Quest picks, asked only when the Quest needs them.
// phase 'pre'  (before the roll): { costChoice, dieChoices } or null if the player cancelled.
// phase 'post' (after the roll):  the `choices` object for resolveQuestAttempt.
import { getJabTargets } from '../../engine/quests/getJabTargets.js';
import { legalCostChoices } from './legalCostChoices.js';
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { escapeMeta } from './escapeMeta.js';

const nameOf = (cardId) => toGraveyardEntry(cardId, 'x').name;

async function pick(modal, title, options, prompt = '') {
	return modal.showOptionSelect({ title, prompt, options });
}

export async function pickQuestChoices({ state, playerId, modal, phase, slotIndex, stackId, pending }) {
	const me = state.players[playerId];
	if (phase === 'pre') {
		const questId = state.questStacks[stackId].faceUp;
		const legal = legalCostChoices(state, playerId, slotIndex, stackId);
		let costChoice;
		if (!legal.some(c => c.choice === undefined)) {
			const id = await pick(modal, 'Pay the Quest cost', legal.map((c, i) => ({ id: String(i), label: c.label })), 'This cost is paid first and never refunded.');
			if (id == null) return null;
			costChoice = legal[Number(id)].choice;
		}
		const dieChoices = {};
		if (questId === 'quest_improvise' && (me.energy || 0) >= 1) {
			dieChoices.payEnergy = (await pick(modal, 'Improvise', [{ id: 'yes', label: 'Pay 1 Energy for +1 die' }, { id: 'no', label: 'No' }])) === 'yes';
		}
		if (questId === 'quest_strategy_puzzle' && (me.hand || []).length > 0) {
			const opts = me.hand.map((c, i) => ({ id: String(i), label: `Discard ${nameOf(c.cardId)}` })).concat([{ id: 'no', label: 'No extra die' }]);
			const id = await pick(modal, 'Strategy Puzzle', opts, 'Discard 1 hand card for +1 die?');
			if (id != null && id !== 'no') dieChoices.discardHandIndex = Number(id);
		}
		return { costChoice, dieChoices };
	}

	const { questId, win, discardedCardIds } = pending;
	const choices = {};
	const label = (pid, i) => state.players[pid].activeSlots[i].name;
	if (win) {
		const jabs = getJabTargets(state, playerId, questId, { discardedCardIds });
		if (jabs.length) {
			const id = await pick(modal, 'Jab: an opponent Mosje loses 10 MP',
				jabs.map(t => ({ id: `${t.playerId}:${t.slotIndex}`, label: label(t.playerId, t.slotIndex), metaLabel: escapeMeta(`${state.players[t.playerId].activeSlots[t.slotIndex].mp} MP`) })));
			if (id != null) { const [pid, i] = id.split(':'); choices.jabTarget = { playerId: pid, slotIndex: Number(i) }; }
		}
		if (questId === 'quest_form_alliance') {
			const opts = [];
			for (const [pid, p] of Object.entries(state.players)) {
				if (pid === playerId) continue;
				p.activeSlots.forEach((s, i) => { if (s && !s.isDefeated && !s.entryProtected) opts.push({ id: `${pid}:${i}`, label: s.name, metaLabel: escapeMeta(`${s.mp} MP`) }); });
			}
			if (opts.length) {
				const id = await pick(modal, 'Form Alliance: an opponent Mosje gains 10 MP', opts);
				if (id != null) { const [pid, i] = id.split(':'); choices.formAllianceTarget = { playerId: pid, slotIndex: Number(i) }; }
			}
		}
		if (questId === 'quest_parkeren_delft') {
			const picks = [];
			for (let n = 0; n < 3; n++) {
				const opts = [];
				for (const [pid, p] of Object.entries(state.players)) {
					(p.graveyard || []).forEach((g, gi) => {
						if (!picks.some(x => x.playerId === pid && x.graveyardIndex === gi)) opts.push({ id: `${pid}:${gi}`, label: g?.name || nameOf(g?.cardId), metaLabel: escapeMeta(state.players[pid].name) });
					});
				}
				if (!opts.length) break;
				const id = await pick(modal, `Parkeren Delft: remove a discard (${n + 1}/3)`, opts.concat([{ id: 'done', label: 'Done' }]));
				if (id == null || id === 'done') break;
				const [pid, gi] = id.split(':');
				picks.push({ playerId: pid, graveyardIndex: Number(gi) });
			}
			choices.parkerenRemove = picks;
		}
		if (questId === 'quest_debug_system') {
			const owner = await pick(modal, 'Debug System: whose deck?', Object.entries(state.players).filter(([, p]) => (p.deck || []).length).map(([pid, p]) => ({ id: pid, label: p.name })));
			if (owner != null) {
				const top = state.players[owner].deck.slice(0, 5);
				const left = top.map((_, i) => i);
				const order = [];
				while (left.length) {
					const id = await pick(modal, `Debug System: card for position ${order.length + 1}`, left.map(i => ({ id: String(i), label: nameOf(top[i].cardId ?? top[i]) })), 'Position 1 is the next card drawn.');
					const chosen = id == null ? left[0] : Number(id);
					order.push(chosen);
					left.splice(left.indexOf(chosen), 1);
				}
				choices.debugSystem = { deckOwnerId: owner, order };
			}
		}
	} else if (questId === 'quest_geen_raad_vraag_aad' && (me.hand || []).length > 0) {
		const opts = me.hand.map((c, i) => ({ id: String(i), label: `Discard ${nameOf(c.cardId)}` })).concat([{ id: 'no', label: 'No, lose the full amount' }]);
		const id = await pick(modal, 'Vraag Aad!', opts, 'Discard 1 card to lose only 10 MP?');
		if (id != null && id !== 'no') choices.vraagAadDiscardHandIndex = Number(id);
	}
	return choices;
}
