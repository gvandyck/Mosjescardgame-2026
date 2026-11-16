// detectReactionMoments — which defender moments a dry-run action triggers, plus a JSON preview.
import { REACTION_MOMENTS as M } from './reactionMoments.js';

// Held actions that activate a Piecie ('resumePiecie' = an activation that was paused on a target pick).
// Fallen Mosjes in the one pile (entries with source 'welloe'); a discarded Piecie does not count.
const countFallen = (p) => (p.graveyard || []).filter(e => e?.type === 'MOSJE' && e.source === 'welloe').length;

export const PIECIE_ACTIONS = ['activatePiecie', 'activatePiecieFree', 'resumePiecie'];

// targets: the acting card or ability carries the targets flag; recorded: the Mosjes its effect marked (markTargeted).
export function detectReactionMoments(before, after, { actorId, responderId, actionType, targets = false, recorded = [] }) {
	const moments = [];
	const preview = { getemt: [], toWelloe: false, mpLoss: {}, welloeSlots: [] };
	if (actionType === 'attack') moments.push(M.ATTACKED);
	if (PIECIE_ACTIONS.includes(actionType)) moments.push(M.AFTER_PIECIE_ACTIVATION);
	const b = before.players[responderId], a = after.players[responderId];
	let changed = false, lowers = false;
	(b.activeSlots || []).forEach((bs, i) => {
		if (!bs) return;
		const as = a.activeSlots?.[i];
		if (!as || as.cardId !== bs.cardId) { changed = true; lowers = true; preview.getemt.push(i); preview.welloeSlots.push(i); return; }
		if (as.mp !== bs.mp || as.level !== bs.level || !!as.sideways !== !!bs.sideways) changed = true;
		if (as.mp < bs.mp || as.level < bs.level) { lowers = true; preview.mpLoss[i] = Math.max(0, bs.mp - as.mp); }
		if (as.level < bs.level || (as.sideways && !bs.sideways)) preview.getemt.push(i);
	});
	if (countFallen(a) > countFallen(b)) { preview.toWelloe = true; lowers = true; }
	// D-20: only a flagged card or ability targets, never an attack. A recorded target of the responder opens the window
	// (even when nothing changed); a flagged effect that recorded nothing falls back to "a Mosje of the responder changed".
	const cardAction = PIECIE_ACTIONS.includes(actionType) || ['playSnelle', 'resumeSnelle', 'mosjeAbility'].includes(actionType);
	if (cardAction && targets && (recorded.some(r => r.playerId === responderId) || (recorded.length === 0 && changed))) moments.push(M.TARGETED);
	if (lowers) moments.push(M.WOULD_LOSE_MP);
	if (preview.toWelloe) moments.push(M.TO_WELLOE);
	return { moments, preview };
}
