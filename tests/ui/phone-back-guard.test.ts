// @ts-nocheck
// Phase 72.1-10 (D-04): the Back guard of a running phone game, with an injected fake window (no DOM needed), plus the
// static touch-handler audit (no pointercancel outside the card editor; every gesture binder registers touchcancel).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { guardBackNavigation } from '../../src/ui/phone/guardBackNavigation.js';
import { confirmLeaveGame } from '../../src/ui/phone/confirmLeaveGame.js';

function fakeWin() {
	const listeners = {};
	const win = {
		pushes: [],
		backs: 0,
		history: {
			pushState: (state) => { win.pushes.push(state); },
			go: (n) => { win.backs += n === -2 ? 1 : 99; },
		},
		addEventListener: (type, fn) => { (listeners[type] ||= new Set()).add(fn); },
		removeEventListener: (type, fn) => { listeners[type]?.delete(fn); },
		fire: (type) => { for (const fn of [...(listeners[type] || [])]) fn({ type }); },
		count: (type) => (listeners[type] ? listeners[type].size : 0),
	};
	return win;
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('guardBackNavigation', () => {
	it('arm pushes exactly one guard state, also when armed twice', () => {
		const win = fakeWin();
		const g = guardBackNavigation({ win, isActive: () => true, onBack: async () => 'keep' });
		g.arm(); g.arm();
		expect(win.pushes).toEqual([{ obbyGame: true }]);
	});

	it('a popstate while active re-pushes the guard and asks; keep does nothing more', async () => {
		const win = fakeWin();
		let asked = 0;
		const g = guardBackNavigation({ win, isActive: () => true, onBack: async () => { asked += 1; return 'keep'; } });
		g.arm();
		win.fire('popstate');
		await tick();
		expect(asked).toBe(1);
		expect(win.pushes.length).toBe(2);
		expect(win.backs).toBe(0);
	});

	it('leave releases the guard and leaves with one go(-2)', async () => {
		const win = fakeWin();
		const g = guardBackNavigation({ win, isActive: () => true, onBack: async () => 'leave' });
		g.arm();
		win.fire('popstate');
		await tick();
		expect(win.backs).toBe(1);
		expect(win.count('popstate')).toBe(0);
		win.fire('popstate');
		await tick();
		expect(win.backs).toBe(1);
	});

	it('release removes the listener and does not touch history', () => {
		const win = fakeWin();
		const g = guardBackNavigation({ win, isActive: () => true, onBack: async () => 'keep' });
		g.arm();
		g.release();
		expect(win.count('popstate')).toBe(0);
		expect(win.pushes.length).toBe(1);
		expect(win.backs).toBe(0);
	});

	it('finish stops asking and passes the next Back straight through, once', async () => {
		const win = fakeWin();
		win.history.back = () => { win.backs += 1; };
		let asked = 0;
		const g = guardBackNavigation({ win, isActive: () => true, onBack: async () => { asked += 1; return 'keep'; } });
		g.arm();
		g.finish();
		win.fire('popstate');
		await tick();
		win.fire('popstate');
		expect(asked).toBe(0);
		expect(win.backs).toBe(1);
	});

	it('ignores a popstate when the game is no longer active', async () => {
		const win = fakeWin();
		let active = true;
		let asked = 0;
		const g = guardBackNavigation({ win, isActive: () => active, onBack: async () => { asked += 1; return 'keep'; } });
		g.arm();
		active = false;
		win.fire('popstate');
		await tick();
		expect(asked).toBe(0);
		expect(win.pushes.length).toBe(1);
	});

	it('does not stack a second confirm while one is open', async () => {
		const win = fakeWin();
		let asked = 0;
		let resolveIt;
		const g = guardBackNavigation({ win, isActive: () => true, onBack: () => { asked += 1; return new Promise((r) => { resolveIt = r; }); } });
		g.arm();
		win.fire('popstate');
		win.fire('popstate');
		expect(asked).toBe(1);
		resolveIt('keep');
		await tick();
	});
});

describe('confirmLeaveGame', () => {
	it('shows the reaction option sheet and maps the choice', async () => {
		let seen;
		const modal = { showOptionSelect: async (cfg) => { seen = cfg; return 'leave'; } };
		expect(await confirmLeaveGame(modal)).toBe('leave');
		expect(seen.title).toBe('Leave the game?');
		expect(seen.prompt).toBe('Your game is still running. Going back ends it.');
		expect(seen.variant).toBe('reaction');
		expect(seen.allowCancel).toBe(false);
		expect(seen.options.map((o) => o.label)).toEqual(['Keep playing', 'Leave']);
		const keep = { showOptionSelect: async () => 'keep' };
		expect(await confirmLeaveGame(keep)).toBe('keep');
	});
});

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = path.join(dir, e.name);
		return e.isDirectory() ? walk(p) : [p];
	});
}

describe('touch handler audit (D-04)', () => {
	it('no file under src/ui/ listens for pointercancel except the card editor art drag', () => {
		for (const file of walk('src/ui').filter((f) => f.endsWith('.js'))) {
			const norm = file.replace(/\\/g, '/');
			if (norm.endsWith('cardEditor/enableArtDrag.js')) continue;
			const code = fs.readFileSync(file, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
			const stripped = code.replace(/\/\/.*$/gm, '');
			expect(stripped, `${norm} must not use pointercancel`).not.toMatch(/pointercancel/);
		}
	});

	it('every gesture binder registers touchcancel (directly or through bindDrawerSwipe)', () => {
		const direct = ['bindDrawerSwipe', 'bindLongPress'];
		for (const name of direct) {
			const js = fs.readFileSync(`src/ui/phone/${name}.js`, 'utf8');
			expect(js, name).toMatch(/addEventListener\('touchcancel'/);
		}
		const sheet = fs.readFileSync('src/ui/phone/bindSheetSwipeDown.js', 'utf8');
		expect(sheet).toMatch(/bindDrawerSwipe\(/);
	});
});
