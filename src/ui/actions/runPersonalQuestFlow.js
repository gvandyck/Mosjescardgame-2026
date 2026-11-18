// runPersonalQuestFlow - human Personal Quest (70-09, D-28): which card (when several), which Mosje (illegal ones disabled with
// the engine's reason), the choices the card needs, the roll (rollPersonalQuestAttempt, reaction windows settled by `settle`),
// the dice in a modal, then resolvePersonalQuestAttempt. Presets (hand Play button / Mosje tray chip): cardId, slotIndex.
// Only what getPersonalQuestOptions allows is offered; the engine re-checks in the roll step. Returns { state, log }.
import { rollPersonalQuestAttempt } from '../../engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolvePersonalQuestAttempt } from '../../engine/personalQuests/resolvePersonalQuestAttempt.js';
import { getPersonalQuestOptions } from '../../engine/personalQuests/getPersonalQuestOptions.js';
import { getPersonalQuestDef } from '../../engine/personalQuests/getPersonalQuestDef.js';
import { pickPersonalQuestChoice } from './pickPersonalQuestChoice.js';
import { escapeMeta } from './escapeMeta.js';
import { askPuntoBanco } from './askPuntoBanco.js';

const OK = [{ id: 'ok', label: 'OK' }];
const nameOf = (cardId) => getPersonalQuestDef(cardId)?.name ?? cardId;

export async function runPersonalQuestFlow({ state, playerId, modal, rng = Math.random, settle = async s => s, slotIndex: presetSlot, cardId: presetCard }) {
	const none = { state, log: [] };
	const all = getPersonalQuestOptions(state, playerId).filter(o => presetSlot == null || o.slotIndex === presetSlot);
	const cards = [...new Set(all.map(o => o.cardId))].filter(id => presetCard == null || id === presetCard);
	if (!cards.length) {
		await modal.showOptionSelect({ title: 'No Personal Quest', prompt: 'There is no Personal Quest in your hand for this Mosje.', options: OK });
		return none;
	}
	const reasons = (cardId) => all.filter(o => o.cardId === cardId && !o.ok).map(o => `${state.players[playerId].activeSlots[o.slotIndex].name}: ${o.error}`);
	const legalFor = (cardId) => all.some(o => o.cardId === cardId && o.ok);

	let cardId = cards.length === 1 ? cards[0] : null;
	if (cardId == null) {
		cardId = await modal.showOptionSelect({
			title: 'Which Personal Quest?', allowCancel: true,
			options: cards.map(id => ({ id, label: nameOf(id), metaLabel: escapeMeta(legalFor(id) ? '' : reasons(id)[0] || ''), disabled: !legalFor(id) })),
		});
		if (cardId == null) return none;
	}
	const def = getPersonalQuestDef(cardId);
	if (!legalFor(cardId)) {
		await modal.showOptionSelect({ title: `${def.name} cannot be played`, prompt: reasons(cardId).join(' | '), options: OK });
		return none;
	}

	let slotIndex = presetSlot;
	if (slotIndex == null) {
		const picked = await modal.showOptionSelect({
			title: `${def.name}: which Mosje?`, allowCancel: true,
			options: all.filter(o => o.cardId === cardId).map(o => {
				const slot = state.players[playerId].activeSlots[o.slotIndex];
				return { id: String(o.slotIndex), label: slot.name, metaLabel: escapeMeta(o.ok ? `Level ${slot.level} - ${slot.mp} MP` : o.error), disabled: !o.ok };
			}),
		});
		if (picked == null) return none;
		slotIndex = Number(picked);
	}

	const choice = await pickPersonalQuestChoice({ state, playerId, modal, cardId });
	if (!choice) return none;
	const puntoBanco = await askPuntoBanco({ state, playerId, modal });
	const roll = rollPersonalQuestAttempt(state, playerId, { cardId, slotIndex, choice, puntoBanco, rng });
	if (!roll.ok) {
		await modal.showOptionSelect({ title: 'Cannot attempt', prompt: roll.error, options: OK });
		return none;
	}
	let rolled = roll.state;
	let pending = roll.pending;
	if (roll.reactionPending) {
		rolled = await settle(roll.state);
		pending = rolled.pendingQuestRoll;
		if (!pending) return { state: rolled, log: [] };
	}
	const mosje = state.players[playerId].activeSlots[slotIndex].name;
	await modal.showOptionSelect({
		title: pending.win ? 'Personal Quest succeeded' : 'Personal Quest failed',
		prompt: `${def.name}: dice ${pending.dice.join(', ')}`,
		options: [{ id: 'ok', label: 'Continue' }],
	});
	// The Pay and the acted flag are already spent in `rolled`: cancelling is not an undo, so there is no cancel after the roll.
	const done = resolvePersonalQuestAttempt(rolled, pending);
	if (!done.ok) {
		await modal.showOptionSelect({ title: 'Personal Quest cannot resolve', prompt: done.error, options: OK });
		return { state: rolled, log: [`${mosje} attempted ${def.name}`] };
	}
	return { state: done.state, log: [`${mosje} ${done.win ? 'completed' : 'failed'} the Personal Quest ${def.name} (dice ${pending.dice.join(', ')})`] };
}
