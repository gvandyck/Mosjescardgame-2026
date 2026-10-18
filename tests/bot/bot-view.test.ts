// @ts-nocheck
// BOT-04: getBotView / asBotView. The table view of one seat: counts and positions stay, hidden information goes.
import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../src/engine/gameState.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { revealCards } from '../../src/engine/hidden/revealCards.js';
import { getBotView } from '../../src/bot/strategy/getBotView.js';
import { asBotView } from '../../src/bot/strategy/asBotView.js';
import { makeTrapState } from '../helpers/hiddenTrap.js';

const BOT = 'player_1';
const OPP = 'player_2';
const HIDDEN = { cardId: 'hidden_card', type: 'HIDDEN', hidden: true };
const card = (cardId, type = 'PIECIE') => ({ cardId, type });
const down = (cardId, extra = {}) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 2, canActivateOnTurn: 3, ...extra });
const clone = (x) => JSON.parse(JSON.stringify(x));

function game() {
	const players = [{ playerId: BOT, name: 'Bot', deckId: 'EXAMPLE_TAKSEN' }, { playerId: OPP, name: 'Opp', deckId: 'EXAMPLE_REGELAARS' }];
	const st = startTurn(createInitialGameState(players, 'VIEW_TEST', { firstPlayerId: BOT }));
	st.players[OPP].hand = [card('opp_a'), card('opp_b'), card('opp_c', 'SNELLE_PIECIE'), card('opp_d', 'PLACE')];
	st.players[OPP].piecieSlots = [down('opp_down_0'), down('opp_down_1'), null];
	st.players[BOT].piecieSlots = [down('bot_down_0'), null, null];
	return st;
}

describe('getBotView', () => {
	it('hides the opponent hand card by card and leaves the own hand alone', () => {
		const st = game();
		const view = getBotView(st, BOT);
		expect(view.players[OPP].hand).toEqual([HIDDEN, HIDDEN, HIDDEN, HIDDEN]);
		expect(view.players[BOT].hand).toEqual(st.players[BOT].hand);
	});

	it('shows only the cards revealed to the bot this turn (count-limited)', () => {
		const st = game();
		st.players[OPP].hand.push(card('opp_a'));
		const view = getBotView(revealCards(st, BOT, 'x', ['opp_b', 'opp_a']), BOT);
		expect(view.players[OPP].hand).toEqual([card('opp_a'), card('opp_b'), HIDDEN, HIDDEN, HIDDEN]);
		const stale = revealCards(st, BOT, 'x', ['opp_b']);
		stale.turnNumber += 1; // an older reveal is stale
		expect(getBotView(stale, BOT).players[OPP].hand.every((c) => c.hidden)).toBe(true);
	});

	it('hides both decks and every Quest stack deck but keeps their length and the rest of the stack', () => {
		const st = game();
		const view = getBotView(st, BOT);
		for (const id of [BOT, OPP]) {
			expect(view.players[id].deck).toHaveLength(st.players[id].deck.length);
			expect(view.players[id].deck.every((c) => c.hidden)).toBe(true);
		}
		for (const [id, stack] of Object.entries(st.questStacks)) {
			expect(view.questStacks[id].deck).toHaveLength(stack.deck.length);
			expect(view.questStacks[id].deck.every((c) => c.hidden)).toBe(true);
			expect({ ...view.questStacks[id], deck: null }).toEqual({ ...stack, deck: null });
		}
	});

	it('covers an opponent face-down Piecie (id only) and keeps face-up Stays entries and every own slot', () => {
		const st = game();
		st.players[OPP].piecieSlots[2] = { cardId: 'opp_stays', type: 'PIECIE', faceDown: false, stays: true, activated: true };
		const view = getBotView(st, BOT);
		expect(view.players[OPP].piecieSlots[0]).toEqual({ cardId: 'hidden_card', hidden: true, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 2, canActivateOnTurn: 3 });
		expect(view.players[OPP].piecieSlots[2]).toEqual(st.players[OPP].piecieSlots[2]);
		expect(view.players[BOT].piecieSlots).toEqual(st.players[BOT].piecieSlots);
	});

	it('keeps the opponent slot a pending activatePiecie names (it is face-up at the table)', () => {
		const st = game();
		st.pendingReaction = { moments: ['targeted'], responderId: BOT, actorId: OPP, eligible: ['snelle_jensen'], preview: {}, action: { type: 'activatePiecie', args: [OPP, 1] }, queue: [] };
		const view = getBotView(st, BOT);
		expect(view.players[OPP].piecieSlots[1].cardId).toBe('opp_down_1');
		expect(view.players[OPP].piecieSlots[0].cardId).toBe('hidden_card');
		expect(view.pendingReaction.eligible).toEqual(['snelle_jensen']); // the bot's own window is kept
	});

	it("keeps only the bot's reveals and strips the opponent's pending options and _pendingTargets", () => {
		const st = game();
		st.revealed = { [BOT]: [{ source: 'x', cardIds: ['opp_a'], turnNumber: st.turnNumber }], [OPP]: [{ source: 'y', cardIds: ['bot_deck_top'], turnNumber: st.turnNumber }] };
		st.pendingChoice = { hook: 'snelle', playerId: OPP, key: 'k', options: [{ cardId: 'opp_a' }], choiceKind: 'card', after: { p: { eligible: ['snelle_jensen'], queue: [] }, queue: [] } };
		st.pendingReaction = { moments: ['targeted'], responderId: OPP, actorId: BOT, eligible: ['snelle_jensen'], preview: { getemt: [0] }, action: { type: 'attack', args: [] }, queue: [] };
		st.players[OPP]._pendingTargets = { k: 'v' };
		st.players[BOT]._pendingTargets = { own: 1 };
		const view = getBotView(st, BOT);
		expect(Object.keys(view.revealed)).toEqual([BOT]);
		expect(view.pendingChoice.options).toEqual([]);
		expect(view.pendingChoice.after.p.eligible).toEqual([]);
		expect(view.pendingChoice.key).toBe('k');
		expect(view.pendingReaction.eligible).toEqual([]);
		expect(view.pendingReaction.preview).toEqual({ getemt: [0] });
		expect(view.players[OPP]._pendingTargets).toBeUndefined();
		expect(view.players[BOT]._pendingTargets).toEqual({ own: 1 });
		const own = game();
		own.pendingChoice = { hook: 'snelle', playerId: BOT, key: 'k', options: [{ cardId: 'mine' }], choiceKind: 'card' };
		expect(getBotView(own, BOT).pendingChoice).toEqual(own.pendingChoice);
	});

	it('leaks no hidden string anywhere in the view', () => {
		const st = game();
		st.players[OPP].hand = [card('secret_hand_1'), card('secret_hand_2')];
		st.players[OPP].deck = [card('secret_deck_1'), card('secret_deck_2')];
		st.players[BOT].deck = [card('secret_own_deck')];
		st.players[OPP].piecieSlots[0] = down('secret_down');
		for (const stack of Object.values(st.questStacks)) stack.deck = ['secret_quest'];
		st.revealed = { [OPP]: [{ source: 'y', cardIds: ['secret_rev'], turnNumber: st.turnNumber }] };
		st.pendingChoice = { playerId: OPP, key: 'k', options: ['secret_opt'] };
		st.pendingReaction = { moments: [], responderId: OPP, actorId: BOT, eligible: ['secret_elig'], preview: {}, action: { type: 'attack', args: [] }, queue: [] };
		st.players[OPP]._pendingTargets = { x: 'secret_t' };
		expect(JSON.stringify(getBotView(st, BOT))).not.toContain('secret');
	});

	it('does not change its input; stamps __botView; runs on a trap state without throwing', () => {
		const st = game();
		const before = clone(st);
		const view = getBotView(st, BOT);
		expect(st).toEqual(before);
		expect(view.__botView).toBe(BOT);
		expect(st.__botView).toBeUndefined();
		const trap = makeTrapState(st, BOT);
		expect(() => trap.players[OPP].hand[0]).toThrow(/hidden read/);
		expect(() => getBotView(trap, BOT)).not.toThrow();
		expect(getBotView(trap, BOT).players[OPP].hand).toHaveLength(st.players[OPP].hand.length);
		const trapOpp = makeTrapState(st, OPP);
		expect(() => getBotView(trapOpp, OPP)).not.toThrow();
	});

	it('keeps missing fields missing and tolerates minimal states', () => {
		const min = { turnNumber: 2, players: { [BOT]: { hand: [card('a')], activeSlots: [] }, [OPP]: { activeSlots: [] } } };
		const view = getBotView(min, BOT);
		expect(view.questStacks).toBeUndefined();
		expect(view.revealed).toEqual({}); // always an object: a missing key must not tell the bot whether the opponent saw something
		expect(view.players[OPP].hand).toBeUndefined();
		expect(view.players[OPP].deck).toBeUndefined();
		expect(view.players[OPP].piecieSlots).toBeUndefined();
		expect(view.players[BOT].hand).toEqual([card('a')]);
		expect(getBotView({ players: { [BOT]: {}, [OPP]: {} }, questStacks: { FIGHTING: {} } }, BOT).questStacks.FIGHTING.deck).toEqual([]);
	});
});

describe('asBotView', () => {
	it('returns the same object for that seat and projects anything else', () => {
		const st = game();
		const view = getBotView(st, BOT);
		expect(asBotView(view, BOT)).toBe(view);
		expect(asBotView(st, BOT).__botView).toBe(BOT);
		const asOpp = asBotView(view, OPP);
		expect(asOpp).not.toBe(view);
		expect(asOpp.__botView).toBe(OPP);
		expect(asOpp.players[BOT].hand.every((c) => c.hidden)).toBe(true);
	});
});
