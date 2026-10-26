// lobby-2-0-html.test.ts — markup guard for index.html (Phase 64-03: D-37 noindex, D-13 hidden V4 lobby, the 2.0 lobby mount).
// index.html is plain text; no browser needed. The live behaviour is covered by tests/ui/lobby-2-0.spec.js.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');

describe('index.html (2.0 lobby)', () => {
	it('keeps the prototype out of search engines (D-37)', () => {
		expect(html).toMatch(/<meta\s+name="robots"\s+content="noindex,nofollow"\s*\/?>/);
	});

	it('mounts the 2.0 lobby in an element with id lobby2', () => {
		expect(html).toMatch(/id="lobby2"/);
	});

	it('keeps the V4 account lobby as a hidden section that still holds the lobby form (D-12, D-13)', () => {
		const section = html.match(/<section[^>]*id="account-lobby"[^>]*>/);
		expect(section).not.toBeNull();
		expect(section![0]).toMatch(/\shidden(\s|>|=)/);
		const afterSection = html.slice(html.indexOf(section![0]));
		expect(afterSection).toMatch(/id="lobby-form"/);
	});

	it('links the lobby stylesheet', () => {
		expect(html).toMatch(/<link[^>]*href="styles\/lobby-2-0\.css"/);
	});
});
