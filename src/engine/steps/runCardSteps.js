// runCardSteps - the one generic handler for template cards (D-03): runs a card's steps (data in rules/cardSteps.js) in order.
// The picked Mosje is found once, and only when a step needs one: ctx.costPaidBy, else ctx.attachedTo, else the own-Mosje pick.
// An unknown step name throws (a typo in the table must not pass silently). Returns a new state; the input is not changed.
import { CARD_STEPS } from '../../rules/cardSteps.js';
import { STEP_KINDS } from './stepKinds.js';
import { stepApplies } from './stepApplies.js';
import { stepAmount } from './stepAmount.js';
import { resolvePiecieOwnSlot } from '../../abilities/piecie/resolvePiecieOwnSlot.js';

function kindOf(step) {
	const kind = STEP_KINDS[step.do];
	if (!kind) throw new Error(`Unknown card step: ${step.do}`);
	return kind;
}

function findPicked(state, playerId, cardDef, ctx) {
	if (Number.isInteger(ctx.costPaidBy)) return ctx.costPaidBy;
	if (Number.isInteger(ctx.attachedTo)) return ctx.attachedTo;
	return resolvePiecieOwnSlot(state, playerId, cardDef.id);
}

export function runCardSteps(gameState, playerId, cardDef, ctx = {}, steps = CARD_STEPS[cardDef?.id]) {
	if (!Array.isArray(steps)) throw new Error(`No steps for card: ${cardDef?.id}`);
	const kinds = steps.map(kindOf);
	let state = JSON.parse(JSON.stringify(gameState));
	const picked = kinds.some((k, i) => k.needsMosje(steps[i])) ? findPicked(state, playerId, cardDef, ctx) : -1;
	steps.forEach((step, i) => {
		if (!stepApplies(state, playerId, step, picked, ctx)) return;
		const pickedSlot = picked >= 0 ? state.players[playerId].activeSlots[picked] : null;
		state = kinds[i].run(state, playerId, step, { cardDef, ctx, picked, amount: stepAmount(step, pickedSlot, ctx) });
	});
	return state;
}
