// @ts-nocheck
// Phase 71-07: the Attach gear (Dumbbells, Koksmes, Rugbybal, Hawaiishirt) and Jeffrey, The Strongman = "3 attachments".
// Real engine through activatePiecie / attackMosje / getQuestDiceCount.
import { describe, it, expect } from 'vitest';
import { activatePiecie } from '../../src/engine/turnManager.js';
import { attackMosje } from '../../src/engine/actions/attackMosje.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { getPower } from '../../src/engine/mp/getPower.js';
import { getQuestDiceCount } from '../../src/engine/quests/getQuestDiceCount.js';
import { getEffectiveCost } from '../../src/engine/energy/getEffectiveCost.js';
import { getReadyPiecies } from '../../src/engine/attachments/getReadyPiecies.js';
import { attachToMosje } from '../../src/engine/attachments/attachToMosje.js';
import { returnMosjeToHand } from '../../src/engine/gameState.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { PENDING_STARTER_EFFECTS } from '../../src/data/pendingStarterEffects.js';
import { forceQuestResult } from '../helpers/forceQuestResult.js';
import { makePiecieState } from '../helpers/makePiecieState.js';

const slotOf = (id: string, mp = 50) => {
	const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level: 1, mp });
	s.entryProtected = false;
	return s;
};
const WIZ = 'mosje_gandoe_wizard', ALY = 'mosje_alyssa_bulldozer', CHEF = 'mosje_ronald_chef';
const PHIL = 'mosje_ronald_mastermind', JEF = 'mosje_jeffrey', CHRIS = 'mosje_chris';
const strQuest = { rollTrait: 'strength' };
const techQuest = { rollTrait: 'technical' };

function board(piecieId: string, first = WIZ, second: string | null = null, pick: any = {}) {
	const s: any = makePiecieState({ piecieId });
	s.players.player_1.activeSlots = [slotOf(first), second ? slotOf(second) : null];
	s.players.player_1.energy = 6;
	s._pendingTargets = pick;
	return s;
}
const run = (s: any, idx = 0) => {
	const r = activatePiecie(s, 'player_1', idx);
	expect(r.success, r.error).toBe(true);
	return r.state;
};
const slot = (s: any, i = 0) => s.players.player_1.activeSlots[i];
const power = (s: any, i = 0) => getPower(slot(s, i), s, 'player_1');
const place = (s: any, id: string, i: number) => {
	s.players.player_1.piecieSlots[i] = { cardId: id, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 };
};

describe('no pending handlers left for the four Attach cards', () => {
	it('Rugbybal, Koksmes and Hawaiishirt are no longer pending', () => {
		for (const id of ['effect_rugbybal', 'effect_koksmes', 'effect_hawaiishirt']) expect(PENDING_STARTER_EFFECTS).not.toContain(id);
	});
});

describe('Dumbbells', () => {
	it('attaches without any MP; +1 die on a Str Quest only, for that Mosje only', () => {
		const r0 = activatePiecie(board('piecie_dumbbells', WIZ, CHRIS), 'player_1', 0);
		expect(r0.paused).toBe(true);
		const s = resolvePendingChoice(r0.state, r0.state.pendingChoice.options[0]).state;
		expect(slot(s).attachments.map((a: any) => a.cardId)).toEqual(['piecie_dumbbells']);
		expect(slot(s).mp).toBe(50);
		const before = getQuestDiceCount(s, 'player_1', slot(s, 1), strQuest);
		const bare = slotOf(WIZ);
		bare.traits = slot(s).traits;
		expect(getQuestDiceCount(s, 'player_1', slot(s), strQuest)).toBe(Math.min(6, getQuestDiceCount(s, 'player_1', bare, strQuest) + 1));
		expect(getQuestDiceCount(s, 'player_1', slot(s), techQuest)).toBe(getQuestDiceCount(s, 'player_1', bare, techQuest));
		expect(getQuestDiceCount(s, 'player_1', slot(s, 1), strQuest)).toBe(before);
	});
	it('two Dumbbells give 2 dice; the total stays at 6 or less', () => {
		const s = board('piecie_dumbbells');
		slot(s).traits = { strength: 1, technical: 1, creative: 1 };
		const one = getQuestDiceCount(s, 'player_1', slot(s), strQuest);
		slot(s).attachments = [{ cardId: 'piecie_dumbbells', attachedTurn: 1 }, { cardId: 'piecie_dumbbells', attachedTurn: 1 }];
		expect(getQuestDiceCount(s, 'player_1', slot(s), strQuest)).toBe(one + 2);
		s.activePlace = 'place_the_gym';
		slot(s).traits = { strength: 5 };
		expect(getQuestDiceCount(s, 'player_1', slot(s), strQuest)).toBe(6);
	});
	it('a Personal Quest roll with a Str trait counts it too', () => {
		const s = board('piecie_dumbbells');
		slot(s).traits = { strength: 1 };
		const none = getQuestDiceCount(s, 'player_1', slot(s), strQuest);
		attachToMosje(s, 'player_1', 0, 'piecie_dumbbells', {});
		expect(getQuestDiceCount(s, 'player_1', slot(s), strQuest)).toBe(none + 1);
	});
});

describe('Koksmes', () => {
	it('+10 Power while attached', () => {
		const s0 = board('piecie_koksmes');
		const base = power(s0);
		const s = run(s0);
		expect(power(s)).toBe(base + 10);
	});
	it('+20 on both Ronalds', () => {
		for (const id of [CHEF, PHIL]) {
			const s0 = board('piecie_koksmes', id);
			const base = power(s0);
			expect(power(run(s0))).toBe(base + 20);
		}
	});
	it('replaced by a third attachment: the Power is gone', () => {
		const s0 = board('piecie_koksmes');
		const base = power(s0);
		const s1 = run(s0);
		slot(s1).attachments.push({ cardId: 'piecie_dumbbells', attachedTurn: 1 });
		place(s1, 'piecie_hawaiishirt', 1);
		s1.players.player_1.energy = 6;
		const r = activatePiecie(s1, 'player_1', 1);
		expect(r.paused).toBe(true);
		const opt = r.state.pendingChoice.options.find((o: any) => o.attachIndex === 0);
		const done = resolvePendingChoice(r.state, opt).state;
		expect(slot(done).attachments.map((a: any) => a.cardId)).not.toContain('piecie_koksmes');
		expect(power(done)).toBe(base);
	});
	it('the Mosje leaves the field: the card is in the pile and the Power is gone', () => {
		const s = run(board('piecie_koksmes'));
		expect(s.timedEffects.length).toBe(1);
		const out = returnMosjeToHand(s, 'player_1', 0);
		expect((out.players.player_1.graveyard || []).map((e: any) => e.cardId)).toContain('piecie_koksmes');
		expect(out.timedEffects || []).toHaveLength(0);
	});
});

describe('Rugbybal', () => {
	it('+10 Power while attached', () => {
		const s0 = board('piecie_rugbybal');
		const base = power(s0);
		expect(power(run(s0))).toBe(base + 10);
	});
	const attackWith = (first: string, second: string | null, extra: any = {}) => {
		const s = run(board('piecie_rugbybal', first, second, { attach_mosje: { slotIndex: 0 } }));
		s.players.player_1.activeSlots[0].actedThisTurn = false;
		Object.assign(s.players.player_1.activeSlots[0], extra);
		s.players.player_2.activeSlots[0].mp = 80;
		s.players.player_2.activeSlots[1] = slotOf(WIZ, 80);
		return s;
	};
	it('Alyssa gains 10 MP each time she attacks', () => {
		const s = attackWith(ALY, null);
		const mp0 = slot(s).mp;
		const r = attackMosje(s, 'player_1', { attackerSlotIndex: 0, targetPlayerId: 'player_2', targetSlotIndex: 0 }, { skipReactions: true });
		expect(r.ok, r.error).toBe(true);
		expect(slot(r.state).mp).toBe(mp0 + 10);
	});
	it('also once when her attack hits two Mosjes', () => {
		const s = attackWith(ALY, null, { hitBothOpponents: true });
		const mp0 = slot(s).mp;
		const r = attackMosje(s, 'player_1', { attackerSlotIndex: 0, targetPlayerId: 'player_2', targetSlotIndex: 0 }, { skipReactions: true });
		expect(r.ok, r.error).toBe(true);
		expect(slot(r.state).mp).toBe(mp0 + 10);
	});
	it('another Mosje gains nothing', () => {
		const s = attackWith(WIZ, null);
		const mp0 = slot(s).mp;
		const r = attackMosje(s, 'player_1', { attackerSlotIndex: 0, targetPlayerId: 'player_2', targetSlotIndex: 0 }, { skipReactions: true });
		expect(r.ok, r.error).toBe(true);
		expect(slot(r.state).mp).toBe(mp0);
	});
});

describe('Hawaiishirt', () => {
	const shirtOn = () => {
		const s = run(board('piecie_hawaiishirt'));
		s.players.player_1.energy = 6;
		s.players.player_1.piecieActivationsThisTurn = 0;
		return s;
	};
	it('costs 2 Energy itself', () => {
		const s = board('piecie_hawaiishirt');
		const r = run(s);
		expect(r.players.player_1.energy).toBe(4);
	});
	it('the first Piecie each turn costs 1 less, a 1-cost card 0, the second full price, next turn cheaper again', () => {
		const s = shirtOn();
		const cost = (id: string) => getEffectiveCost(s, 'player_1', id, 'piecie');
		expect(cost('piecie_kannetje_melk')).toBe(Math.max(0, getEffectiveCost(board('x'), 'player_1', 'piecie_kannetje_melk', 'piecie') - 1));
		expect(cost('piecie_broodje_doner')).toBe(0);
		s.players.player_1.piecieActivationsThisTurn = 1;
		expect(cost('piecie_broodje_doner')).toBe(1);
		s.players.player_1.piecieActivationsThisTurn = 0; // next turn
		expect(cost('piecie_broodje_doner')).toBe(0);
	});
	it('a 0-cost card stays 0 and the discount is used', () => {
		const s = shirtOn();
		expect(getEffectiveCost(s, 'player_1', 'piecie_pot_of_weed', 'piecie')).toBe(Math.max(0, getEffectiveCost(board('x'), 'player_1', 'piecie_pot_of_weed', 'piecie') - 1));
		place(s, 'piecie_broodje_doner', 1);
		place(s, 'piecie_broodje_doner', 2);
		const e0 = s.players.player_1.energy;
		const a = run(s, 1);
		expect(a.players.player_1.energy).toBe(e0); // 1-cost card for 0
		const b = run(a, 2);
		expect(b.players.player_1.energy).toBe(e0 - 1); // second pays full
	});
	it('the opponent gets no discount', () => {
		const s = shirtOn();
		expect(getEffectiveCost(s, 'player_2', 'piecie_broodje_doner', 'piecie')).toBe(1);
	});
});

describe('attached gear still counts as ready gear', () => {
	it('all four are found by getReadyPiecies', () => {
		const s = board('piecie_dumbbells', JEF);
		slot(s).attachments = [];
		for (const id of ['piecie_dumbbells', 'piecie_koksmes', 'piecie_rugbybal']) attachToMosje(s, 'player_1', 0, id, {});
		expect(getReadyPiecies(s, 'player_1', { tag: 'gear' }).filter((g: any) => g.zone === 'attached')).toHaveLength(3);
	});
});

describe('Jeffrey, The Strongman', () => {
	it('takes a third attachment without a question, asks at the fourth; another Mosje asks at the third', () => {
		const s = board('piecie_rugbybal', JEF);
		slot(s).attachments = [{ cardId: 'piecie_dumbbells', attachedTurn: 1 }, { cardId: 'piecie_koksmes', attachedTurn: 1 }];
		const r = activatePiecie(s, 'player_1', 0);
		expect(r.success).toBe(true);
		expect(r.paused).toBeFalsy();
		expect(slot(r.state).attachments).toHaveLength(3);
		const o = board('piecie_rugbybal', WIZ);
		slot(o).attachments = [{ cardId: 'piecie_dumbbells', attachedTurn: 1 }, { cardId: 'piecie_koksmes', attachedTurn: 1 }];
		expect(activatePiecie(o, 'player_1', 0).paused).toBe(true);
	});
	it('his owner can activate Kannetje Melk; the picked Mosje gains 25', () => {
		const s = board('piecie_kannetje_melk', JEF, WIZ, { own_slot_index: 1 });
		const r = activatePiecie(s, 'player_1', 0);
		expect(r.success, r.error).toBe(true);
		expect(slot(r.state, 1).mp).toBe(75);
	});
	it('a Quest win gives the Quest MP and nothing extra', () => {
		const s: any = board('piecie_kannetje_melk', JEF, WIZ);
		slot(s).mp = 30;
		slot(s, 1).mp = 30;
		const res = forceQuestResult(s, 'player_1', { questId: 'quest_quick_thinking', win: true });
		expect(res.players.player_1.activeSlots[0].mp).toBe(30 + 25);
	});
});
