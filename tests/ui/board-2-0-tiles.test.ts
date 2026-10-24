// Phase 63-04: the pure helpers behind the Mosje tile states and the status strip
// (63-UI-SPEC "Tile states" + "Status strip", D-15..D-19, UI-03).
import { describe, it, expect } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { toMosjeTileCards } from '../../src/ui/board/toMosjeTileCards.js';
import { getTileBadges } from '../../src/ui/board/getTileBadges.js';
import { buildTileBadges } from '../../src/ui/board/buildTileBadges.js';
import { pickStatusMessage } from '../../src/ui/board/pickStatusMessage.js';

const def = (id: string) => (MOSJES as any[]).find((m) => m.id === id);
const slotOf = (id: string, opts: any = {}, extra: any = {}) => {
	const slot: any = createMosjeSlot(def(id), opts);
	delete slot.entryProtected; // seeded like an established board unless a test asks for Fresh
	return Object.assign(slot, extra);
};
const state = (p1Slots: any[], p2Slots: any[], over: any = {}) => ({
	status: 'PLAYING',
	activePlayerId: 'player_1',
	activePlace: null,
	players: {
		player_1: { id: 'player_1', name: 'Gandalf', energy: 3, activeSlots: p1Slots },
		player_2: { id: 'player_2', name: 'Bot', energy: 3, activeSlots: p2Slots },
	},
	...over,
});

describe('toMosjeTileCards (D-15..D-18, UI-03)', () => {
	it('keeps the old tile fields and skips empty slots, keeping the real slot index', () => {
		const s = state([null, slotOf('mosje_binti', { level: 2, mp: 40 })], [null, null]);
		const tiles = toMosjeTileCards(s, 'player_1');
		expect(tiles).toHaveLength(1);
		expect(tiles[0]).toMatchObject({ cardId: 'mosje_binti', slotIndex: 1, type: 'MOSJE', mp: 40, level: 2, isDefeated: false });
		expect(toMosjeTileCards(s, 'player_2')).toEqual([]);
	});

	it('Power is the live getPower: level row plus boosts, not the printed number', () => {
		const printed = def('mosje_binti').levels[0].power;
		const plain = toMosjeTileCards(state([slotOf('mosje_binti')], [null, null]), 'player_1')[0];
		expect(plain.power).toBe(printed);
		const boosted = toMosjeTileCards(state([slotOf('mosje_binti', {}, { powerBoost: 20 })], [null, null]), 'player_1')[0];
		expect(boosted.power).toBe(printed + 20);
	});

	it('carries the state flags: sideways, levelUpProtected, entryProtected (Fresh), actedThisTurn', () => {
		const plain = toMosjeTileCards(state([slotOf('mosje_binti')], [null, null]), 'player_1')[0];
		expect([plain.sideways, plain.levelUpProtected, plain.entryProtected, plain.actedThisTurn]).toEqual([false, false, false, false]);
		const all = toMosjeTileCards(state([slotOf('mosje_binti', {}, { sideways: true, levelUpProtected: true, entryProtected: true, actedThisTurn: true })], [null, null]), 'player_1')[0];
		expect([all.sideways, all.levelUpProtected, all.entryProtected, all.actedThisTurn]).toEqual([true, true, true, true]);
	});

	it('a Tactician set shows the temporary MP as tempMp and the REAL MP (real + delta, 5-grid, 0..95) as mp', () => {
		const set = (realMp: number, delta: number) => toMosjeTileCards(
			state([slotOf('mosje_binti', { mp: 25 }, { tacticianSet: { realMp, delta } })], [null, null]), 'player_1')[0];
		expect(set(40, 0)).toMatchObject({ tempMp: 25, mp: 40 });
		expect(set(40, 15)).toMatchObject({ tempMp: 25, mp: 55 });
		expect(set(40, -60)).toMatchObject({ tempMp: 25, mp: 0 }); // clamped at 0
		expect(set(90, 40)).toMatchObject({ tempMp: 25, mp: 95 }); // clamped at 95
		expect(set(40, 12)).toMatchObject({ mp: 50 }); // 52 snaps to the 5-grid
		const normal = toMosjeTileCards(state([slotOf('mosje_binti', { mp: 25 })], [null, null]), 'player_1')[0];
		expect('tempMp' in normal).toBe(false);
	});
});

describe('getTileBadges (D-15, D-16, D-06)', () => {
	it('is empty for a plain tile and for a defeated one', () => {
		expect(getTileBadges({})).toEqual([]);
		expect(getTileBadges(null)).toEqual([]);
		expect(getTileBadges({ entryProtected: true, isDefeated: true })).toEqual([]);
	});

	it('gives each state its short label and its full reason', () => {
		expect(getTileBadges({ entryProtected: true })).toEqual([
			{ kind: 'fresh', label: 'FRESH', reason: "Fresh: can't attack, can't be chosen by opponent cards, ignores Places" },
		]);
		expect(getTileBadges({ levelUpProtected: true })).toEqual([
			{ kind: 'protected', label: 'PROTECTED', reason: "Levelled up this turn: can't be attacked" },
		]);
		expect(getTileBadges({ sideways: true })).toEqual([
			{ kind: 'sideways', label: 'SKIPS TURN', reason: 'Hit at Level 1: skips its next turn. Can still be attacked' },
		]);
		expect(getTileBadges({ actedThisTurn: true })).toEqual([
			{ kind: 'acted', label: 'ACTED', reason: 'Already acted this turn' },
		]);
	});

	it('orders fresh, protected, sideways, acted; Level 3 hold is not a badge', () => {
		const all = getTileBadges({ entryProtected: true, levelUpProtected: true, sideways: true, actedThisTurn: true, level: 3 });
		expect(all.map((b) => b.kind)).toEqual(['fresh', 'protected', 'sideways', 'acted']);
		expect(getTileBadges({ level: 3 })).toEqual([]);
	});
});

describe('buildTileBadges (T-63-06)', () => {
	it('draws nothing for no badges', () => {
		expect(buildTileBadges([])).toBe('');
		expect(buildTileBadges(undefined as any)).toBe('');
	});

	it('one span.tile-badge per badge inside div.tile-badges with data-badge, data-reason, icon and word', () => {
		const html = buildTileBadges(getTileBadges({ entryProtected: true, levelUpProtected: true }));
		expect(html.startsWith('<div class="tile-badges">')).toBe(true);
		expect(html.match(/<span class="tile-badge /g)).toHaveLength(2);
		expect(html).toContain('data-badge="fresh"');
		expect(html).toContain('data-badge="protected"');
		expect(html).toContain('data-reason="Levelled up this turn: can&#39;t be attacked"');
		expect(html).toContain('>FRESH<');
		expect(html).toContain('>PROTECTED<');
		expect(html.match(/<svg /g)).toHaveLength(2);
	});

	it('only the sideways pill is centred', () => {
		const html = buildTileBadges(getTileBadges({ sideways: true, entryProtected: true }));
		expect(html.match(/tile-badge--centre/g)).toHaveLength(1);
		expect(html).toMatch(/tile-badge--sideways tile-badge--centre" data-badge="sideways"/);
	});

	it('escapes markup in a hostile label or reason', () => {
		const html = buildTileBadges([{ kind: 'fresh', label: '<img src=x onerror=1>', reason: '"><script>x</script>' }]);
		expect(html).not.toContain('<img');
		expect(html).not.toContain('<script');
		expect(html).toContain('&lt;img src=x onerror=1&gt;');
		expect(html).toContain('&quot;&gt;&lt;script&gt;');
	});
});

describe('pickStatusMessage (D-17, D-19)', () => {
	const mode = { kind: 'choose-target', text: 'Choose a target for Binti (Power 20)' };

	it('an action mode wins over everything', () => {
		const s = state([slotOf('mosje_binti', { level: 3 })], [null, null]);
		s.players.player_1 = { ...s.players.player_1, cooldownTurn: true } as any;
		expect(pickStatusMessage(s, 'player_1', mode)).toBe(mode);
	});

	it('the local cooldown turn comes before the hold message', () => {
		const s: any = state([slotOf('mosje_binti', { level: 3 })], [null, null]);
		s.players.player_1.cooldownTurn = true;
		expect(pickStatusMessage(s, 'player_1')).toEqual({ kind: 'cooldown', text: 'Cooldown turn: you can only place face-down Piecies' });
	});

	it('a cooldown flag only shows on that player\'s own turn, and never for the opponent', () => {
		const s: any = state([slotOf('mosje_binti')], [slotOf('mosje_gandoe_wizard')]);
		s.players.player_1.cooldownTurn = true;
		s.activePlayerId = 'player_2';
		expect(pickStatusMessage(s, 'player_1')?.kind).toBe('bot-turn');
		const t: any = state([slotOf('mosje_binti')], [slotOf('mosje_gandoe_wizard')]);
		t.players.player_2.cooldownTurn = true;
		expect(pickStatusMessage(t, 'player_1')).toBeNull();
	});

	it('a Level 3 Mosje shows the hold message with its first name and its owner', () => {
		const mine: any = state([slotOf('mosje_binti', { level: 3 })], [null, null]);
		expect(pickStatusMessage(mine, 'player_1')).toEqual({ kind: 'hold', text: 'Binti is at Level 3: Gandalf wins at the start of their next turn' });
		const theirs: any = state([slotOf('mosje_binti')], [slotOf('mosje_gandoe_wizard', { level: 3 })]);
		const msg = pickStatusMessage(theirs, 'player_1')!;
		expect(msg.kind).toBe('hold');
		expect(msg.text).toBe('Gandoe is at Level 3: Bot wins at the start of their next turn');
	});

	it('a defeated Level 3 Mosje does not hold', () => {
		const s: any = state([slotOf('mosje_binti', { level: 3 }, { isDefeated: true })], [null, null]);
		expect(pickStatusMessage(s, 'player_1')).toBeNull();
	});

	it('hold beats the bot-turn message', () => {
		const s: any = state([slotOf('mosje_binti', { level: 3 })], [slotOf('mosje_gandoe_wizard')], { activePlayerId: 'player_2' });
		expect(pickStatusMessage(s, 'player_1')?.kind).toBe('hold');
	});

	it("the opponent's turn shows \"<name>'s turn\"; my own plain turn shows nothing", () => {
		const s: any = state([slotOf('mosje_binti')], [slotOf('mosje_gandoe_wizard')], { activePlayerId: 'player_2' });
		expect(pickStatusMessage(s, 'player_1')).toEqual({ kind: 'bot-turn', text: "Bot's turn" });
		expect(pickStatusMessage(state([slotOf('mosje_binti')], [slotOf('mosje_gandoe_wizard')]), 'player_1')).toBeNull();
	});

	it('a finished game shows nothing, not even an action mode', () => {
		const s: any = state([slotOf('mosje_binti', { level: 3 })], [null, null], { status: 'FINISHED' });
		expect(pickStatusMessage(s, 'player_1')).toBeNull();
		expect(pickStatusMessage(s, 'player_1', mode)).toBeNull();
	});
});
