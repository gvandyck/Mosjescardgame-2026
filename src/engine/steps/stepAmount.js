// stepAmount - the amount of one step: comboAmount when the card is a Combo, else friendAmount for a listed friend, else amount.
import { isFriend } from '../friends/isFriend.js';

export function stepAmount(step, pickedSlot, ctx = {}) {
	if (ctx.combo === true && step.comboAmount !== undefined) return step.comboAmount;
	if (step.friendAmount && pickedSlot && isFriend(pickedSlot, step.friendAmount.friends)) return step.friendAmount.amount;
	return step.amount;
}
