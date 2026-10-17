// defaultAbilityInputs — the bot's plain answers for an ability's inputs (smarter use is Phase 61).
// Returns { key: value } for EVERY input of MOSJE_ABILITY_RULES[abilityId], or null = skip the ability.
// Values have the same shape the UI flow writes to _pendingTargets.
// Hidden info: the opponent's hand is read ONLY for abilities whose card text lets the player look at it.
import { MOSJE_ABILITY_RULES } from '../../rules/mosjeAbilityRules.js';
import { PIECIES } from '../../data/piecies.js';
import { getRevealedFor } from '../../engine/hidden/getRevealedFor.js';

const PIECIE_IDS = new Set(PIECIES.map(p => p.id));

const HAND_PEEK_ABILITIES = new Set(['ability_ronald_chef_strategic_insight', 'ability_fps_west_tactical_analysis']);
const live = (state, pid) => (state.players[pid]?.activeSlots || []).map((s, slotIndex) => ({ s, slotIndex })).filter(({ s }) => s && !s.isDefeated);
const byMp = (a, b) => a.s.mp - b.s.mp;

export function defaultAbilityInputs(state, botId, abilityId) {
	const rule = MOSJE_ABILITY_RULES[abilityId];
	if (!rule) return null;
	const me = state.players[botId];
	const oppId = Object.keys(state.players).find(id => id !== botId);
	const out = {};
	for (const input of rule.inputs) {
		let v;
		switch (input.kind) {
			case 'ownMosje': v = live(state, botId).sort(byMp)[0]?.slotIndex; break;
			case 'oppMosje': v = live(state, oppId).filter(({ s }) => !s.entryProtected).sort((a, b) => byMp(b, a))[0]?.slotIndex; break;
			case 'anyMosje': { const m = live(state, botId).sort(byMp)[0]; v = m && { playerId: botId, slotIndex: m.slotIndex }; break; }
			case 'choice': v = input.options[0]; break;
			case 'confirm': v = false; break;
			case 'number': v = Math.min(input.max, Math.max(input.min, Math.round(((input.min + input.max) / 2) / (input.step || 1)) * (input.step || 1))); break;
			case 'deckOwner': v = botId; break;
			case 'oppHandCard': { // only cards this card reveals to the bot: an existing reveal, or the hand the peek ability itself shows
				const seen = getRevealedFor(state, botId).flatMap(e => e.cardIds);
				if (!seen.length && !HAND_PEEK_ABILITIES.has(abilityId)) { v = undefined; break; } // no reveal: the hand is never read
				const hand = state.players[oppId]?.hand || [];
				const at = seen.length ? hand.findIndex(c => seen.includes(c.cardId)) : (hand.length ? 0 : -1);
				v = at >= 0 ? at : undefined; break;
			}
			case 'questStack': v = Object.keys(state.questStacks || {})[0]; break;
			case 'ownPiecieSlot': {
				const i = (me.piecieSlots || []).findIndex(s => s && s.type === 'PIECIE' && !s.activated && (input.filter !== 'faceDown' || s.faceDown)
					&& (input.filter !== 'placedThisTurn' || (s.playedOnTurn === state.turnNumber && s.canActivateOnTurn > state.turnNumber)));
				v = i >= 0 ? i : undefined; break;
			}
			case 'discardCard': { // a card in the discard pile (Master Plan): the first Piecie there
				const i = (me.graveyard || []).findIndex(c => PIECIE_IDS.has(c.cardId ?? c));
				v = i >= 0 ? i : undefined; break;
			}
			case 'handCard': {
				const idx = (me.hand || []).map((c, i) => ({ c, i })).filter(({ c }) => !input.filter || c.type === input.filter).map(({ i }) => i);
				const n = input.count || 1;
				v = idx.length >= n ? (n > 1 ? idx.slice(0, n) : idx[0]) : undefined; break;
			}
			case 'orderTopN':
			case 'pickFromTopN': {
				const owner = input.deckKey && input.deckKey !== 'own' ? out[input.deckKey] : botId;
				let size = Math.min(input.n, (state.players[owner || botId]?.deck || []).length);
				if (input.afterPick) size = Math.max(0, Math.min(5, (state.players[botId]?.deck || []).length) - (out[input.afterPick]?.length || 0));
				const want = input.kind === 'pickFromTopN' ? Math.min(input.count, size) : size;
				v = Array.from({ length: want }, (_, i) => i); break;
			}
			default: v = undefined;
		}
		if (v === undefined || v === null) return null;
		out[input.key] = v;
	}
	return out;
}
