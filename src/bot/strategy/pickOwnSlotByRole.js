// pickOwnSlotByRole - which of the bot's own Mosjes (slot indexes `indexes`) a Piecie pick goes to, by what the card does:
//   'power'     the Mosje that can still attack with the most Power (else the most Power overall)
//   'self-loss' the Mosje that loses `loss` MP at the least cost (getemt and a lost level count)
//   'defense'   an own Level 3 first, else the Mosje worth the most
//   'gain'      a Level 3 the opponent could hit down (MP at or below their threat) first, lowest MP first; else the biggest
//               gain (a level-up), ties to the higher MP. Sideways Mosjes come last; under The Void a Mosje that cannot
//               receive the gain is passed over.
// Ties go to the lower slot. Returns the slot index, or -1 when no candidate is left.
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { getPower } from '../../engine/mp/getPower.js';
import { voidBlocksGain } from '../../engine/mp/voidBlocksGain.js';
import { BOT_VALUES } from './botValues.js';
import { opponentThreat } from './opponentThreat.js';
import { slotWorth } from './slotWorth.js';
import { valueOfGain } from './valueOfGain.js';
import { valueOfLoss } from './valueOfLoss.js';
import { asBotView } from './asBotView.js';

const GAIN_PICK = 25; // a typical Piecie gain: how the bot compares Mosjes for "one of your Mosjes gains MP"

// Lexicographic compare of two number lists.
const compare = (a, b) => {
	for (let n = 0; n < a.length; n++) if (a[n] !== b[n]) return a[n] - b[n];
	return 0;
};

// The candidate with the highest key; candidates arrive in ascending slot order, so a tie keeps the lower slot.
function best(candidates, keyOf) {
	let top = null;
	for (const c of candidates) {
		const key = keyOf(c.slot, c.i);
		if (!top || compare(key, top.key) > 0) top = { i: c.i, key };
	}
	return top ? top.i : -1;
}

export function pickOwnSlotByRole(state, botId, role, indexes, loss = 0) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const slots = view.players?.[botId]?.activeSlots || [];
	const candidates = [...new Set(indexes)].sort((a, b) => a - b)
		.map(i => ({ i, slot: slots[i] }))
		.filter(c => c.slot && !c.slot.isDefeated);
	if (!candidates.length) return -1;

	if (role === 'power') {
		const attackers = candidates.filter(c => canMosjeTakeAction(view, botId, c.i).ok && !isFresh(c.slot));
		return best(attackers.length ? attackers : candidates, slot => [getPower(slot, view, botId)]);
	}
	if (role === 'self-loss') {
		return best(candidates, slot => [-valueOfLoss(slot, loss), Number(slot.mp) || 0]);
	}
	if (role === 'defense') {
		return best(candidates, slot => [(Number(slot.level) || 1) >= 3 ? 1 : 0, slotWorth(slot)]);
	}
	const open = candidates.filter(c => !voidBlocksGain(view, botId, c.i, 'PIECIE'));
	const threat = opponentThreat(view, botId);
	return best(open.length ? open : candidates, (slot) => {
		const mp = Number(slot.mp) || 0;
		const threatened = (Number(slot.level) || 1) >= 3 && mp < BOT_VALUES.L3_MP_CAP && mp <= threat;
		return [slot.sideways ? 0 : 1, threatened ? 1 : 0, threatened ? -mp : valueOfGain(slot, GAIN_PICK), mp];
	});
}
