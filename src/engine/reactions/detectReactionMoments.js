// detectReactionMoments — which defender moments a dry-run action triggers, plus a JSON preview.
import { REACTION_MOMENTS as M } from './reactionMoments.js';

// Held actions that activate a Piecie ('resumePiecie' = an activation that was paused on a target pick).
export const PIECIE_ACTIONS = ['activatePiecie', 'activatePiecieFree', 'resumePiecie'];

export function detectReactionMoments(before, after, { actorId, responderId, actionType }) {
	const moments = [];
	const preview = { getemt: [], toWelloe: false, mpLoss: {} };
	if (actionType === 'attack') moments.push(M.ATTACKED);
	if (PIECIE_ACTIONS.includes(actionType)) moments.push(M.AFTER_PIECIE_ACTIVATION);
	const b = before.players[responderId], a = after.players[responderId];
	let changed = false, lowers = false;
	(b.activeSlots || []).forEach((bs, i) => {
		if (!bs) return;
		const as = a.activeSlots?.[i];
		if (!as || as.cardId !== bs.cardId) { changed = true; lowers = true; preview.getemt.push(i); return; }
		if (as.mp !== bs.mp || as.level !== bs.level || !!as.sideways !== !!bs.sideways) changed = true;
		if (as.mp < bs.mp || as.level < bs.level) { lowers = true; preview.mpLoss[i] = Math.max(0, bs.mp - as.mp); }
		if (as.level < bs.level || (as.sideways && !bs.sideways)) preview.getemt.push(i);
	});
	if ((a.welloePile || []).length > (b.welloePile || []).length) { preview.toWelloe = true; lowers = true; }
	if ((PIECIE_ACTIONS.includes(actionType) || actionType === 'playSnelle' || actionType === 'resumeSnelle') && changed) moments.push(M.TARGETED);
	if (lowers) moments.push(M.WOULD_LOSE_MP);
	if (preview.toWelloe) moments.push(M.TO_WELLOE);
	return { moments, preview };
}
