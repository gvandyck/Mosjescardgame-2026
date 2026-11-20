// Phase 72-07: the attack breakdown shown before Confirm (D-08, D-09, NUI-03). Pure builder over previewAttack.
import { describe, it, expect } from 'vitest';
// @ts-expect-error JS module without type declarations
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-expect-error JS module without type declarations
import { mkSlot, byName } from '../helpers/quest56.js';
// @ts-expect-error JS module without type declarations
import { buildAttackBreakdown } from '../../src/ui/board/buildAttackBreakdown.js';
// @ts-expect-error JS module without type declarations
import { getTypeWord } from '../../src/ui/board/getTypeWord.js';
// @ts-expect-error JS module without type declarations
import { previewAttack } from '../../src/engine/attack/previewAttack.js';
// @ts-expect-error JS module without type declarations
import { buildStripMode } from '../../src/ui/board/buildStripMode.js';
// @ts-expect-error JS module without type declarations
import { renderStatusStrip } from '../../src/ui/board/renderStatusStrip.js';

// Attacker: Alyssa (Power 20 at Level 1), subtype/power set per case. Target: Ming, subtype and Res set per case.
function setup({ aType = 'PHYSICAL', power = 20, tType = 'DIGITAL', res = 0, fresh = false } = {}) {
	const a = mkSlot({ mp: 40, subtype: aType }, byName(/Alyssa, The Bulldozer/));
	a.powerBoost = power - 20;
	const t = mkSlot({ mp: 40, subtype: tType }, byName(/Ming, The Natural/));
	t.traits.resilient = res;
	t.entryProtected = fresh;
	const s = makeEngineState({ players: { player_1: { activeSlots: [a, null] }, player_2: { activeSlots: [t, null] } } });
	return s;
}
const texts = (b: any) => b.lines.map((l: any) => l.text);
const build = (s: any) => buildAttackBreakdown(s, 'player_1', 0, 'player_2', 0);

describe('getTypeWord', () => {
	it('names the three types and never throws', () => {
		expect(getTypeWord('PHYSICAL')).toBe('Physical');
		expect(getTypeWord('DIGITAL')).toBe('Digital');
		expect(getTypeWord('CREATIVE')).toBe('Creative');
		expect(getTypeWord('weird')).toBe('Weird');
		expect(getTypeWord(undefined)).toBe('');
	});
});

describe('buildAttackBreakdown', () => {
	it('Physical Power 20 on Digital Res 0: Power, Triangle, total, note; no Resilient line', () => {
		const b = build(setup());
		expect(texts(b)).toEqual(['Power 20', 'Triangle +10 (Physical beats Digital)', '= 30 before card effects', 'Card effects can change this']);
		expect(b.final).toBe(30);
		expect(b.blocked).toBeNull();
	});

	it('Digital Power 10 on Digital Res 2: Resilient line, the floor of 5, no Triangle line', () => {
		const b = build(setup({ aType: 'DIGITAL', power: 10, tType: 'DIGITAL', res: 2 }));
		expect(texts(b)).toEqual(['Power 10', 'Resilient −10 (Res 2)', '= 5 before card effects', 'Card effects can change this']);
		expect(b.final).toBe(5);
	});

	it('Physical Power 25 on Digital Res 1: all four lines plus the note', () => {
		const b = build(setup({ power: 25, res: 1 }));
		expect(texts(b)).toEqual(['Power 25', 'Triangle +10 (Physical beats Digital)', 'Resilient −5 (Res 1)', '= 30 before card effects', 'Card effects can change this']);
		expect(b.lines.map((l: any) => l.kind)).toEqual(['power', 'triangle', 'resilient', 'total', 'note']);
	});

	it('a Power 0 attacker is blocked with its own sentence', () => {
		const b = build(setup({ power: 0 }));
		expect(b.blocked).toBe('power');
		expect(texts(b)).toEqual(["Can't attack (Power 0)"]);
		expect(b.lines[0].kind).toBe('blocked');
		expect(b.final).toBe(0);
	});

	it('a fresh target is blocked with its own sentence', () => {
		const b = build(setup({ fresh: true }));
		expect(b.blocked).toBe('fresh');
		expect(texts(b)).toEqual(["Protected until its owner's next turn"]);
	});

	it('final equals previewAttack and the state is untouched', () => {
		const s = setup({ power: 25, res: 1 });
		const before = JSON.stringify(s);
		const b = build(s);
		expect(b.final).toBe(previewAttack(s, 'player_1', 0, 'player_2', 0).final);
		expect(JSON.stringify(s)).toBe(before);
	});
});

describe('strip carries the lines', () => {
	it('preview message keeps text, adds lines; a Power 0 attacker reads the sentence', () => {
		const s = setup({ power: 25, res: 1 });
		const msg = buildStripMode(s, 'player_1', { mode: 'preview', sel: { kind: 'mosje', slotIndex: 0 }, target: { playerId: 'player_2', slotIndex: 0 } });
		expect(msg.text).toBe('Alyssa hits Ming: −30 MP (leaves 10)');
		expect(msg.lines.map((l: any) => l.text)).toContain('= 30 before card effects');
		const zero = setup({ power: 0 });
		const m0 = buildStripMode(zero, 'player_1', { mode: 'preview', sel: { kind: 'mosje', slotIndex: 0 }, target: { playerId: 'player_2', slotIndex: 0 } });
		expect(m0.text).toBe("Can't attack (Power 0)");
		expect(m0.lines).toEqual([]);
	});

	it('renderStatusStrip draws one escaped div per line and includes lines in the signature', () => {
		const el: any = { innerHTML: '', setAttribute() {}, removeAttribute() {}, querySelector: () => null };
		renderStatusStrip(el, { kind: 'preview', text: 'x', lines: [{ kind: 'power', text: 'Power <b>' }, { kind: 'total', text: '= 5' }] });
		expect(el.innerHTML).toContain('class="status-strip__lines"');
		expect(el.innerHTML).toContain('strip-line strip-line--power');
		expect(el.innerHTML).toContain('Power &lt;b&gt;');
		expect(el.innerHTML).not.toContain('<b>');
		const first = el.innerHTML;
		renderStatusStrip(el, { kind: 'preview', text: 'x', lines: [{ kind: 'power', text: 'Power 9' }] });
		expect(el.innerHTML).not.toBe(first);
	});
});
