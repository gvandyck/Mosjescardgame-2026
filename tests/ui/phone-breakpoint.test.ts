// @ts-nocheck
// Phase 65-01 (D-02): the phone breakpoint is ONE literal. Every `max-width` media query in styles/phone-*.css is exactly
// (max-width: 700px) and src/ui/phone/phoneQuery.js carries the same number, so JS and CSS can never drift apart.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const STYLES = 'styles';
const phoneFiles = fs.readdirSync(STYLES).filter((name) => /^phone-.*\.css$/.test(name));

/** Every @media line of a CSS text that mentions max-width, trimmed. */
function maxWidthQueries(css) {
	return css.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('@media') && line.includes('max-width'));
}

describe('phone breakpoint (D-02)', () => {
	it('has at least phone-base.css', () => {
		expect(phoneFiles).toContain('phone-base.css');
	});

	it('uses exactly (max-width: 700px) for every max-width query in styles/phone-*.css', () => {
		for (const name of phoneFiles) {
			const css = fs.readFileSync(path.join(STYLES, name), 'utf8');
			for (const line of maxWidthQueries(css)) {
				// The rotate-notice query uses orientation / max-height / pointer: that is a different thing and is allowed.
				if (line.includes('max-height')) continue;
				expect(line, `${name}: ${line}`).toMatch(/^@media\s*\(max-width:\s*700px\)\s*\{$/);
			}
		}
	});

	it('has the phone query block in phone-base.css', () => {
		const css = fs.readFileSync(path.join(STYLES, 'phone-base.css'), 'utf8');
		expect(maxWidthQueries(css).length).toBeGreaterThanOrEqual(1);
	});

	it('keeps the JS constant PHONE_QUERY on the same 700px', () => {
		const js = fs.readFileSync('src/ui/phone/phoneQuery.js', 'utf8');
		expect(js).toContain("'(max-width: 700px)'");
	});

	it('never blocks pinch-zoom: no user-scalable / maximum-scale in the CSS or in the two page metas', () => {
		for (const name of phoneFiles) {
			const css = fs.readFileSync(path.join(STYLES, name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
			expect(css, `${name} must not disable zoom`).not.toMatch(/user-scalable|maximum-scale|touch-action:\s*none/);
		}
		for (const page of ['game.html', 'index.html']) {
			const meta = fs.readFileSync(page, 'utf8').match(/<meta\s+name="viewport"\s+content="([^"]*)"/i)?.[1] ?? '';
			expect(meta, `${page} viewport meta`).not.toMatch(/user-scalable|maximum-scale/);
		}
	});

	it('limits the table (board, hand panel, header, strip; the bar keeps pinch-zoom, 65-03b) to pan-x pan-y (72.1-10, D-04)', () => {
		const css = fs.readFileSync(path.join(STYLES, 'phone-base.css'), 'utf8');
		const rule = css.match(/\.game-board,\s*\.game-hand-panel,\s*\.game-topbar,\s*#status-strip\s*\{[^}]*touch-action:\s*([^;]+);/);
		expect(rule, 'table touch-action rule').not.toBeNull();
		expect(rule[1].trim()).toBe('pan-x pan-y');
	});
});
