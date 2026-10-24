// Phase 63-05: the pure helpers behind the tap-first action tray, attack targeting and Quest choosing
// (63-UI-SPEC "Action tray" + "Targeting and Quest choosing" + "Copywriting", D-03..D-06, UI-05).
import { describe, it, expect } from 'vitest';
// @ts-expect-error JS module without type declarations
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-expect-error JS module without type declarations
import { mkSlot, byName } from '../helpers/quest56.js';
// @ts-expect-error JS module without type declarations
import { getTrayActions } from '../../src/ui/board/getTrayActions.js';
// @ts-expect-error JS module without type declarations
import { getAttackTargets } from '../../src/ui/board/getAttackTargets.js';
// @ts-expect-error JS module without type declarations
import { buildAttackPreview } from '../../src/ui/board/buildAttackPreview.js';
// @ts-expect-error JS module without type declarations
import { getQuestTargets } from '../../src/ui/board/getQuestTargets.js';
// @ts-expect-error JS module without type declarations
import { getPower } from '../../src/engine/mp/getPower.js';
// @ts-expect-error JS module without type declarations
import { buildStripMode } from '../../src/ui/board/buildStripMode.js';
// @ts-expect-error JS module without type declarations
import { renderStatusStrip } from '../../src/ui/board/renderStatusStrip.js';

const stacks = (f: Record<string, string | null>) => {
	const o: any = {};
	for (const id of ['FIGHTING', 'DIGITAL', 'ARTISTIC']) o[id] = { deck: [], faceUp: f[id] ?? null, tokens: 0, discard: [] };
	return o;
};
const chef = () => byName(/Master Chef/); // activated ability, 2 Energy
const jeffrey = () => byName(/Strongman/); // passive: no Ability chip
const board = (mine: any[], theirs: any[], over: any = {}) => makeEngineState({
	questStacks: stacks({ FIGHTING: 'quest_tough_it_out' }),
	players: { player_1: { activeSlots: mine }, player_2: { activeSlots: theirs } },
	...over,
});
const chip = (chips: any[], action: string) => chips.find((c) => c.action === action);
const tray = (s: any, slotIndex = 0, kind = 'mosje') => getTrayActions(s, 'player_1', { kind, slotIndex });

describe('getTrayActions: Mosje', () => {
	it('lists Attack, Quest, Ability (with its Energy cost) and Details, all usable on a free board', () => {
		const s = board([mkSlot({ mp: 40 }, chef()), null], [mkSlot({ mp: 40 }), null]);
		const chips = tray(s);
		expect(chips.map((c: any) => c.action)).toEqual(['attack', 'quest', 'ability', 'details']);
		expect(chips.map((c: any) => c.label)).toEqual(['Attack', 'Quest', 'Ability · 2 Energy', 'Details']);
		expect(chips.every((c: any) => c.disabled === false && c.reason === '')).toBe(true);
	});

	it('a passive Mosje has no Ability chip', () => {
		const chips = tray(board([mkSlot({ mp: 40 }, jeffrey()), null], [mkSlot({ mp: 40 }), null]));
		expect(chips.map((c: any) => c.action)).toEqual(['attack', 'quest', 'details']);
	});

	it("a fresh Mosje cannot attack ('Fresh Mosjes can't attack') but can still Quest", () => {
		const chips = tray(board([mkSlot({ mp: 40, entryProtected: true }), null], [mkSlot({ mp: 40 }), null]));
		expect(chip(chips, 'attack')).toMatchObject({ disabled: true, reason: "Fresh Mosjes can't attack" });
		expect(chip(chips, 'quest').disabled).toBe(false);
	});

	it('a Mosje that already acted has Attack and Quest disabled with the engine reason', () => {
		const chips = tray(board([mkSlot({ mp: 40, actedThisTurn: true }), null], [mkSlot({ mp: 40 }), null]));
		expect(chip(chips, 'attack')).toMatchObject({ disabled: true, reason: 'This Mosje already acted this turn' });
		expect(chip(chips, 'quest')).toMatchObject({ disabled: true, reason: 'This Mosje already acted this turn' });
		expect(chip(chips, 'details').disabled).toBe(false);
	});

	it('a sideways Mosje cannot act, and not use its ability either', () => {
		const chips = tray(board([mkSlot({ mp: 40, sideways: true }, chef()), null], [mkSlot({ mp: 40 }), null]));
		expect(chip(chips, 'attack').reason).toBe('This Mosje cannot act');
		expect(chip(chips, 'ability')).toMatchObject({ disabled: true, reason: 'This Mosje is sideways' });
	});

	it("says 'No valid target' when every opposing Mosje is fresh or protected", () => {
		const s = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40, entryProtected: true }), mkSlot({ mp: 40, levelUpProtected: true })]);
		expect(chip(tray(s), 'attack')).toMatchObject({ disabled: true, reason: 'No valid target' });
	});

	it("says 'No Quest can be attempted' when no face-up Quest can be attempted", () => {
		const s = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40 }), null], { questStacks: stacks({}) });
		expect(chip(tray(s), 'quest')).toMatchObject({ disabled: true, reason: 'No Quest can be attempted' });
	});

	it('Ability: used this turn, not enough Energy and the cooldown turn each give their own reason', () => {
		const used = board([mkSlot({ mp: 40, abilityUsedThisTurn: true }, chef()), null], [mkSlot({ mp: 40 }), null]);
		expect(chip(tray(used), 'ability')).toMatchObject({ disabled: true, reason: 'Ability already used this turn' });
		const poor = board([mkSlot({ mp: 40 }, chef()), null], [mkSlot({ mp: 40 }), null]);
		poor.players.player_1.energy = 1;
		expect(chip(tray(poor), 'ability')).toMatchObject({ disabled: true, reason: 'Not enough Energy (need 2)' });
		const cooling = board([mkSlot({ mp: 40 }, chef()), null], [mkSlot({ mp: 40 }), null]);
		cooling.players.player_1.cooldownTurn = true;
		expect(chip(tray(cooling), 'attack').reason).toBe('Cooldown turn: only face-down Piecies');
		expect(chip(tray(cooling), 'ability').reason).toBe('Cooldown turn: only face-down Piecies');
	});

	it('off the active turn every action chip is disabled with the turn reason', () => {
		const s = board([mkSlot({ mp: 40 }, chef()), null], [mkSlot({ mp: 40 }), null], { activePlayerId: 'player_2' });
		const chips = tray(s);
		expect(chip(chips, 'attack').reason).toBe('Not your turn');
		expect(chip(chips, 'ability').reason).toBe('You can only use this on your own turn');
	});
});

describe('getTrayActions: Piecie and Place', () => {
	const withPiecie = (slot: any, energy = 6, turnNumber = 3) => {
		const s = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40 }), null], { turnNumber });
		s.players.player_1.piecieSlots[0] = slot;
		s.players.player_1.energy = energy;
		return s;
	};
	const down = (cardId: string, extra: any = {}) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, canActivateOnTurn: 3, ...extra });

	it("a ready face-down Piecie offers 'Activate · N Energy' and Details", () => {
		const chips = tray(withPiecie(down('piecie_ronald_kip')), 0, 'piecie');
		expect(chips.map((c: any) => c.action)).toEqual(['activate', 'details']);
		expect(chips[0]).toMatchObject({ label: 'Activate · 2 Energy', disabled: false, cost: 2 });
	});

	it('a free Piecie reads plain Activate', () => {
		expect(tray(withPiecie(down('piecie_kannetje_melk')), 0, 'piecie')[0].label).toBe('Activate');
	});

	it("a Piecie placed this turn says 'Ready from your next turn'", () => {
		const chips = tray(withPiecie(down('piecie_ronald_kip', { canActivateOnTurn: 4 })), 0, 'piecie');
		expect(chips[0]).toMatchObject({ disabled: true, reason: 'Ready from your next turn' });
	});

	it('not enough Energy and the cooldown turn give their reason', () => {
		expect(tray(withPiecie(down('piecie_ronald_kip'), 1), 0, 'piecie')[0]).toMatchObject({ disabled: true, reason: 'Not enough Energy (need 2)' });
		const cooling = withPiecie(down('piecie_ronald_kip'));
		cooling.players.player_1.cooldownTurn = true;
		expect(tray(cooling, 0, 'piecie')[0].reason).toBe('Cooldown turn: only face-down Piecies');
	});

	it('an activated or empty Piecie slot only offers Details; a Place only Details', () => {
		expect(tray(withPiecie(down('piecie_ronald_kip', { activated: true })), 0, 'piecie').map((c: any) => c.action)).toEqual(['details']);
		expect(tray(withPiecie(null), 1, 'piecie').map((c: any) => c.action)).toEqual(['details']);
		expect(tray(withPiecie(null), 0, 'place').map((c: any) => c.action)).toEqual(['details']);
	});
});

describe('getAttackTargets', () => {
	it('marks fresh and protected Mosjes invalid with the short badge and the full reason', () => {
		const s = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40, entryProtected: true }), mkSlot({ mp: 40, levelUpProtected: true })]);
		s.players.player_2.activeSlots.push(mkSlot({ mp: 40 }));
		const targets = getAttackTargets(s, 'player_1');
		expect(targets).toEqual([
			{ playerId: 'player_2', slotIndex: 0, valid: false, short: 'Fresh', reason: "Fresh Mosjes can't be attacked" },
			{ playerId: 'player_2', slotIndex: 1, valid: false, short: 'Protected', reason: "Level-up protected: can't be attacked this turn" },
			{ playerId: 'player_2', slotIndex: 2, valid: true, short: '', reason: '' },
		]);
	});

	it('skips empty and defeated slots and never lists your own Mosjes', () => {
		const s = board([mkSlot({ mp: 40 }), null], [null, mkSlot({ mp: 40, isDefeated: true })]);
		expect(getAttackTargets(s, 'player_1')).toEqual([]);
	});
});

describe('buildAttackPreview', () => {
	const pair = () => board([mkSlot({ mp: 40 }, byName(/Alyssa, The Bulldozer/)), null], [mkSlot({ mp: 40 }, byName(/Ming, The Natural/)), null]);

	it("reads 'Alyssa hits Ming: −20 MP (leaves 20)' with first names and the live Power", () => {
		const s = pair();
		const power = getPower(s.players.player_1.activeSlots[0], s, 'player_1');
		expect(power).toBe(20);
		expect(buildAttackPreview(s, 'player_1', 0, 'player_2', 0)).toBe('Alyssa hits Ming: −20 MP (leaves 20)');
	});

	it('never leaves a negative number and follows a Power boost', () => {
		const s = pair();
		s.players.player_1.activeSlots[0].powerBoost = 40;
		s.players.player_2.activeSlots[0].mp = 30;
		expect(buildAttackPreview(s, 'player_1', 0, 'player_2', 0)).toBe('Alyssa hits Ming: −60 MP (leaves 0)');
	});

	it("a Power 0 attacker reads 'has 0 Power: no effect'", () => {
		const s = pair();
		s.players.player_1.activeSlots[0].powerBoost = -100;
		expect(buildAttackPreview(s, 'player_1', 0, 'player_2', 0)).toBe('Alyssa has 0 Power: no effect');
	});
});

describe('getQuestTargets', () => {
	const quests = { FIGHTING: 'quest_tough_it_out', DIGITAL: 'quest_debug_system', ARTISTIC: null };

	it('marks an open Quest valid, a failed condition Locked, a missing stack Quest invalid', () => {
		const s = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40 }), null], { questStacks: stacks(quests) });
		const [fighting, digital, artistic] = getQuestTargets(s, 'player_1', 0);
		expect(fighting).toEqual({ stackId: 'FIGHTING', valid: true, short: '', reason: '' });
		expect(digital).toMatchObject({ stackId: 'DIGITAL', valid: false, short: 'Locked' });
		expect(digital.reason).toMatch(/Condition not met/);
		expect(artistic).toMatchObject({ stackId: 'ARTISTIC', valid: false, reason: 'No Quest in this stack' });
	});

	it("a cost the player cannot pay is \"Can't pay\" with 'Cannot pay: <cost>'", () => {
		const s = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40 }), null], { questStacks: stacks({ FIGHTING: 'quest_parkour_challenge' }) });
		expect(getQuestTargets(s, 'player_1', 0)[0]).toMatchObject({ valid: false, short: "Can't pay", reason: 'Cannot pay: Discard 1 ready Piecie' });
	});

	it("a Mosje that already acted gets 'Acted' on every stack", () => {
		const s = board([mkSlot({ mp: 40, actedThisTurn: true }), null], [mkSlot({ mp: 40 }), null], { questStacks: stacks(quests) });
		expect(getQuestTargets(s, 'player_1', 0).every((t: any) => !t.valid && t.short === 'Acted')).toBe(true);
	});
});

describe('T-63-08: card names in the strip messages are escaped', () => {
	it('the attack preview and the choose messages reach the strip as text, never as markup', () => {
		const evil = '<img src=x onerror=alert(1)>';
		const s = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40 }), null]);
		s.players.player_1.activeSlots[0].name = evil;
		s.players.player_2.activeSlots[0].name = `${evil}, The Evil`;
		const el: any = { innerHTML: '', setAttribute() {}, removeAttribute() {}, querySelector: () => null };
		const sel = { kind: 'mosje', slotIndex: 0 };
		for (const mode of ['choose-target', 'preview', 'choose-quest']) {
			const msg = buildStripMode(s, 'player_1', { mode, sel, target: { playerId: 'player_2', slotIndex: 0 } });
			expect(msg.text).toContain(evil);
			delete el._statusSignature;
			renderStatusStrip(el, msg);
			expect(el.innerHTML).not.toContain('<img');
			expect(el.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
		}
	});

	it('idle and selected modes, and a stale selection, show no mode message', () => {
		const s = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40 }), null]);
		expect(buildStripMode(s, 'player_1', { mode: 'idle', sel: null, target: null })).toBeNull();
		expect(buildStripMode(s, 'player_1', { mode: 'selected', sel: { kind: 'mosje', slotIndex: 0 }, target: null })).toBeNull();
		expect(buildStripMode(s, 'player_1', { mode: 'choose-target', sel: { kind: 'mosje', slotIndex: 1 }, target: null })).toBeNull();
	});
});
