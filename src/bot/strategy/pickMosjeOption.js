// pickMosjeOption - the bot's answer to a 'mosje' pause (pendingChoice.choiceKind 'mosje', options { playerId, slotIndex, label }):
//   all opponent Mosjes -> the one a 10 MP hit hurts most (getemt, a lost level), ties to the higher slot worth, then the lower MP
//   all own Mosjes      -> a self-loss Piecie: the Mosje that absorbs it; otherwise the gain rule of pickBotOwnTarget
// Returns one of the options, or undefined (mixed, empty or malformed options) so the caller can take the first option.
import { SELF_LOSS_MP } from './cardAmounts.js';
import { pickOwnSlotByRole } from './pickOwnSlotByRole.js';
import { slotWorth } from './slotWorth.js';
import { valueOfLoss } from './valueOfLoss.js';
import { asBotView } from './asBotView.js';

const HIT = 10;

export function pickMosjeOption(state, botId, pendingChoice) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const options = pendingChoice?.options;
	if (!Array.isArray(options) || options.length === 0) return undefined;
	const slotOf = (o) => (o && Number.isInteger(o.slotIndex) ? view.players?.[o.playerId]?.activeSlots?.[o.slotIndex] : undefined);
	if (!options.every(o => slotOf(o))) return undefined;

	if (options.every(o => o.playerId !== botId)) {
		const score = (o) => [valueOfLoss(slotOf(o), HIT), slotWorth(slotOf(o)), -(Number(slotOf(o).mp) || 0)];
		return options.reduce((top, o) => {
			const a = score(o);
			const b = score(top);
			for (let n = 0; n < a.length; n++) if (a[n] !== b[n]) return a[n] > b[n] ? o : top;
			return top;
		});
	}
	if (options.every(o => o.playerId === botId)) {
		const loss = SELF_LOSS_MP[pendingChoice.piecie?.cardDef?.id] ?? 0;
		const index = pickOwnSlotByRole(view, botId, loss > 0 ? 'self-loss' : 'gain', options.map(o => o.slotIndex), loss);
		return options.find(o => o.slotIndex === index);
	}
	return undefined;
}
