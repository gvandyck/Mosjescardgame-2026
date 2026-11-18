// rollPersonalQuestAttempt - step 1 of a Personal Quest attempt (rules section 7, D-02..D-05): legality, Needs, then Pay,
// then the roll, with the same reaction windows as a Quest roll. Refusals never mutate. Mirrors rollQuestAttempt.
import { canAttemptPersonalQuest } from './canAttemptPersonalQuest.js';
import { getPersonalQuestDef } from './getPersonalQuestDef.js';
import { getPersonalQuestDice } from './getPersonalQuestDice.js';
import { isPersonalQuestWin } from './isPersonalQuestWin.js';
import { checkNeeds } from '../needs/checkNeeds.js';
import { payCosts } from '../costs/payCosts.js';
import { queuedRng } from '../dice/queuedRng.js';
import { rollQuestDice } from '../quests/rollQuestDice.js';
import { takeQuestDiceGrants } from '../quests/takeQuestDiceGrants.js';
import { getEligibleReactions } from '../reactions/getEligibleReactions.js';
import { buildPendingReaction } from '../reactions/buildPendingReaction.js';
import { REACTION_MOMENTS as M } from '../reactions/reactionMoments.js';
import { placeSkiffaGrant } from '../../abilities/place/placeTurnQuestEffects.js';

export function rollPersonalQuestAttempt(state, playerId, options) {
	if (options.skipReactions || state.pendingReaction) return rollCore(state, playerId, options);
	const other = Object.keys(state.players).find(id => id !== playerId);
	if (!options.skipBeforeRoll) {
		const dry = rollCore(state, playerId, { ...options, rng: () => 0.5 });
		const eligible = dry.ok ? getEligibleReactions(state, playerId, [M.BEFORE_OWN_QUEST_ROLL]) : [];
		if (eligible.length) {
			const { rng, ...args } = options;
			const w = { responderId: playerId, moments: [M.BEFORE_OWN_QUEST_ROLL], eligible };
			return { ok: true, state: buildPendingReaction(state, playerId, { type: 'personalQuest', args: [playerId, args] }, [w]), reactionPending: true };
		}
	}
	const res = rollCore(state, playerId, options);
	if (!res.ok) return res;
	const windows = [];
	for (const [who, moments] of [[other, [M.AFTER_QUEST_ROLL]], [playerId, [M.AFTER_OWN_QUEST_ROLL]]]) {
		const eligible = who ? getEligibleReactions(res.state, who, moments, { dice: res.pending.dice }) : [];
		if (eligible.length) windows.push({ responderId: who, moments, eligible });
	}
	if (!windows.length) return res;
	const held = JSON.parse(JSON.stringify(res.state));
	held.pendingQuestRoll = res.pending;
	return { ...res, state: buildPendingReaction(held, playerId, { type: 'continueQuest', args: [] }, windows), reactionPending: true };
}

function rollCore(state, playerId, { cardId, slotIndex, choice = {}, rng = queuedRng }) {
	const fail = (error) => ({ ok: false, state, error });
	const can = canAttemptPersonalQuest(state, playerId, { cardId, slotIndex, choice });
	if (!can.ok) return fail(can.error);
	const def = getPersonalQuestDef(cardId);
	// 1. Needs (on the state as it is now; the picks are the Piecies a fail discards)
	const needs = checkNeeds({ state, playerId, slotIndex, cardId, choice, excludeCardId: cardId }, def.needs || []);
	if (!needs.ok) return fail(needs.reason);
	// 2. Pay (on a copy; never refunded)
	const s = JSON.parse(JSON.stringify(state));
	const player = s.players[playerId];
	const at = player.hand.findIndex(c => c.cardId === cardId && c.type === 'PERSONAL_QUEST');
	player.hand.splice(at, 1);
	const paid = payCosts({ state: s, playerId, slotIndex, cardId, choice, excludeCardId: cardId }, def.pay || [], choice);
	if (!paid.ok) return fail(paid.reason);
	const slot = player.activeSlots[slotIndex];
	slot.actedThisTurn = true;
	// 3. Roll: a Quest roll, so every dice bonus, reroll and the 6-dice cap apply
	const energyPaid = (def.pay || []).reduce((n, c) => n + (c.kind === 'energy' ? c.amount : c.kind === 'energyAny' ? (choice?.energy || 0) : 0), 0);
	const diceCount = getPersonalQuestDice(s, playerId, slot, def, { energyPaid });
	player.questExtraDice = 0;
	takeQuestDiceGrants(s, playerId, slot); // card die grants (71-02) count once, on this copy only
	for (const g of player.rerollGrants || []) if (g.scope === 'ownQuest') g.forRoll = true; // Dubbele Dosis: reroll belongs to this roll
	placeSkiffaGrant(s, player, slot);
	const dice = rollQuestDice(diceCount, rng);
	const win = isPersonalQuestWin(def.roll.need, dice);
	return {
		ok: true,
		state: s,
		pending: { kind: 'personal', playerId, slotIndex, cardId, questId: cardId, dice, diceCount, win, need: { ...def.roll.need }, needPicks: needs.picks?.readyPiecies || [], energyPaid },
	};
}
