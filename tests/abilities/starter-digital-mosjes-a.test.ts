// @ts-nocheck
// Phase 71-12: Coert, The Hawaiian Tech Savant (mosje_coert_tech), Gandoe, The Cloude Wizard (mosje_gandoe_wizard)
// and Youri, The Speedrunner (mosje_youri) on the 2.1 text.
import { describe, expect, it } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { startTurn, useMosjeAbility, playPiecie, activatePiecie } from '../../src/engine/turnManager.js';
import { finishDrawStep } from '../../src/engine/mosje/finishDrawStep.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { getBotView } from '../../src/bot/strategy/getBotView.js';
import { PIECIES } from '../../src/data/piecies.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { MOSJE_TRIGGERS } from '../../src/engine/mosje/mosjeTriggers.js';

const def = (id: string) => MOSJES.find((m: any) => m.id === id);
const mk = (id: string, level = 1) => { const s = createMosjeSlot(def(id), { level, mp: 30 }); s.entryProtected = false; return s; };
const cards = (...ids: string[]) => ids.map(cardId => ({ cardId, type: 'PIECIE' }));
const ids = (xs: any[]) => xs.map((x: any) => x.cardId);

describe('Coert, The Hawaiian Tech Savant (draw step)', () => {
	const turn = (energy: number) => startTurn(makeEngineState({
		turnNumber: 3,
		players: { player_1: { energy, deck: cards('a', 'b', 'c', 'd', 'e', 'f'), activeSlots: [mk('mosje_coert_tech'), null] }, player_2: { activeSlots: [mk('mosje_jeffrey'), null] } },
	}));
	const use = (s: any, extra: number) => finishDrawStep(s, 'player_1', { use: ['mosje_coert_tech'], mosje_coert_tech: { extra } }).state.players.player_1;
	it('pauses the draw step when the owner has Energy', () => {
		expect(turn(2).pendingDrawStep.options).toEqual([{ mosjeId: 'mosje_coert_tech' }]);
	});
	it('1 extra: draws 1 more and costs 1 Energy', () => {
		const p = use(turn(2), 1);
		expect(p.hand).toHaveLength(2);
		expect(p.energy).toBe(2); // 2 + 1 turn gain - 1
	});
	it('2 extra: draws 2 more and costs 2 Energy', () => {
		const p = use(turn(2), 2);
		expect(p.hand).toHaveLength(3);
		expect(p.energy).toBe(1);
	});
	it('skipping costs nothing and the normal draw happens', () => {
		const p = finishDrawStep(turn(2), 'player_1', {}).state.players.player_1;
		expect(p.hand).toHaveLength(1);
		expect(p.energy).toBe(3);
	});
});

describe('Gandoe, The Cloude Wizard', () => {
	const game = (deck: any[], extra: any = {}) => makeEngineState({
		turnNumber: 3,
		players: { player_1: { energy: 3, deck, hand: [], activeSlots: [mk('mosje_gandoe_wizard'), null], ...extra }, player_2: { activeSlots: [mk('mosje_jeffrey'), null] } },
	});
	const wiz = (s: any) => s.players.player_1.activeSlots[0];
	const p1 = (s: any) => s.players.player_1;
	const use = (s: any) => useMosjeAbility(s, 'player_1', 'mosje_gandoe_wizard');

	it('rule and cost: activated once per turn for 1 Energy, no start-of-turn trigger', () => {
		expect(MOSJE_TRIGGERS.startOfTurn.some((t: any) => t.mosjeId === 'mosje_gandoe_wizard')).toBe(false);
		expect(MOSJE_TRIGGERS.wizardPick).toBeTruthy();
	});
	it('pauses with the top 3 as options, costs 1 Energy', () => {
		const r = use(game(cards('a', 'b', 'c', 'd', 'e')));
		expect(r.success, r.error).toBe(true);
		expect(r.state.pendingChoice.playerId).toBe('player_1');
		expect(r.state.pendingChoice.options).toHaveLength(3);
		expect(r.state.pendingChoice.options.map((o: any) => o.index)).toEqual([0, 1, 2]);
		expect(p1(r.state).energy).toBe(2);
	});
	it('the picked card goes to the hand, the other two to the bottom in order', () => {
		const r = use(game(cards('a', 'b', 'c', 'd', 'e')));
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[1]).state;
		expect(ids(p1(out).hand)).toEqual(['b']);
		expect(ids(p1(out).deck)).toEqual(['d', 'e', 'a', 'c']);
		expect(out.pendingChoice).toBeUndefined();
	});
	it('two copies of one card are two options', () => {
		const r = use(game(cards('a', 'a', 'c', 'd')));
		expect(r.state.pendingChoice.options).toHaveLength(3);
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[2]).state;
		expect(ids(p1(out).hand)).toEqual(['c']);
		expect(ids(p1(out).deck)).toEqual(['d', 'a', 'a']);
	});
	it('2 cards: pick 1 of 2, the other goes to the bottom', () => {
		const r = use(game(cards('a', 'b')));
		expect(r.state.pendingChoice.options).toHaveLength(2);
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[1]).state;
		expect(ids(p1(out).hand)).toEqual(['b']);
		expect(ids(p1(out).deck)).toEqual(['a']);
	});
	it('1 card: taken without a question', () => {
		const r = use(game(cards('a')));
		expect(r.success).toBe(true);
		expect(r.state.pendingChoice).toBeUndefined();
		expect(ids(p1(r.state).hand)).toEqual(['a']);
		expect(p1(r.state).deck).toHaveLength(0);
		expect(p1(r.state).energy).toBe(2);
	});
	it('empty deck: refused, no Energy paid', () => {
		const r = use(game([]));
		expect(r.success).toBe(false);
		expect(r.state.players.player_1.energy).toBe(3);
	});
	it('0 Energy: refused', () => {
		const s = game(cards('a', 'b', 'c'));
		s.players.player_1.energy = 0;
		expect(use(s).success).toBe(false);
	});
	it('once per turn', () => {
		const r = use(game(cards('a', 'b', 'c', 'd')));
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
		const again = use(out);
		expect(again.success).toBe(false);
		expect(p1(out).energy).toBe(2);
	});
	it('nothing happens for him at the start of the turn', () => {
		const s = game(cards('a', 'b', 'c', 'd'));
		const before = wiz(s).mp;
		const out = startTurn(s);
		const w = wiz(out);
		expect(w.mp).toBe(before);
		expect(w.powerBoostThisTurn || 0).toBe(0);
	});
	it('the opponent never sees the three cards', () => {
		const r = use(game(cards('a', 'b', 'c', 'd')));
		const view = getBotView(r.state, 'player_2');
		expect(view.pendingChoice.options).toEqual([]);
		expect(JSON.stringify(view)).not.toContain('"a"');
	});
	it('an answer that is not one of the three is refused', () => {
		const r = use(game(cards('a', 'b', 'c', 'd')));
		const bad = resolvePendingChoice(r.state, { label: 'd', index: 3 });
		expect(bad.ok).toBe(false);
	});
});

describe('Youri, The Speedrunner', () => {
	const game = (level = 1, extra: any = {}, placed = true) => {
		const s = makeEngineState({
			turnNumber: 3,
			players: {
				player_1: { energy: 5, hand: [], deck: cards('d1', 'd2', 'd3'), activeSlots: [mk('mosje_youri', level), null], piecieSlots: [null, null, null], ...extra },
				player_2: { activeSlots: [mk('mosje_jeffrey'), null] },
			},
		});
		if (placed) s.players.player_1.piecieSlots[0] = { cardId: 'piecie_momentum_diefje', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 3, canActivateOnTurn: 4 };
		s._pendingTargets = { piecie_slot: 0 };
		return s;
	};
	const use = (s: any) => useMosjeAbility(s, 'player_1', 'mosje_youri');

	it('Level 1: 1 Energy, the Piecie is ready now, no card drawn', () => {
		const r = use(game(1));
		expect(r.success, r.error).toBe(true);
		const p = r.state.players.player_1;
		expect(p.piecieSlots[0].canActivateOnTurn).toBe(3);
		expect(p.energy).toBe(4);
		expect(p.hand).toHaveLength(0);
		expect(p.deck).toHaveLength(3);
	});
	it('Level 2 and 3: the same, then draw 1', () => {
		for (const lvl of [2, 3]) {
			const r = use(game(lvl));
			expect(r.success).toBe(true);
			expect(r.state.players.player_1.hand).toHaveLength(1);
			expect(r.state.players.player_1.energy).toBe(4);
		}
	});
	it('activating the freed Piecie still costs its own Energy', () => {
		const r = use(game(1));
		const before = r.state.players.player_1.energy;
		const act = activatePiecie(r.state, 'player_1', 0);
		expect(act.success, act.error).toBe(true);
		expect(act.state.players.player_1.energy).toBe(before - 2);
	});
	it('a Piecie placed on an earlier turn is refused, nothing paid', () => {
		const s = game(1);
		s.players.player_1.piecieSlots[0].playedOnTurn = 2;
		const r = use(s);
		expect(r.success).toBe(false);
		expect(r.state.players.player_1.energy).toBe(5);
	});
	it('no Piecie placed: refused', () => {
		expect(use(game(1, {}, false)).success).toBe(false);
	});
	it('once per turn; after Rebouleh a second use costs 1 Energy again', () => {
		const r = use(game(1));
		const s = r.state;
		s.players.player_1.piecieSlots[1] = { cardId: 'piecie_momentum_diefje', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 3, canActivateOnTurn: 4 };
		s._pendingTargets = { piecie_slot: 1 };
		expect(use(s).success).toBe(false);
		s.players.player_1.activeSlots[0].extraAbilityUses = 1;
		const again = use(s);
		expect(again.success, again.error).toBe(true);
		expect(again.state.players.player_1.energy).toBe(3);
	});
	it('the extra use without Energy is refused', () => {
		const r = use(game(1));
		const s = r.state;
		s.players.player_1.energy = 0;
		s.players.player_1.activeSlots[0].extraAbilityUses = 1;
		s.players.player_1.piecieSlots[1] = { cardId: 'piecie_momentum_diefje', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 3, canActivateOnTurn: 4 };
		s._pendingTargets = { piecie_slot: 1 };
		expect(use(s).success).toBe(false);
	});
	it('with Chris also on the field a placed Piecie is still not activatable', () => {
		const s = game(1, { hand: cards('piecie_momentum_diefje') }, false);
		s.players.player_1.activeSlots[1] = mk('mosje_chris_ddr');
		const diefje = PIECIES.find((p: any) => p.id === 'piecie_momentum_diefje');
		const r = playPiecie(s, 'player_1', { cardId: 'piecie_momentum_diefje', type: 'PIECIE' }, diefje);
		expect(r.success, r.error).toBe(true);
		const slot = r.state.players.player_1.piecieSlots.find((x: any) => x);
		expect(slot.canActivateOnTurn).toBe(4);
	});
	it('the old synergy line is switched off', () => {
		expect(def('mosje_youri').synergyEffect).toBeNull();
	});
});
