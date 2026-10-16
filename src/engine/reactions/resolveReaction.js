// resolveReaction — answer state.pendingReaction with a Snelle cardId or null (pass); then next window or replay.
import { attackMosje } from '../actions/attackMosje.js';
import { activatePiecie, playSnellie } from '../turnManager.js';
import { activatePiecieFree } from '../table/activatePiecieFree.js';
import { rollQuestAttempt } from '../quests/rollQuestAttempt.js';
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { getEligibleReactions, DJ_REROLL_PREFIX, PIECIE_REROLL_PREFIX } from './getEligibleReactions.js';
import { djLuckyBeats } from '../../abilities/mosje/djLuckyBeats.js';
import { useRerollGrant } from '../quests/useRerollGrant.js';
import { REACTION_MOMENTS as M } from './reactionMoments.js';
import { resumePiecieChoice } from '../piecies/resumePiecieChoice.js';
import { resumeSnelleChoice } from '../snelle/resumeSnelleChoice.js';
import { applyRetarget } from './applyRetarget.js';
import { copyHeldPiecie } from './copyHeldPiecie.js';
import { heldPiecieDef } from '../../rules/heldPiecieDef.js';

const SKIP = { skipReactions: true };

function replay(state, action) {
	const a = action.args;
	switch (action.type) {
		case 'attack': return attackMosje(state, a[0], a[1], SKIP);
		case 'activatePiecie': return activatePiecie(state, a[0], a[1], SKIP);
		case 'activatePiecieFree': return activatePiecieFree(state, a[0], a[1], { ...a[2], ...SKIP });
		case 'playSnelle': return playSnellie(state, a[0], a[1], a[2], SKIP);
		case 'resumePiecie': return { state: resumePiecieChoice(state, a[0]), success: true };
		case 'resumeSnelle': return { state: resumeSnelleChoice(state, a[0]).state, success: true };
		case 'quest': {
			const r = rollQuestAttempt(state, a[0], { ...a[1], skipBeforeRoll: true });
			if (r.ok && r.pending && !r.state.pendingQuestRoll) r.state = { ...r.state, pendingQuestRoll: r.pending };
			return r;
		}
		default: return { state, ok: true, success: true };
	}
}

export function resolveReaction(state, responderId, cardId = null) {
	const p = state.pendingReaction;
	const fail = (error) => ({ state, ok: false, success: false, error });
	if (!p) return fail('No pending reaction');
	if (p.responderId !== responderId) return fail('Not your reaction');
	let s = JSON.parse(JSON.stringify(state));
	delete s.pendingReaction;
	const queue = [...p.queue];
	if (cardId) {
		if (!p.eligible.includes(cardId)) return fail('That card cannot be played now');
		if (cardId.startsWith(DJ_REROLL_PREFIX)) {
			// DJ 80/20 Lucky Beats: reroll one die of the held Quest roll (not a card; no Energy).
			if (!djLuckyBeats(s, responderId, Number(cardId.slice(DJ_REROLL_PREFIX.length)))) return fail('Lucky Beats cannot be used now');
		} else if (cardId.startsWith(PIECIE_REROLL_PREFIX)) {
			// A Piecie reroll grant (Dubbele Dosis): reroll one die of the held Quest roll; the grant is consumed first.
			if (!useRerollGrant(s, responderId, Number(cardId.slice(PIECIE_REROLL_PREFIX.length)))) return fail('That reroll cannot be used now');
		} else {
			const def = SNELLE_PIECIES.find(d => d.id === cardId);
			const reaction = { moments: p.moments, preview: p.preview, action: p.action, actorId: p.actorId };
			const r = playSnellie(s, responderId, { cardId, type: 'SNELLE_PIECIE' }, def, { ...SKIP, reaction });
			if (!r.success) return fail(r.error);
			s = r.state;
			const other = Object.keys(s.players).find(id => id !== responderId);
			if (cardId === 'snelle_jensen' && !p.moments.includes(M.JENSEN_PLAYED)) {
				queue.unshift({ responderId: p.actorId === responderId ? other : p.actorId, moments: [M.JENSEN_PLAYED] });
			}
			// Frenssen! cancelled the Jensen!: the Jensen! player gets another targeted window (Jensen!, Blensen!).
			if (cardId === 'snelle_frenssen') queue.unshift({ responderId: other, moments: [M.TARGETED] });
			// A Snelle that needs a pick pauses here; the rest of the windows and the held action resume after the answer.
			if (r.paused && s.pendingChoice) {
				s.pendingChoice.after = { p: JSON.parse(JSON.stringify({ ...p, queue: undefined })), queue };
				return { state: s, ok: true, success: true, paused: true };
			}
		}
	}
	return continueReaction(s, p, queue);
}

// The remaining windows of a held action, then the held action itself (also called after a paused Snelle resumed).
export function continueReaction(s, p, queue) {
	while (queue.length) {
		const w = queue.shift();
		const eligible = getEligibleReactions(s, w.responderId, w.moments, { action: p.action, actorId: p.actorId });
		if (!eligible.length) continue;
		s.pendingReaction = { ...p, id: `${p.id}+`, moments: w.moments, responderId: w.responderId, eligible, queue,
			preview: { getemt: [], toWelloe: false, mpLoss: {} } };
		return { state: s, ok: true, success: true, reactionPending: true };
	}
	const copy = (s.reactionMods || []).find(m => m.kind === 'copy');
	const copied = copy ? heldPiecieDef(s, p.action) : null;
	s.replayingHeld = true; // only the held action may consume the reactionMods entries
	applyRetarget(s); // Counter Strikka: a Piecie's chosen target moves before it replays
	const res = replay(s, p.action);
	if (res.state) { delete res.state.reactionMods; delete res.state.replayingHeld; } // one-shot entries never outlive the held action (T-60-03)
	if (copied && res.success !== false && res.ok !== false && !res.negated && !res.state?.pendingChoice) {
		res.state = copyHeldPiecie(res.state, copy.playerId, copied);
	}
	return { ...res, ok: res.ok ?? res.success, success: res.success ?? res.ok };
}
