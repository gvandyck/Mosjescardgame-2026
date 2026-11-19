// @ts-nocheck
// Phase 71-06: the gear Piecies on the 2.1 text (Controller, Dancepad, Keyboard, Mouse, MagicPrompt, Schetsboek,
// Headset). Real engine through activatePiecie; pauses are answered with resolvePendingChoice.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { activatePiecie } from '../../src/engine/turnManager.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { questDiceGrantTotal } from '../../src/engine/quests/questDiceGrantTotal.js';
import { expireThisTurnEffects } from '../../src/engine/turn/expireThisTurnEffects.js';
import { getRevealedFor } from '../../src/engine/hidden/getRevealedFor.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { makePiecieState } from '../helpers/makePiecieState.js';

afterEach(() => vi.restoreAllMocks());

const slotOf = (id: string, mp = 30) => {
	const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level: 1, mp });
	s.entryProtected = false;
	return s;
};
const WIZ = 'mosje_gandoe_wizard', ALY = 'mosje_alyssa_bulldozer', CHRIS = 'mosje_chris', DJ = 'mosje_dj_8020';
const COERT = 'mosje_fps_coert', WEST = 'mosje_fps_west', MING = 'mosje_ming_natural';
const cards = (...ids: string[]) => ids.map((cardId) => ({ cardId, type: 'PIECIE' }));
const filler = (n: number) => cards(...Array.from({ length: n }, () => 'piecie_pot_of_weed'));
const ids = (l: any[]) => l.map((c) => c.cardId);

function board(piecieId: string, first: string, second: string | null = null, o: any = {}) {
	const s: any = makePiecieState({ piecieId });
	s.players.player_1.activeSlots = [slotOf(first), second ? slotOf(second) : null];
	s.players.player_1.energy = 6;
	s.players.player_1.deck = o.deck ?? filler(6);
	s.players.player_1.hand = [];
	s.players.player_2.deck = o.foeDeck ?? filler(4);
	s._pendingTargets = o.pick || {};
	return s;
}
const run = (s: any) => {
	const r = activatePiecie(s, 'player_1', 0);
	expect(r.success, r.error).toBe(true);
	return r.state;
};
const answer = (s: any, pick: (o: any[]) => any) => {
	const r = resolvePendingChoice(s, pick(s.pendingChoice.options));
	expect(r.ok).toBe(true);
	return r.state;
};
const mp = (s: any, i = 0) => s.players.player_1.activeSlots[i].mp;
const dice = (s: any, i = 0) => questDiceGrantTotal(s, 'player_1', s.players.player_1.activeSlots[i]);
const shuffles = (spy: any) => spy.mock.calls.filter((c: any[]) => String(c[0]).includes('Deck shuffled')).length;

describe('Controller', () => {
	it('refused without a Digital Mosje', () => {
		expect(activatePiecie(board('piecie_controller', ALY), 'player_1', 0).success).toBe(false);
	});
	it('the picked Mosje gains 10 and gets 1 die more on its next Quest roll; the other does not; gone at turn end', () => {
		const s = run(board('piecie_controller', WIZ, CHRIS, { pick: { own_slot_index: 1 } }));
		expect(mp(s, 1)).toBe(40);
		expect(mp(s, 0)).toBe(30);
		expect(dice(s, 1)).toBe(1);
		expect(dice(s, 0)).toBe(0);
		const next: any = JSON.parse(JSON.stringify(s));
		next.activePlayerId = 'player_1';
		expireThisTurnEffects(next);
		expect(dice(next, 1)).toBe(0);
	});
});

describe('Dancepad', () => {
	it('the picked Mosje gains 10; a picked Chris also gets +1 die', () => {
		const s = run(board('piecie_dancepad', CHRIS, WIZ, { pick: { own_slot_index: 0 } }));
		expect(mp(s, 0)).toBe(40);
		expect(dice(s, 0)).toBe(1);
	});
	it('another Mosje picked with Chris elsewhere on the field: no die for anyone', () => {
		const s = run(board('piecie_dancepad', CHRIS, WIZ, { pick: { own_slot_index: 1 } }));
		expect(mp(s, 1)).toBe(40);
		expect(dice(s, 0)).toBe(0);
		expect(dice(s, 1)).toBe(0);
	});
});

describe('Keyboard', () => {
	it('refused without a Digital Mosje; else +10 MP and draw 1', () => {
		expect(activatePiecie(board('piecie_keyboard', ALY), 'player_1', 0).success).toBe(false);
		const s = run(board('piecie_keyboard', WIZ));
		expect(mp(s)).toBe(40);
		expect(s.players.player_1.hand).toHaveLength(1);
	});
});

describe('Mouse', () => {
	const G1 = 'piecie_keyboard', G2 = 'piecie_dumbbells';
	it('refused without a Digital Mosje', () => {
		expect(activatePiecie(board('piecie_mouse', ALY), 'player_1', 0).success).toBe(false);
	});
	it('two kinds of gear: asks which, takes that card, deck one shorter, no MP, shuffled once, only gear offered', () => {
		const spy = vi.spyOn(console, 'log');
		const deck = cards('piecie_pot_of_weed', G1, 'piecie_tikker', G2, G1);
		let s = run(board('piecie_mouse', WIZ, null, { deck }));
		expect(s.pendingChoice.playerId).toBe('player_1');
		expect(s.pendingChoice.options.map((o: any) => o.cardId).sort()).toEqual([G1, G2].sort());
		s = answer(s, (o) => o.find((x: any) => x.cardId === G2));
		expect(ids(s.players.player_1.hand)).toEqual([G2]);
		expect(s.players.player_1.deck).toHaveLength(4);
		expect(ids(s.players.player_1.deck).sort()).toEqual(['piecie_pot_of_weed', G1, 'piecie_tikker', G1].sort());
		expect(mp(s)).toBe(30);
		expect(shuffles(spy)).toBe(1);
	});
	it('one kind of gear is taken without a question; none in the deck takes nothing', () => {
		const one = run(board('piecie_mouse', WIZ, null, { deck: cards('piecie_pot_of_weed', G1, G1) }));
		expect(one.pendingChoice).toBeUndefined();
		expect(ids(one.players.player_1.hand)).toEqual([G1]);
		expect(one.players.player_1.deck).toHaveLength(2);
		const none = run(board('piecie_mouse', WIZ, null, { deck: filler(3) }));
		expect(none.pendingChoice).toBeUndefined();
		expect(none.players.player_1.hand).toHaveLength(0);
		expect(none.players.player_1.deck).toHaveLength(3);
	});
	it('a forged answer naming a card that is not gear is ignored', () => {
		const s = board('piecie_mouse', WIZ, null, { deck: cards('piecie_pot_of_weed', G1, G2), pick: { mouse_search: { label: 'x', cardId: 'piecie_pot_of_weed' } } });
		s.players.player_1._pendingTargets = { mouse_search: { label: 'x', cardId: 'piecie_pot_of_weed' } };
		const out = run(s);
		expect(out.players.player_1.hand).toHaveLength(0);
		expect(out.pendingChoice.options.map((o: any) => o.cardId).sort()).toEqual([G1, G2].sort());
	});
});

describe('MagicPrompt', () => {
	const G1 = 'piecie_keyboard', G2 = 'piecie_dumbbells';
	it('needs no Mosje type: searches gear; Gandoe Wizard gains 10', () => {
		const s = run(board('piecie_magicprompt', ALY, WIZ, { deck: cards(G1, 'piecie_tikker') }));
		expect(ids(s.players.player_1.hand)).toEqual([G1]);
		expect(mp(s, 1)).toBe(40);
		expect(mp(s, 0)).toBe(30);
	});
	it('DJ 80/20 counts as a Gandoe', () => {
		const s = run(board('piecie_magicprompt', ALY, DJ, { deck: cards(G1) }));
		expect(mp(s, 1)).toBe(40);
	});
	it('with both: asked which, the search runs once; neither: no MP; gain also without gear', () => {
		const spy = vi.spyOn(console, 'log');
		let s = run(board('piecie_magicprompt', WIZ, DJ, { deck: cards(G1, G2) }));
		s = answer(s, (o) => o.find((x: any) => x.cardId === G1));
		expect(s.pendingChoice.choiceKind).toBe('ownMosje');
		s = answer(s, (o) => o.find((x: any) => x.slotIndex === 1));
		expect(mp(s, 1)).toBe(40);
		expect(mp(s, 0)).toBe(30);
		expect(ids(s.players.player_1.hand)).toEqual([G1]);
		expect(shuffles(spy)).toBe(1);
		const neither = run(board('piecie_magicprompt', ALY, null, { deck: cards(G1) }));
		expect(mp(neither)).toBe(30);
		expect(ids(neither.players.player_1.hand)).toEqual([G1]);
		const nogear = run(board('piecie_magicprompt', WIZ, null, { deck: filler(3) }));
		expect(mp(nogear)).toBe(40);
		expect(nogear.players.player_1.hand).toHaveLength(0);
	});
});

describe('Schetsboek', () => {
	const A = 'piecie_pot_of_weed', B = 'piecie_keyboard', C = 'piecie_tikker', D = 'piecie_dumbbells';
	it('refused without a Creative Mosje', () => {
		expect(activatePiecie(board('piecie_schetsboek', WIZ), 'player_1', 0).success).toBe(false);
	});
	it('picks 1 of the top 2; the other goes to the bottom; the rest is unchanged', () => {
		let s = run(board('piecie_schetsboek', MING, null, { deck: cards(A, B, C, D) }));
		expect(s.pendingChoice.options.map((o: any) => o.cardId)).toEqual([A, B]);
		s = answer(s, (o) => o.find((x: any) => x.cardId === B));
		expect(ids(s.players.player_1.hand)).toEqual([B]);
		expect(ids(s.players.player_1.deck)).toEqual([C, D, A]);
	});
	it('1 card is taken; an empty deck does nothing', () => {
		const one = run(board('piecie_schetsboek', MING, null, { deck: cards(A) }));
		expect(ids(one.players.player_1.hand)).toEqual([A]);
		expect(one.players.player_1.deck).toHaveLength(0);
		const none = run(board('piecie_schetsboek', MING, null, { deck: [] }));
		expect(none.players.player_1.hand).toHaveLength(0);
		expect(none.pendingChoice).toBeUndefined();
	});
});

describe('Headset', () => {
	const A = 'piecie_pot_of_weed', B = 'piecie_keyboard', C = 'piecie_tikker';
	it('refused without a Digital Mosje', () => {
		expect(activatePiecie(board('piecie_headset', ALY), 'player_1', 0).success).toBe(false);
	});
	it('shows the opponent top 2 to the activator only; deck order unchanged; no FPS: no Power', () => {
		const s = run(board('piecie_headset', WIZ, null, { foeDeck: cards(A, B, C) }));
		expect(getRevealedFor(s, 'player_1').flatMap((e: any) => e.cardIds)).toEqual([A, B]);
		expect(getRevealedFor(s, 'player_2')).toEqual([]);
		expect(ids(s.players.player_2.deck)).toEqual([A, B, C]);
		expect(s.players.player_1.activeSlots[0].powerBoostThisTurn || 0).toBe(0);
	});
	it('with one FPS Mosje on the field he gets +10 Power this turn', () => {
		const s = run(board('piecie_headset', WIZ, COERT));
		expect(s.players.player_1.activeSlots[1].powerBoostThisTurn).toBe(10);
		const w = run(board('piecie_headset', WEST, null));
		expect(w.players.player_1.activeSlots[0].powerBoostThisTurn).toBe(10);
	});
	it('with both FPS Mosjes the player is asked which', () => {
		let s = run(board('piecie_headset', COERT, WEST, { foeDeck: cards(A, B) }));
		s = answer(s, (o) => o.find((x: any) => x.slotIndex === 1));
		expect(s.players.player_1.activeSlots[1].powerBoostThisTurn).toBe(10);
		expect(s.players.player_1.activeSlots[0].powerBoostThisTurn || 0).toBe(0);
		expect(getRevealedFor(s, 'player_1')).toHaveLength(1);
	});
	it('1 card in the opponent deck is shown; none shows nothing', () => {
		const one = run(board('piecie_headset', WIZ, null, { foeDeck: cards(A) }));
		expect(getRevealedFor(one, 'player_1').flatMap((e: any) => e.cardIds)).toEqual([A]);
		const none = run(board('piecie_headset', WIZ, null, { foeDeck: [] }));
		expect(getRevealedFor(none, 'player_1')).toEqual([]);
	});
});

