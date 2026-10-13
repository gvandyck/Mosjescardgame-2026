// ability-defaults — the bot's default ability inputs and trigger choices (58-03).
import { describe, it, expect } from 'vitest';
// @ts-ignore
import { defaultAbilityInputs } from '../../src/bot/strategy/defaultAbilityInputs.js';
// @ts-ignore
import { chooseTriggerChoice } from '../../src/bot/strategy/chooseTriggerChoice.js';
// @ts-ignore
import { settleMosjePauses } from '../../src/bot/settleMosjePauses.js';
// @ts-ignore
import { MOSJE_ABILITY_RULES } from '../../src/rules/mosjeAbilityRules.js';

const mosje = (mp: number, extra: any = {}) => ({ cardId: 'mosje_x', name: 'X', mp, level: 1, isDefeated: false, ...extra });
function state(extra: any = {}): any {
	return {
		turnNumber: 3, activePlayerId: 'bot', questStacks: { FIGHTING: {} },
		players: {
			bot: { hand: [{ cardId: 'piecie_a', type: 'PIECIE' }, { cardId: 'piecie_b', type: 'PIECIE' }], deck: [1, 2, 3, 4, 5, 6].map(i => ({ cardId: 'c' + i })), piecieSlots: [null, null, null], activeSlots: [mosje(40), mosje(10)], energy: 6 },
			human: { hand: [{ cardId: 'piecie_h', type: 'PIECIE' }], deck: [], piecieSlots: [null, null, null], activeSlots: [mosje(20), mosje(60), mosje(80, { entryProtected: true })] },
		},
		...extra,
	};
}

describe('defaultAbilityInputs', () => {
	it('own Mosje = lowest MP', () => {
		expect(defaultAbilityInputs(state(), 'bot', 'ability_tuk_healer_healing_presence')).toEqual({ own_slot_index: 1 });
	});
	it('opponent Mosje = highest-MP non-fresh', () => {
		expect(defaultAbilityInputs(state(), 'bot', 'ability_gandoe_destroyer_elimination_strike')).toEqual({ opp_slot_index: 1 });
	});
	it('skips (null) when an input has no legal answer', () => {
		const s = state(); s.players.bot.hand = [];
		expect(defaultAbilityInputs(s, 'bot', 'ability_martin_driver_perfect_line')).toBeNull();
	});
	it('orderTopN keeps order on the chosen deck; number takes a mid value', () => {
		expect(defaultAbilityInputs(state(), 'bot', 'ability_hacker_system_hack')).toEqual({ deck_owner: 'bot', order: [0, 1, 2] });
		expect(defaultAbilityInputs(state(), 'bot', 'ability_tactician_mp_manipulation')).toEqual({ target: { playerId: 'bot', slotIndex: 1 }, mp: 45 });
	});
	it('reads the opponent hand ONLY for Ronald Chef and FPS West', () => {
		const withHand = Object.entries(MOSJE_ABILITY_RULES as Record<string, any>).filter(([, r]) => r.inputs.some((i: any) => i.kind === 'oppHandCard')).map(([id]) => id);
		expect(withHand).toEqual(['ability_ronald_chef_strategic_insight']); // FPS West asks a card TYPE, never a hand card
		expect(defaultAbilityInputs(state(), 'bot', 'ability_ronald_chef_strategic_insight')).toEqual({ locked_card: 0 });
		const s = state(); s.players.human.hand = [];
		expect(defaultAbilityInputs(s, 'bot', 'ability_ronald_chef_strategic_insight')).toBeNull();
		// an ability without the peek permission never gets an opponent hand index
		expect(defaultAbilityInputs(state(), 'bot', 'ability_tuk_healer_healing_presence')).not.toHaveProperty('locked_card');
	});
	it('every activated ability gets an answer or a clean null (never throws)', () => {
		for (const [id, rule] of Object.entries(MOSJE_ABILITY_RULES as Record<string, any>)) {
			if (rule.kind !== 'activated') continue;
			const r = defaultAbilityInputs(state(), 'bot', id);
			if (r !== null) expect(Object.keys(r)).toEqual(rule.inputs.map((i: any) => i.key));
		}
	});
});

describe('chooseTriggerChoice + settleMosjePauses', () => {
	it('answers only its own pendingChoice', () => {
		const s = state({ pendingChoice: { playerId: 'bot', options: [{ a: 1 }, { a: 2 }] } });
		expect(chooseTriggerChoice(s, 'bot')).toEqual({ a: 1 });
		expect(chooseTriggerChoice(s, 'human')).toBeUndefined();
	});
	it('settleMosjePauses stops at a human pause and never loops', () => {
		const s = state({ pendingDrawStep: { playerId: 'human', options: [] } });
		expect(settleMosjePauses(s, ['human']).waiting).toBe(true);
	});
});
