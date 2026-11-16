// @ts-nocheck
// Phase 70-09 (D-29): no src file may still carry a rule the Obby 2.1 update replaced. Comments are stripped first, so prose
// that says what was removed cannot trip it. Fix the src, never this list.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPLACED = [
	['LEVEL_3', 'the hold-Level-3 win reason (only PERSONAL_QUEST and KNOCKOUT end a game)', /\bLEVEL_3\b/],
	['checkWin', 'the hold-Level-3 win check', /\bcheckWin\b/],
	['levelUpProtected', 'the level-up shield', /\blevelUpProtected\b/],
	['welloePile', 'the second (Welloe) pile; there is one pile per player', /\bwelloePile\b/],
	['roundToTen', 'the 10-grid rounding; Power is a multiple of 5', /\broundToTen\b/],
	['tokens:', 'Quest-stack fail tokens', /\btokens\s*:/],
];

function listJs(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		if (name === 'node_modules') return [];
		const path = join(dir, name);
		return statSync(path).isDirectory() ? listJs(path) : path.endsWith('.js') ? [path] : [];
	});
}

function code(text: string): string {
	return text
		.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
		.split('\n')
		.map((line) => (/^\s*\/\//.test(line) ? '' : line.replace(/\s\/\/.*$/, '')))
		.join('\n');
}

describe('no src file pins a replaced rule (D-29)', () => {
	const files = listJs('src');
	it('scans the src tree', () => expect(files.length).toBeGreaterThan(100));
	for (const [name, why, re] of REPLACED) {
		it(`no code mentions ${name} (${why})`, () => {
			const hits = files.filter((f) => re.test(code(readFileSync(f, 'utf8'))));
			expect(hits).toEqual([]);
		});
	}
});
