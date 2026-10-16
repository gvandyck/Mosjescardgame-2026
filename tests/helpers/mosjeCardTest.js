// runMosjeCardTest — one card-test-library case for a 2.0 Mosje: boot, lay out the board, fire the trigger, assert.
// entry: { mosje, deck, cases: [{ name, setup, trigger, expect }] } — see tests/ui/cards/mosje-registry-2-0.js.
// expect: { mp: {'own.0': n, 'opp.0': n}, power: {'own.0': n}, level: {...}, energy, handDelta, oppHandDelta, state: [[path, value]] }.
import { expect } from '@playwright/test';
import { getGameState } from '../ui/helpers.js';
import { mosjeCardSetup } from './mosjeCardSetup.js';
import { mosjeCardTrigger } from './mosjeCardTrigger.js';

const slotOf = (s, key) => {
	const [who, idx] = key.split('.');
	return s.players[who === 'own' ? 'player_1' : 'player_2'].activeSlots[Number(idx)];
};
const pathOf = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

export async function runMosjeCardTest(page, entry, c) {
	if (process.env.DEBUG_MOSJE) page.on('console', m => console.log('   [page]', m.text()));
	await mosjeCardSetup(page, entry, c);
	const before = await getGameState(page);
	await mosjeCardTrigger(page, entry, c);
	const after = await getGameState(page);
	if (process.env.DEBUG_MOSJE) console.log('   [pending]', JSON.stringify(after.pendingChoice), JSON.stringify(after.pendingReaction));
	const e = c.expect;
	for (const [key, mp] of Object.entries(e.mp || {})) expect(slotOf(after, key)?.mp, `${key} MP`).toBe(mp);
	for (const [key, lv] of Object.entries(e.level || {})) expect(slotOf(after, key)?.level, `${key} level`).toBe(lv);
	for (const [key, pw] of Object.entries(e.power || {})) {
		const [who, idx] = key.split('.');
		const got = await page.evaluate(({ p, i }) => window.__testHooks.getMosjePower(p, i), { p: who === 'own' ? 'player_1' : 'player_2', i: Number(idx) });
		expect(got, `${key} Power`).toBe(pw);
	}
	if (e.energy != null) expect(after.players.player_1.energy, 'own Energy').toBe(e.energy);
	if (e.handDelta != null) expect(after.players.player_1.hand.length - before.players.player_1.hand.length, 'own hand').toBe(e.handDelta);
	if (e.oppHandDelta != null) expect(after.players.player_2.hand.length - before.players.player_2.hand.length, 'opponent hand').toBe(e.oppHandDelta);
	for (const [path, value] of e.state || []) expect(pathOf(after, path), path).toEqual(value);
	if (e.check) e.check(before, after);
}
