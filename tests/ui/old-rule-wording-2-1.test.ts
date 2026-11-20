import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

// Phase 72-15 (D-12, NUI-04): nothing a player reads or sees still belongs to an old rule: no "wins at the start of their
// next turn" hold text, no Level 3 gold hold class, no fail pips on Quest faces, no "Graveyard" / "discard pile" wording.
// Only string literals and CSS selectors are checked: JS names such as showGraveyardModal and the `graveyard` field stay.
const ROOT = join(__dirname, '..', '..');

function walk(dir: string, ext: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, ext, out);
		else if (p.endsWith(ext)) out.push(p);
	}
	return out;
}

// Contents of every string / template literal, skipping comments.
function stringLiterals(src: string): string[] {
	const out: string[] = [];
	let i = 0;
	while (i < src.length) {
		const c = src[i];
		const n = src[i + 1];
		if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
		if (c === '/' && n === '*') { i = src.indexOf('*/', i + 2); if (i < 0) break; i += 2; continue; }
		if (c === '"' || c === "'" || c === '`') {
			let j = i + 1;
			let buf = '';
			while (j < src.length && src[j] !== c) {
				if (src[j] === '\\') { buf += src[j + 1] ?? ''; j += 2; continue; }
				if (c !== '`' && src[j] === '\n') break;
				buf += src[j++];
			}
			out.push(buf);
			i = j + 1;
			continue;
		}
		i++;
	}
	return out;
}

const OLD_STRINGS = [
	'wins at the start of their next turn',
	'mosje-card--hold',
	'cv2-tile-pips',
	'data-cv1-pip',
	'failTokens',
	'Graveyard',
	'discard pile',
];
const ALLOW = ['src/ui/cardEditor/', 'src/ui/cardAudit.js', 'src/ui/cardTiersDemo.js']; // dev tools, not player screens

describe('old-rule wording is gone from the player-facing UI (72-15)', () => {
	const files = [...walk(join(ROOT, 'src', 'ui'), '.js'), join(ROOT, 'src', 'main.js')]
		.filter((f) => !ALLOW.some((a) => relative(ROOT, f).replace(/\\/g, '/').startsWith(a)));

	it('finds the UI sources', () => {
		expect(files.length).toBeGreaterThan(50);
	});

	it('no string literal carries an old-rule phrase, class or label', () => {
		const hits: string[] = [];
		for (const f of files) {
			const lits = stringLiterals(readFileSync(f, 'utf8'));
			for (const s of OLD_STRINGS) {
				// whole words only: function names such as showGraveyardModal inside a debug log are not player wording
				const re = new RegExp(`(^|[^A-Za-z])${s}([^A-Za-z]|$)`);
				if (lits.some((l) => re.test(l))) hits.push(`${relative(ROOT, f)}: ${s}`);
			}
		}
		expect(hits).toEqual([]);
	});

	it('no stylesheet styles the hold class, the fail pips or the hold status', () => {
		const hits: string[] = [];
		for (const f of walk(join(ROOT, 'styles'), '.css')) {
			const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
			for (const s of ['mosje-card--hold', '.cv2-pip', 'cv2-tile-pips', 'data-status-kind="hold"', 'tile-hold-pulse']) {
				if (css.includes(s)) hits.push(`${relative(ROOT, f)}: ${s}`);
			}
		}
		expect(hits).toEqual([]);
	});

	it('the Phase 69 Personal Quest text stopgap is deleted', () => {
		expect(existsSync(join(ROOT, 'src', 'ui', 'personalQuestText.js'))).toBe(false);
	});
});
