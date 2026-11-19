// @ts-nocheck
// 71-26 (D-39): every pause Phase 71 added gets a bot answer the engine accepts. One case per pause: the state is
// built with the real engine (the card is used, the pause opens), settleMosjePauses answers it, and afterwards there is
// no engine-refused metric, no pause left, no Mosje below 0 MP, and no card lost or duplicated.
import { describe, it, expect, afterEach } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { makePiecieState } from '../helpers/makePiecieState.js';
import { captureBotMetrics } from '../helpers/captureBotMetrics.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { activatePiecie, startTurn, useMosjeAbility } from '../../src/engine/turnManager.js';
import { runMosjeTriggers } from '../../src/engine/mosje/runMosjeTriggers.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { settleMosjePauses } from '../../src/bot/settleMosjePauses.js';
import { chooseTriggerChoice } from '../../src/bot/strategy/chooseTriggerChoice.js';
import { defaultAbilityInputs } from '../../src/bot/strategy/defaultAbilityInputs.js';
import { shouldUseAbility } from '../../src/bot/strategy/shouldUseAbility.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { SELF_LOSS_MP } from '../../src/bot/strategy/cardAmounts.js';
import { getCardTags } from '../../src/bot/strategy/comboTags.js';
import { GIVES_MP_PIECIES } from '../../src/bot/strategy/givesMpPiecies.js';
import { questWinChance } from '../../src/bot/strategy/questWinChance.js';
import { MOSJE_ABILITY_RULES } from '../../src/rules/mosjeAbilityRules.js';
import { STARTER_DECKS_21 } from '../../src/data/starterDecks21.js';

afterEach(() => clearTestDice());

const slotOf = (id: string, mp = 50) => { const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level: 1, mp }); s.entryProtected = false; return s; };
const cards = (...ids: string[]) => ids.map((cardId) => ({ cardId, type: 'PIECIE', faceDown: false }));
const filler = (n: number) => cards(...Array.from({ length: n }, () => 'piecie_pot_of_weed'));
const WIZ = 'mosje_gandoe_wizard', ALY = 'mosje_alyssa_bulldozer', MING = 'mosje_ming_natural', DJ = 'mosje_dj_8020', WEST = 'mosje_fps_west';

const total = (s: any) => Object.values(s.players).reduce((n: number, p: any) => n + (p.hand || []).length + (p.deck || []).length + (p.graveyard || []).length
	+ (p.piecieSlots || []).filter(Boolean).length + (p.activeSlots || []).filter(Boolean).reduce((k: number, m: any) => k + 1 + (m.attachments || []).length, 0), 0);

// Settle every pause of the state with the bot; assert the engine took every answer and the state is legal.
function settle(state: any, label: string, humans: string[] = []) {
	expect(state.pendingChoice, `${label}: a pause must be open`).toBeTruthy();
	const key = state.pendingChoice.key;
	const before = total(state);
	const { result, metrics } = captureBotMetrics(() => settleMosjePauses(state, humans));
	const refused = metrics.filter((m: any) => m.ev === 'engine-refused');
	expect(refused, `${label}: engine-refused`).toEqual([]);
	expect(result.waiting).toBe(false);
	expect(result.state.pendingChoice, `${label}: pause left`).toBeUndefined();
	expect(result.state.pendingDrawStep).toBeUndefined();
	for (const p of Object.values(result.state.players) as any[]) for (const m of p.activeSlots) if (m) expect(m.mp, `${label}: ${m.cardId} MP`).toBeGreaterThanOrEqual(0);
	expect(total(result.state), `${label} (${key}): cards lost or duplicated`).toBe(before);
	return result.state;
}

function board(piecieId: string, first: string, second: string | null = null, o: any = {}) {
	const s: any = makePiecieState({ piecieId });
	s.players.player_1.activeSlots = [slotOf(first, o.mp1 ?? 50), second ? slotOf(second, o.mp2 ?? 50) : null];
	s.players.player_1.energy = 6;
	s.players.player_1.deck = o.deck ?? filler(6);
	s.players.player_1.hand = o.hand ?? [];
	s.players.player_2.deck = o.foeDeck ?? filler(4);
	s.players.player_2.hand = o.foeHand ?? [];
	return s;
}
const open = (s: any, idx = 0) => { const r = activatePiecie(s, 'player_1', idx); expect(r.success, r.error).toBe(true); return r.state; };

describe('the bot answers every Phase 71 pause', () => {
	it('cost_mosje (Te Hard Gaan, Ronalds Fles Fireman, Blikje Monsteros): the richest Mosje pays and stays above 0', () => {
		for (const id of ['piecie_te_hard_gaan', 'piecie_ronalds_fles_fireman', 'piecie_blikje_monsteros']) {
			const s = open(board(id, WIZ, ALY, { mp1: 25, mp2: 60, deck: cards('piecie_a', 'piecie_b', 'piecie_c') }));
			expect(s.pendingChoice.key, id).toBe('cost_mosje');
			const out = settle(s, id);
			expect(out.players.player_1.activeSlots[1].mp, id).toBe(60 - SELF_LOSS_MP[id]);
			expect(out.players.player_1.activeSlots[0].mp).toBe(25);
		}
	});
	it('attach_mosje and attach_replace (Dumbbells onto a full Mosje)', () => {
		const s0 = board('piecie_dumbbells', WIZ, null);
		s0.players.player_1.activeSlots[0].attachments = [{ cardId: 'piecie_koksmes', attachedTurn: 1 }, { cardId: 'piecie_rugbybal', attachedTurn: 1 }];
		let s = open(s0); // one Mosje: attach_mosje is answered by itself, the full Mosje asks attach_replace
		expect(s.pendingChoice.key).toBe('attach_replace');
		s = settle(s, 'attach_replace');
		expect(s.players.player_1.activeSlots[0].attachments.some((a: any) => a.cardId === 'piecie_dumbbells')).toBe(true);
		const two = open(board('piecie_dumbbells', WIZ, ALY)); // two Mosjes: the bot picks one of its own
		expect(two.pendingChoice.key).toBe('attach_mosje');
		const done = settle(two, 'attach_mosje');
		expect(done.players.player_1.activeSlots.filter((m: any) => m && (m.attachments || []).length === 1)).toHaveLength(1);
	});
	it('the friend chooser (MagicPrompt with two Gandoes) and the gear search (Mouse)', () => {
		const G1 = 'piecie_keyboard', G2 = 'piecie_dumbbells';
		const s = open(board('piecie_magicprompt', WIZ, DJ, { deck: cards(G1, G2, 'piecie_tikker') }));
		expect(s.pendingChoice.key).toBeTruthy();
		expect(settle(s, 'magicprompt').players.player_1.hand).toHaveLength(1);
		const m = open(board('piecie_mouse', WIZ, null, { deck: cards('piecie_pot_of_weed', G1, G2) }));
		expect(settle(m, 'mouse').players.player_1.hand).toHaveLength(1);
	});
	it('Schetsboek: picks 1 of the top 2', () => {
		const s = open(board('piecie_schetsboek', MING, null, { deck: cards('piecie_pot_of_weed', 'piecie_keyboard', 'piecie_tikker') }));
		expect(settle(s, 'schetsboek').players.player_1.hand).toHaveLength(1);
	});
	it('the opponent discards: Stookerino and Those Eyelashes Tho...', () => {
		const foeHand = cards('piecie_foo', 'piecie_bar');
		const s1 = open(board('piecie_stookerino', WIZ, null, { foeHand }));
		expect(s1.pendingChoice.playerId).toBe('player_2');
		expect(settle(s1, 'stookerino').players.player_2.graveyard).toHaveLength(1);
		const s2 = open(board('piecie_those_eyelashes', WIZ, WEST, { foeHand }));
		expect(s2.pendingChoice.playerId).toBe('player_2');
		expect(settle(s2, 'eyelashes').players.player_2.graveyard).toHaveLength(1);
	});
	it('Gandoe, The Cloude Wizard: wizard_pick', () => {
		const s = makeEngineState({ turnNumber: 3, players: { player_1: { energy: 3, deck: cards('a', 'b', 'c', 'd'), activeSlots: [slotOf(WIZ), null] }, player_2: { activeSlots: [slotOf('mosje_jeffrey'), null] } } });
		const r = useMosjeAbility(s, 'player_1', WIZ);
		expect(r.state.pendingChoice.options).toHaveLength(3);
		expect(settle(r.state, 'wizard_pick').players.player_1.hand).toHaveLength(1);
	});
	it('FPS West: fps_west_bottom (Leave it first, the default pays no MP)', () => {
		const s = makeEngineState({ turnNumber: 3, players: { player_1: { energy: 3, activeSlots: [slotOf(WEST, 40), null] }, player_2: { hand: cards('a', 'b'), deck: cards('d1', 'd2'), activeSlots: [slotOf('mosje_jeffrey'), null] } } });
		const r = useMosjeAbility(s, 'player_1', WEST);
		expect(r.state.pendingChoice.key).toBe('fps_west_bottom');
		expect(settle(r.state, 'fps_west_bottom').players.player_1.activeSlots[0].mp).toBe(40);
	});
	it('Ming: ming_activate (a Piecie on top)', () => {
		const s = makeEngineState({ turnNumber: 3, players: { player_1: { energy: 3, hand: [], deck: cards('piecie_kannetje_melk', 'piecie_a'), piecieSlots: [null, null, null], activeSlots: [slotOf(MING, 30), null] }, player_2: { activeSlots: [slotOf('mosje_jeffrey', 40), null] } } });
		const r = useMosjeAbility(s, 'player_1', MING);
		expect(r.state.pendingChoice.key).toBe('ming_activate');
		settle(r.state, 'ming_activate');
	});
	it('Chris, The BigStepper: the free Piecie question', () => {
		const placed = (cardId: string) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 });
		pushTestDice([6]);
		const s = makeEngineState({ turnNumber: 3, players: { player_1: { energy: 6, activeSlots: [slotOf('mosje_chris_ddr', 30), null], piecieSlots: [placed('piecie_broodje_doner'), placed('piecie_broodje_doner'), null] }, player_2: { activeSlots: [slotOf('mosje_jeffrey', 80), null] } } });
		const r = activatePiecie(s, 'player_1', 0);
		expect(r.state.pendingChoice).toBeTruthy();
		settle(r.state, 'chris free piecie');
	});
	it('FPS Coert: the Headshot target', () => {
		pushTestDice([6]);
		const s = makeEngineState({ turnNumber: 3, players: { player_1: { activeSlots: [slotOf('mosje_fps_coert', 30), null] }, player_2: { activeSlots: [slotOf('mosje_jeffrey', 50), slotOf('mosje_binti', 50)] } } });
		const out = runMosjeTriggers(s, 'questSuccess', { playerId: 'player_1', slotIndex: 0, quest: { rollTrait: 'technical', category: 'x' }, amount: 40 });
		expect(out.pendingChoice).toBeTruthy();
		const done = settle(out, 'fps_coert target');
		expect(done.players.player_2.activeSlots.reduce((n: number, m: any) => n + m.mp, 0)).toBe(85);
	});
	it('Upkeep: pay 1 Energy or discard', () => {
		const d = PIECIES.find((p: any) => p.id === 'piecie_pot_of_weed'); d.upkeep = true;
		try {
			const st: any = makeEngineState({ turnNumber: 4 });
			st.players.player_1.activeSlots[0] = slotOf(ALY); st.players.player_2.activeSlots[0] = slotOf(ALY);
			st.players.player_1.deck = filler(3); st.players.player_1.energy = 3;
			st.players.player_1.piecieSlots[0] = { cardId: 'piecie_pot_of_weed', type: 'PIECIE', faceDown: false, activated: true, playedOnTurn: 1, stays: true };
			const out = startTurn(st);
			expect(out.pendingChoice?.hook).toBe('upkeep');
			settle(out, 'upkeep');
		} finally { delete d.upkeep; }
	});
});

describe('a pause that is not the bots own is left alone', () => {
	it('a human pause', () => {
		const s = open(board('piecie_stookerino', WIZ, null, { foeHand: cards('piecie_foo', 'piecie_bar') }));
		expect(settleMosjePauses(s, ['player_2']).waiting).toBe(true);
		expect(chooseTriggerChoice(s, 'player_1')).toBeUndefined();
	});
});

describe('ability defaults on the 15 starter Mosjes', () => {
	const starter = [...new Set(STARTER_DECKS_21.flatMap((d: any) => d.mosjes))];
	const world = () => makeEngineState({ turnNumber: 3, players: { player_1: { energy: 6, hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }, { cardId: 'piecie_ronald_kip', type: 'PIECIE' }], deck: filler(6), activeSlots: [slotOf(WIZ, 40), slotOf(ALY, 10)], piecieSlots: [null, null, null] }, player_2: { activeSlots: [slotOf('mosje_jeffrey', 60), slotOf('mosje_binti', 20)] } } });
	it('there are 15 distinct starter Mosjes', () => expect(starter.length).toBe(15));
	it('an activated ability gets a full input set or null; a passive or trigger one is never pressed', () => {
		for (const id of starter as string[]) {
			const abilityId = MOSJES.find((m: any) => m.id === id).abilityId;
			const rule = MOSJE_ABILITY_RULES[abilityId];
			expect(rule, id).toBeTruthy();
			const inputs = defaultAbilityInputs(world(), 'player_1', abilityId);
			if (rule.kind === 'activated') { if (inputs !== null) expect(Object.keys(inputs)).toEqual(rule.inputs.map((i: any) => i.key)); }
			else {
				const s = world(); s.players.player_1.activeSlots[0] = slotOf(id, 40);
				expect(shouldUseAbility(s, 'player_1', 0, undefined), `${id} (${rule.kind}) must not be pressed`).toBe(false);
			}
		}
	});
	it('the Gambler never stakes more Energy than the bot holds', () => {
		const s = world(); s.players.player_1.energy = 1;
		expect(defaultAbilityInputs(s, 'player_1', 'ability_jeffrey_gambler_high_stakes')).toEqual({ stake: 1 });
		s.players.player_1.energy = 0;
		expect(defaultAbilityInputs(s, 'player_1', 'ability_jeffrey_gambler_high_stakes')).toBeNull();
	});
});

describe('the bot tables describe the 2.1 starter Piecies', () => {
	it('SELF_LOSS_MP: the three MP prices, no Snoeiertje', () => {
		expect(SELF_LOSS_MP).toMatchObject({ piecie_te_hard_gaan: 10, piecie_ronalds_fles_fireman: 20, piecie_blikje_monsteros: 15 });
		expect(SELF_LOSS_MP).not.toHaveProperty('piecie_snoeiertje');
		for (const id of ['piecie_te_hard_gaan', 'piecie_ronalds_fles_fireman', 'piecie_blikje_monsteros']) expect(getCardTags(id)).toContain('self-loss');
	});
	it('Late Night Doner and Spiegelen are Power, Kladje draws, Ctrl+S protects, gear gives no MP', () => {
		expect(getCardTags('piecie_broodje_doner')).toEqual(['power']);
		expect(getCardTags('piecie_eendjes_voeren')).toEqual(['power']);
		expect(getCardTags('piecie_energy_surge')).toEqual(['draw']);
		expect(getCardTags('piecie_momentum_boost')).toEqual(['defense']);
		expect(GIVES_MP_PIECIES.has('piecie_momentum_boost')).toBe(false);
		for (const id of ['piecie_dumbbells', 'piecie_koksmes', 'piecie_rugbybal', 'piecie_hawaiishirt']) {
			expect(getCardTags(id)).not.toContain('mp-gain');
			expect(getCardTags(id)).not.toContain('attack');
		}
	});
	it('questWinChance counts the ease of Zwoele Ming Power (never below 1 success)', () => {
		expect(questWinChance('skilled', 2, 1)).toBeCloseTo(questWinChance('steady', 2));
		expect(questWinChance('skilled', 2, 1)).toBeGreaterThan(questWinChance('skilled', 2));
		expect(questWinChance('steady', 2, 5)).toBeCloseTo(questWinChance('steady', 2));
	});
});
