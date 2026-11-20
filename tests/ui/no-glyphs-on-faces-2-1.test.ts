import { describe, it, expect } from 'vitest';
import { ALL_CARDS } from '../../src/data/cardIndex.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';
import { buildCardPanel } from '../../src/ui/cardV1/buildCardPanel.js';
import { buildMosjeSpecV1 } from '../../src/ui/cardV1/buildMosjeSpecV1.js';
import { buildFieldTileStats } from '../../src/ui/cardV1/buildFieldTileStats.js';
import { formatQuestRollsLine } from '../../src/ui/cardV1/formatQuestRollsLine.js';
import { getTraitWord } from '../../src/ui/cardV1/getTraitWord.js';
import { formatAbilityLine } from '../../src/ui/cardV1/formatAbilityLine.js';
import { buildFaceTextBox } from '../../src/ui/cardV1/buildFaceTextBox.js';

// Phase 72-08 (D-10, D-12): card faces, tiles and panels use words, not glyphs. The star U+2605 (rarity and trait
// stars) and the punctuation marks stay; the die glyphs live only inside a Personal Quest Roll block.
const BANNED = /[\u{1F000}-\u{1FAFF}☀-☄☆-➿⭐■-◿←-⇿]/u;
const DIE = /[⚀-⚅▣]/u;

const stripRollBlocks = (html: string) => html.replace(/<div class="cv2-block" data-cv1-pq-block="roll">.*?<\/div>/gs, '');
const surfaces = (card: any) => {
	const out: [string, string][] = [];
	for (const fieldMode of [false, true]) {
		const r = buildCardV1(card, { fieldMode });
		if (r) out.push([fieldMode ? 'tile' : 'face', r.html]);
	}
	out.push(['panel', buildCardPanel(card)]);
	return out;
};

describe('no glyphs on card faces, tiles and panels (72-08)', () => {
	it('every card surface is free of emoji, pictographs and arrows', () => {
		const bad: string[] = [];
		for (const card of ALL_CARDS as any[]) {
			for (const [kind, html] of surfaces(card)) {
				const m = stripRollBlocks(html).match(BANNED);
				if (m) bad.push(`${card.id} ${kind}: U+${m[0].codePointAt(0)!.toString(16)}`);
			}
		}
		expect(bad).toEqual([]);
	});

	it('the die glyph appears only inside a Roll block', () => {
		const bad: string[] = [];
		for (const card of ALL_CARDS as any[]) {
			for (const [kind, html] of surfaces(card)) if (DIE.test(stripRollBlocks(html))) bad.push(`${card.id} ${kind}`);
		}
		expect(bad).toEqual([]);
	});

	it('no Mosje face or tile says HOLD (Level 3 reads LVL 3 / L3)', () => {
		for (const card of (ALL_CARDS as any[]).filter((c) => c.type === 'Mosje')) {
			for (const level of [1, 2, 3]) {
				for (const fieldMode of [false, true]) expect(buildCardV1({ ...card, level }, { fieldMode })!.html, card.id).not.toContain('HOLD');
			}
		}
		const m = (ALL_CARDS as any[]).find((c) => c.type === 'Mosje');
		expect(buildMosjeSpecV1({ ...m, level: 3 }).footer.centre.chip).toBe('LVL 3');
		expect(buildFieldTileStats(buildMosjeSpecV1({ ...m, level: 3 }))).toContain('>L3<');
	});

	it('the Quest rolls line uses the short trait names', () => {
		const word = { strength: 'Str', technical: 'Tech', artistic: 'Art', social: 'Soc', mental: 'Men', resilient: 'Res' } as const;
		for (const [trait, w] of Object.entries(word)) {
			expect(getTraitWord(trait)).toBe(w);
			expect(formatQuestRollsLine({ rollTrait: trait, band: 'steady' })).toBe(`Rolls: ${w} · Steady`);
		}
		expect(getTraitWord('weird')).toBe('Weird');
		expect(formatQuestRollsLine({ rollTrait: 'best', band: 'steady' })).toBe("Rolls: Mosje's best trait · Steady");
	});

	it('a Mosje ability line has no bold name; other types keep it', () => {
		const line = 'Once per turn: pay 1 Energy; draw a card.';
		expect(formatAbilityLine(line, { boldName: false })).not.toContain('<b>');
		expect(formatAbilityLine('Needs: a thing')).toContain('<b>');
		const mosje = buildFaceTextBox({ typeKey: 'MOSJE', lines: [line], levelRows: [] });
		expect(mosje).not.toContain('<b>Once per turn:</b>');
		const other = buildFaceTextBox({ typeKey: 'PIECIE', lines: ['Boost: +5 Power.'], levelRows: [] });
		expect(other).toContain('<b>Boost:</b>');
	});
});
