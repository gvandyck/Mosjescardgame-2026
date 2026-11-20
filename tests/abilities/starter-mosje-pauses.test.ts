// @ts-nocheck
// Phase 72-11: the pause options of Wizard, FPS West, Ming and the attach replace carry the card id (for the card faces in the
// option modal) and still resolve exactly as before.
import { describe, expect, it } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { makePiecieState } from '../helpers/makePiecieState.js';
import { mkSlot, byName } from '../helpers/quest56.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { useMosjeAbility, activatePiecie } from '../../src/engine/turnManager.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { getBotView } from '../../src/bot/strategy/getBotView.js';
import { MOSJES } from '../../src/data/mosjes.js';

const def = (id: string) => MOSJES.find((m: any) => m.id === id);
const mk = (id: string, mp = 30) => { const s = createMosjeSlot(def(id), { level: 1, mp }); s.entryProtected = false; return s; };
const cards = (...ids: string[]) => ids.map(cardId => ({ cardId, type: 'PIECIE' }));
const ids = (xs: any[]) => xs.map((x: any) => x.cardId);

describe('Gandoe, The Cloude Wizard: options carry the card', () => {
	const game = () => makeEngineState({ turnNumber: 3, players: { player_1: { energy: 3, deck: cards('a', 'b', 'c', 'd', 'e'), hand: [], activeSlots: [mk('mosje_gandoe_wizard'), null] }, player_2: { activeSlots: [mk('mosje_jeffrey'), null] } } });
	it('the top 3 options have cardId', () => {
		const r = useMosjeAbility(game(), 'player_1', 'mosje_gandoe_wizard');
		expect(r.state.pendingChoice.options.map((o: any) => o.cardId)).toEqual(['a', 'b', 'c']);
	});
	it('answering by option keeps the pick and bottoms the others', () => {
		const r = useMosjeAbility(game(), 'player_1', 'mosje_gandoe_wizard');
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[1]).state;
		expect(ids(out.players.player_1.hand)).toEqual(['b']);
		expect(ids(out.players.player_1.deck)).toEqual(['d', 'e', 'a', 'c']);
	});
});

describe('FPS West: options carry the opponent card, Leave it has none', () => {
	const hand = (...i: string[]) => i.map(cardId => ({ cardId, type: 'PIECIE' }));
	const game = () => makeEngineState({ turnNumber: 3, players: { player_1: { energy: 3, activeSlots: [mk('mosje_fps_west', 40), null] }, player_2: { hand: hand('a', 'b'), deck: hand('d1', 'd2'), activeSlots: [mk('mosje_jeffrey'), null] } } });
	it('cardId on every card option, none on Leave it', () => {
		const r = useMosjeAbility(game(), 'player_1', 'mosje_fps_west');
		const o = r.state.pendingChoice.options;
		expect(o[0]).toEqual({ label: 'Leave it', index: -1 });
		expect(o.slice(1).map((x: any) => x.cardId)).toEqual(['a', 'b']);
	});
	it('Leave it does nothing, a card goes to the bottom for 20 MP', () => {
		const r = useMosjeAbility(game(), 'player_1', 'mosje_fps_west');
		const left = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
		expect(left.players.player_1.activeSlots[0].mp).toBe(40);
		expect(ids(left.players.player_2.hand)).toEqual(['a', 'b']);
		const took = resolvePendingChoice(r.state, r.state.pendingChoice.options[1]).state;
		expect(took.players.player_1.activeSlots[0].mp).toBe(20);
		expect(ids(took.players.player_2.hand)).not.toContain('a');
	});
	it('the opponent view of the pause holds no options', () => {
		const r = useMosjeAbility(game(), 'player_1', 'mosje_fps_west');
		expect(getBotView(r.state, 'player_2').pendingChoice.options).toEqual([]);
	});
});

describe('Ming, The Natural: the drawn card is the prompt card, keep is the leave', () => {
	const MING = byName(/Ming, The Natural/);
	const board = () => makeEngineState({ turnNumber: 5, players: { player_1: { energy: 3, hand: [], deck: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }, { cardId: 'snelle_jensen', type: 'SNELLE_PIECIE' }], piecieSlots: [null, null, null], activeSlots: [mkSlot({ mp: 30 }, MING), null] }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } } });
	it('promptCardId is the drawn Piecie', () => {
		const r = useMosjeAbility(board(), 'player_1', MING.id);
		expect(r.state.pendingChoice.promptCardId).toBe('piecie_kannetje_melk');
		expect(r.state.pendingChoice.prompt).toMatch(/Ming drew/);
	});
	it('keep leaves it in the hand, activate runs it', () => {
		const r = useMosjeAbility(board(), 'player_1', MING.id);
		const o = r.state.pendingChoice.options;
		const kept = resolvePendingChoice(r.state, o.find((x: any) => x.choice === 'keep')).state;
		expect(ids(kept.players.player_1.hand)).toEqual(['piecie_kannetje_melk']);
		const act = resolvePendingChoice(r.state, o.find((x: any) => x.choice === 'activate')).state;
		expect(act.players.player_1.activeSlots[0].mp).toBe(55);
	});
});

describe('Attach replace: options carry the attached card', () => {
	it('cardId per attachment, answer swaps the chosen one', () => {
		const s = makePiecieState({ piecieId: 'piecie_dumbbells' });
		const j = mk('mosje_gandoe_wizard');
		j.attachments = [{ cardId: 'piecie_rugbybal', attachedTurn: 1 }, { cardId: 'piecie_koksmes', attachedTurn: 1 }];
		s.players.player_1.activeSlots = [j, null];
		const r = activatePiecie(s, 'player_1', 0);
		const pc = r.state.pendingChoice;
		expect(pc.key).toBe('attach_replace');
		expect(pc.options.map((o: any) => o.cardId)).toEqual(['piecie_rugbybal', 'piecie_koksmes']);
		const done = resolvePendingChoice(r.state, pc.options[1]).state;
		expect(done.players.player_1.activeSlots[0].attachments.map((a: any) => a.cardId)).toEqual(['piecie_rugbybal', 'piecie_dumbbells']);
	});
});
