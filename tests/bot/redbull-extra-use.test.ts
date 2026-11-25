// @ts-nocheck
// Rebouleh (piecie_redbull): "One of your Mosjes can use its once-per-turn ability one more time this turn."
// Found 2026-11-24 in full-game.spec.js: the bot activated it (2 Energy) in every turn it could, with no ability used and no
// second use ever taken. That kept its Energy at 2 or 3 for 100+ turns, so it never summoned another Mosje and the game stalled.
// Now: it is useful only after one of its Mosjes used such an ability this turn, and the bot then takes the extra use.
import { describe, it, expect } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { isUsefulActivation } from '../../src/bot/strategy/isUsefulActivation.js';
import { planPiecieActivations } from '../../src/bot/strategy/planPiecieActivations.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { getBotProfile } from '../../src/bot/strategy/botProfiles.js';

const REDBULL = 'piecie_redbull';
const WIZARD = MOSJES.find((m) => m.id === 'mosje_gandoe_wizard'); // "Once per turn: pay 1 Energy; look at the top 3 cards of your deck..."
const MICHELLE = MOSJES.find((m) => m.id === 'mosje_michelle'); // no button
const filler = (n) => Array.from({ length: n }, () => ({ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }));
const stacks = () => Object.fromEntries(['PHYSICAL', 'DIGITAL', 'CREATIVE'].map((id) => [id, { deck: [], faceUp: null, tokens: 0, discard: [] }]));

function board({ wizard = {}, energy = 6, deck = filler(8) } = {}) {
	return makeEngineState({
		turnNumber: 6,
		activePlayerId: 'player_2',
		questStacks: stacks(),
		players: {
			player_1: { activeSlots: [mkSlot({ mp: 40 }, MICHELLE), null], hand: [], deck: filler(8) },
			player_2: {
				activeSlots: [mkSlot({ mp: 40, ...wizard }, WIZARD), null], hand: [], energy, deck,
				piecieSlots: [{ cardId: REDBULL, type: 'PIECIE', faceDown: true, canActivateOnTurn: 2 }, null, null],
			},
		},
	});
}

describe('Rebouleh: the bot does not waste it', () => {
	it('is not useful while no Mosje has used a once-per-turn ability this turn', () => {
		expect(isUsefulActivation(board(), 'player_2', REDBULL)).toBe(false);
	});
	it('is useful once a Mosje has used its once-per-turn ability', () => {
		expect(isUsefulActivation(board({ wizard: { abilityUsedThisTurn: true, abilityUsesThisTurn: 1 } }), 'player_2', REDBULL)).toBe(true);
	});
	it('is not planned on a board where no ability was used', () => {
		const state = board();
		const planned = planPiecieActivations(state, 'player_2', getBotProfile(state, 'player_2'), {});
		expect(planned.map((p) => p.cardId)).not.toContain(REDBULL);
	});
	it('an empty deck (the ability does nothing): the bot keeps its Energy', () => {
		const state = board({ deck: [], energy: 3 });
		const steps = driveBotTurnSteps(state, 'player_2', { humanIds: [] });
		expect(steps.map((s) => s.label).join(' | ')).not.toMatch(/redbull/i);
	});
	it('after Rebouleh the bot takes the extra use: the ability is used twice in one turn', () => {
		const steps = driveBotTurnSteps(board(), 'player_2', { humanIds: [] });
		const labels = steps.map((s) => s.label);
		expect(labels.filter((l) => /ability/.test(l)).length, labels.join(' | ')).toBe(2);
		expect(labels.some((l) => /redbull/i.test(l)), labels.join(' | ')).toBe(true);
	});
});
