import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createLogRenderer } from '../../src/ui/logRenderer.js';

// Phase 72-09 (D-10, NUI-04): player-facing strings in src/ui and src/main.js use words, not emoji or pictographs.
// The star U+2605 (rarity mark) stays. Dev tools and the game-over headline icons (CC-10) are allowed.
const ROOT = join(__dirname, '..', '..');
const BANNED = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{27BF}\u{2B50}\u{2190}-\u{21FF}\u{FE0F}]/u;

const ALLOW = [
	'src/ui/gameOver/getGameOverHeadline.js', // CC-10: trophy and skull headline icons, not in D-10's list
	'src/ui/cardTiersDemo.js', // dev demo page, not a player screen
	'src/ui/cardEditor/', // dev tool
	'src/ui/cardAudit.js', // dev tool
];

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith('.js')) out.push(p);
	}
	return out;
}

// Returns the contents of every string / template literal, skipping comments.
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
				if (c !== '`' && src[j] === '\n') break; // not a string (e.g. a regex or apostrophe in code)
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

describe('no emoji or pictographs in player-facing strings (72-09)', () => {
	it('src/ui and src/main.js string literals are free of glyphs', () => {
		const files = [...walk(join(ROOT, 'src', 'ui')), join(ROOT, 'src', 'main.js')];
		const bad: string[] = [];
		for (const file of files) {
			const rel = relative(ROOT, file).replaceAll('\\', '/');
			if (ALLOW.some((a) => rel === a || (a.endsWith('/') && rel.startsWith(a)))) continue;
			for (const lit of stringLiterals(readFileSync(file, 'utf8'))) {
				const m = lit.match(BANNED);
				if (m) bad.push(`${rel}: U+${m[0].codePointAt(0)!.toString(16)} in "${lit.slice(0, 40).replace(/\s+/g, ' ')}"`);
			}
		}
		expect(bad).toEqual([]);
	});

	it('the guard sees a glyph in a literal and ignores comments', () => {
		expect(stringLiterals(`const a = 'x ⚔ y'; // 🎯`).some((s) => BANNED.test(s))).toBe(true);
		expect(stringLiterals(`const a = 'plain'; // 🎯 /* ✨ */`).some((s) => BANNED.test(s))).toBe(false);
	});
});

describe('logRenderer: plain rows (72-09)', () => {
	const mkContainer = () => {
		const rows: any[] = [];
		const container: any = {
			prepend: (el: any) => rows.unshift(el),
			innerHTML: '',
		};
		return { container, rows };
	};

	it('writes the message with no icon prefix and keeps the type class', () => {
		(globalThis as any).document = {
			createElement: () => {
				const el: any = { className: '', textContent: '', dataset: {} };
				el.setAttribute = (k: string, v: string) => { el.dataset[k] = v; };
				return el;
			},
		};
		const { container, rows } = mkContainer();
		const log = createLogRenderer(container);
		log.add('attack', 'A hits B for 20');
		expect(rows[0].textContent).toBe('A hits B for 20');
		expect(rows[0].className).toBe('log-row attack');
		expect(log.asText()).toBe('A hits B for 20');
		expect(log.getEntries()[0]).toEqual({ type: 'attack', text: 'A hits B for 20' });
		const dataType = rows[0].dataset['data-log-type'] ?? rows[0].dataset.logType;
		expect(dataType).toBe('attack');
	});

	it('keeps markup as text (T-72-14: never parsed)', () => {
		const { container, rows } = mkContainer();
		const log = createLogRenderer(container);
		log.add('info', '<img src=x onerror=alert(1)>');
		expect(rows[0].textContent).toBe('<img src=x onerror=alert(1)>');
		expect(rows[0].innerHTML).toBeUndefined();
	});
});
