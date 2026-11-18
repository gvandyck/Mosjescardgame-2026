// personalQuestKit.js - builders for the starter Personal Quest tests (71-19), not a test file.
// pqWorld: a Level 3 Mosje that may attempt (started the turn at Level 3, not fresh), the card in hand, optional ready
// Piecies, attached gear, a Place, Energy. attempt: queue the dice, roll, resolve.
import { makeEngineState } from './makeEngineState.js';
import { mkSlot } from './quest56.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolvePersonalQuestAttempt } from '../../src/engine/personalQuests/resolvePersonalQuestAttempt.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';

export const card = (cardId, type = 'PIECIE') => ({ cardId, type });
export const pq = (id) => card(id, 'PERSONAL_QUEST');
export const FILLER = card('piecie_affoe');
export const placed = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 });
export const names = (p) => (p.graveyard || []).map(c => c.cardId);
export const STARS = { strength: 'strength', tech: 'technical', art: 'artistic' };
const TYPE_OF = { PHYSICAL: 'strength', DIGITAL: 'technical', CREATIVE: 'artistic' };

// type: PHYSICAL | DIGITAL | CREATIVE. stars: stars of the rolled trait. ready: card ids in ready Piecie slots.
// attached: card ids attached to the Mosje. oppHand: how many cards the opponent holds.
export function pqWorld({ type = 'PHYSICAL', cardId, stars = 1, mp = 60, hand = [], ready = [], attached = [], place = null,
	energy = 6, oppHand = 0, deck = [FILLER], second = null, slot = {}, p1 = {}, p2 = {}, top = {} } = {}) {
	const mosje = mkSlot({
		level: 3, mp, subtype: type, levelAtTurnStart: 3, traits: { strength: 1, mental: 1, artistic: 1, technical: 1, resilient: 1, social: 1, [TYPE_OF[type]]: stars },
		attachments: attached.map(id => ({ cardId: id, attachedTurn: 1 })), ...slot,
	});
	const slots = [0, 1, 2].map((i) => (ready[i] ? placed(ready[i]) : null));
	return makeEngineState({
		turnNumber: 5,
		activePlace: place,
		players: {
			player_1: { activeSlots: [mosje, second], hand: [pq(cardId), ...hand], deck, energy, piecieSlots: slots, ...p1 },
			player_2: { activeSlots: [mkSlot({ mp: 40 }), null], hand: Array.from({ length: oppHand }, () => FILLER), ...p2 },
		},
		...top,
	});
}

// n dice, the first ones given, the rest 1s (a 1 never helps any Personal Quest).
export const diceOf = (n, head) => Array.from({ length: n }, (_, i) => (head[i] ?? 1));

// Queue the dice, roll (no reaction windows) and resolve. Returns { ok, error, pending, state, win }.
export function attempt(state, cardId, dice, choice = {}, opts = {}) {
	clearTestDice();
	pushTestDice(dice);
	const r = rollPersonalQuestAttempt(state, 'player_1', { cardId, slotIndex: 0, choice, skipReactions: true, ...opts });
	clearTestDice();
	if (!r.ok) return { ok: false, error: r.error, state: r.state };
	const out = resolvePersonalQuestAttempt(r.state, r.pending);
	return { ok: true, pending: r.pending, state: out.state, win: out.win };
}

// The rules: a win ends the game naming the card; a fail leaves the game on and puts the card back in the deck.
export function expectWin(res, cardId, expect) {
	expect(res.ok).toBe(true);
	expect(res.win).toBe(true);
	expect(res.state.status).toBe('FINISHED');
	expect(res.state.winReason).toBe('PERSONAL_QUEST');
	expect(res.state.winningQuest.cardId).toBe(cardId);
}
export function expectFail(res, cardId, expect) {
	expect(res.ok).toBe(true);
	expect(res.win).toBe(false);
	expect(res.state.status).toBe('PLAYING');
	expect(res.state.players.player_1.deck.map(c => c.cardId)).toContain(cardId);
	expect(res.state.players.player_1.hand.map(c => c.cardId)).not.toContain(cardId);
}
