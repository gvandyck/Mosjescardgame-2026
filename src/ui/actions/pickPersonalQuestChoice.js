// pickPersonalQuestChoice - the choices a Personal Quest needs, each asked only when there is a real choice (more candidates
// than the card takes): which ready Piecie the Needs line counts, which ready Piecie / hand cards Pay discards, how much
// Energy for an "any amount" Pay. Returns the engine `choice` ({ readyPiecies, handCardIds, energy }) or null when cancelled.
import { getReadyPiecies } from '../../engine/attachments/getReadyPiecies.js';
import { getPersonalQuestDef } from '../../engine/personalQuests/getPersonalQuestDef.js';
import { PIECIES } from '../../data/piecies.js';
import { pickFromCandidates } from './pickFromCandidates.js';

const PIECIE = Object.fromEntries(PIECIES.map(p => [p.id, p]));
const nameOf = (cardId) => PIECIE[cardId]?.name || String(cardId).replace(/^piecie_/, '').replace(/_/g, ' ');

export async function pickPersonalQuestChoice({ state, playerId, modal, cardId }) {
	const def = getPersonalQuestDef(cardId);
	const choice = {};
	const readyLine = [...(def.needs || []).filter(n => n.kind === 'readyPiecie'), ...(def.pay || []).filter(c => c.kind === 'discardReadyPiecie')][0];
	if (readyLine) {
		const count = readyLine.count ?? 1;
		const filter = { ...(readyLine.tag !== undefined ? { tag: readyLine.tag } : {}), ...(readyLine.name !== undefined ? { name: readyLine.name } : {}) };
		const all = getReadyPiecies(state, playerId, filter);
		if (all.length > count) {
			const ids = await pickFromCandidates({
				modal, title: 'Which Piecie?', prompt: `${def.name}: pick the ready Piecie${count > 1 ? 's' : ''} it uses.`, count,
				candidates: all.map((e, i) => ({ id: String(i), label: nameOf(e.cardId), metaLabel: e.zone === 'attached' ? 'attached' : 'on your field' })),
			});
			if (!ids) return null;
			choice.readyPiecies = ids.map(i => all[Number(i)]);
		}
	}
	const handLine = (def.pay || []).find(c => c.kind === 'discardFromHand');
	if (handLine) {
		const count = handLine.count ?? 1;
		const hand = (state.players[playerId].hand || []).filter(c => c.cardId !== cardId
			&& (handLine.tag === undefined || PIECIE[c.cardId]?.tag === handLine.tag)
			&& (handLine.type === undefined || c.type === handLine.type));
		if (hand.length > count) {
			const ids = await pickFromCandidates({
				modal, title: 'Discard which card?', prompt: `${def.name}: discard ${count} from your hand.`, count,
				candidates: hand.map((c, i) => ({ id: String(i), label: nameOf(c.cardId) })),
			});
			if (!ids) return null;
			choice.handCardIds = ids.map(i => hand[Number(i)].cardId);
		}
	}
	if ((def.pay || []).some(c => c.kind === 'energyAny')) {
		const energy = Number(state.players[playerId].energy) || 0;
		const options = Array.from({ length: energy + 1 }, (_, n) => ({ id: String(n), label: `${n} Energy` }));
		const picked = await modal.showOptionSelect({ title: 'How much Energy?', prompt: `${def.name}: how much Energy do you pay?`, options, allowCancel: true });
		if (picked == null) return null;
		choice.energy = Number(picked);
	}
	return choice;
}
