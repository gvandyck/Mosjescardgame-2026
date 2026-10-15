/**
 * card-chains.spec.js — Logical multi-card / multi-step chains.
 *
 * These go beyond single-card assertions: they wire up a precise board with the
 * custom-scenario testHooks (setHand, setMosjeOnField, setMosjeMP, unlockPiecies)
 * and verify interactions — getemt (sideways, Welloe pile), MP-amplifier scaling, multi-Mosje
 * abilities, MP transfer. Runs in the `cards` project (single browser, gentle).
 *
 * Run: npm run test:cards   (or SLOWMO=400 npm run test:cards:watch to watch)
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	readOwnedMosjes, readOpponentMosjes, getGameState, getHandSize,
	setMosjeMP, setMosjeOnField, setHand, unlockPiecies, playCardFromHand,
	clearEntryProtection, mockDiceRoll,
} from '../helpers.js';

/** Activate a face-down piecie on the field, auto-dismissing up to two target pickers. */
async function activate(page, cardId) {
	const el = page.locator(`#piecies-player [data-card-id="${cardId}"]`).first();
	await el.waitFor({ state: 'visible', timeout: 8000 });
	const btn = el.locator('button:has-text("Activate")');
	await btn.waitFor({ state: 'visible', timeout: 8000 });
	await btn.click();
	await page.waitForTimeout(400);
	for (let i = 0; i < 2; i++) {
		const t = page.locator('.target-option, .modal-mosje-select-btn:not(:disabled)').first();
		if (await t.isVisible({ timeout: 1500 }).catch(() => false)) { await t.click(); await page.waitForTimeout(350); }
		else break;
	}
}

async function ownSlot0(page) { return (await getGameState(page))?.players?.player_1?.activeSlots?.[0]?.mp ?? null; }
async function ownSlot(page, i) { return (await getGameState(page))?.players?.player_1?.activeSlots?.[i]?.mp ?? null; }
async function ownSlotObj(page, i) { return (await getGameState(page))?.players?.player_1?.activeSlots?.[i] ?? null; }

// ── Chain A: 2.0 getemt (sideways, then Welloe pile) ──────────────────────────
// Opponent's Level 1 Mosje at 5 MP. Affoe -15 drains it to 0 -> getemt: it turns
// sideways (stays on the field, takes no action). A second hit sends it to the
// Welloe pile. It is the opponent's only Mosje on the field, but the game is NOT
// over: their hand/deck still hold Mosjes (2.0 has no instant defeat-at-0).
test('chain: Affoe getemt — first hit sideways at 0 MP, second hit to the Welloe pile', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_ko_chain', name: 'KO Chain',
		mosjes: ['mosje_gandoe_destroyer'],
		piecies: ['piecie_affoe', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 - chains model an established board

	await setMosjeMP(page, 'player_1', 0, 50);
	await setMosjeOnField(page, 'player_2', 1, null);   // opponent has only ONE Mosje on the field
	// A plain opponent Mosje (the bot's deck is random; abilities like Flow or Unstoppable would change the numbers).
	await setMosjeOnField(page, 'player_2', 0, 'mosje_ming_predictor', { mp: 5, level: 1 });
	await clearEntryProtection(page);
	await setHand(page, 'player_1', ['piecie_affoe']);

	await playCardFromHand(page, 'piecie_affoe');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_affoe');               // opp 5 - 15 -> 0, getemt: sideways
	await page.waitForTimeout(600);

	let st = await getGameState(page);
	const oppSlot = st.players.player_2.activeSlots[0];
	console.log('after hit 1:', JSON.stringify({ mp: oppSlot?.mp, sideways: oppSlot?.sideways, pile: st.players.player_2.welloePile?.length }));
	expect(oppSlot.mp).toBe(0);
	expect(oppSlot.sideways).toBe(true);
	expect(st.players.player_2.welloePile?.length ?? 0).toBe(0);
	expect(await page.locator('#reward-overlay').count()).toBe(0);   // not a win

	// Second hit on the sideways Mosje -> Welloe pile.
	await setHand(page, 'player_1', ['piecie_affoe']);
	await playCardFromHand(page, 'piecie_affoe');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_affoe');
	await page.waitForTimeout(800);

	st = await getGameState(page);
	console.log('after hit 2:', JSON.stringify({ pile: st.players.player_2.welloePile?.length, slot0: st.players.player_2.activeSlots[0]?.cardId ?? null }));
	expect((st.players.player_2.welloePile ?? []).length).toBeGreaterThanOrEqual(1);
	await ss(page, 'chain-getemt-welloe-pile');
	// Opponent still has Mosjes in hand/deck, so the game continues.
	expect(await page.locator('#reward-overlay').count()).toBe(0);
});

// ── Chain B: MP Amplifier scales the NEXT gain ×1.5 ──────────────────────────
// Activate MP Amplifier (sets mpAmplifierActive), then Kannetje Melk (+25 base).
// Amplified + 5-grid rule: roundToFive(25 × 1.5) = roundToFive(37.5) = 40.
test('chain: MP Amplifier → next Kannetje Melk gains +40 (×1.5, 5-grid)', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_amp_chain', name: 'Amplifier Chain',
		mosjes: ['mosje_gandoe_destroyer'],
		piecies: ['piecie_mp_amplifier', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	await setMosjeMP(page, 'player_1', 0, 40);
	await setHand(page, 'player_1', ['piecie_mp_amplifier', 'piecie_kannetje_melk']);

	// Activate amplifier first (sets the flag, no MP change)
	await playCardFromHand(page, 'piecie_mp_amplifier');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_mp_amplifier');

	const flagged = await getGameState(page);
	expect(flagged?.players?.player_1?.mpAmplifierActive).toBe(true);

	// Now play + activate Kannetje Melk — gain should be amplified to 40 (5-grid)
	const before = await ownSlot0(page);
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_kannetje_melk');
	const after = await ownSlot0(page);
	const delta = after - before;
	console.log(`Amplifier chain: Kannetje gain = ${delta} (expected 40 = roundToFive(25×1.5))`);
	await ss(page, 'chain-mp-amplifier');
	expect(delta).toBe(40);
});

// Removed in 58-12: the V4 single-Mosje chains for Tuk Healer (+10 chosen Mosje), Tactician (MP transfer), Ming Natural
// (reveal modal, keep/activate), Chris All-Rounder (+25 on a Piecie) and Jisca (5-6 free activation of the only Piecie).
// Their rules changed in the 2.0 Card List; each Mosje is now proven with the 2.0 numbers in
// mosje-registry-2-0.js / mosje-registry-2-0-rest.js (card-test-library) and mosje-chains-2-0.spec.js (chain rule).

// ── Chain: Coert KasteLuck's Morning Luck (2.0) ───────────────────────────────
// Card List: "at the start of your turn roll a die: 4-6 draw 1 card and this Mosje gains 5 MP." No same-turn
// activation any more (that was V4). Start-of-turn goes through the real engine via the runTurnBoundary hook.
test('chain: Coert KasteLuck Morning Luck - start of turn, 4-6 draws 1 card and gains 5 MP', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_kasteluck_chain', name: 'KasteLuck Morning Luck Chain',
		mosjes: ['mosje_coert_kasteluck'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_affoe', 'piecie_affoe', 'piecie_affoe'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 - chains model an established board

	await setMosjeMP(page, 'player_1', 0, 40);
	await page.waitForTimeout(150);
	for (const [roll, mpGain, cardGain] of [[3, 0, 1], [5, 5, 2]]) {
		const mpBefore = await ownSlot(page, 0);
		const handBefore = await getHandSize(page, 'player_1');
		await page.evaluate((v) => window.__testHooks.setNextAbilityDice([v]), roll);
		await page.evaluate(() => window.__testHooks.runTurnBoundary('start', 'player_1'));
		await page.waitForTimeout(300);
		expect(await ownSlot(page, 0), `roll ${roll}: MP`).toBe(mpBefore + mpGain);
		// the normal turn-start draw is +1 either way; Morning Luck adds 1 more on 4-6
		expect((await getHandSize(page, 'player_1')) - handBefore, `roll ${roll}: hand`).toBe(cardGain);
	}
	await ss(page, 'chain-kasteluck-morning-luck');
});

// ── Chain E: Piecie MP gain crossing 100 raises ONE Level (2.0) ───────────────
// 2.0 rule (applyGainToSlot): reaching 100 MP raises the Mosje one Level and
// resets MP to 0 (no carry-over). A Level 1 / 80 MP Mosje gaining +25 from
// Kannetje Melk lands at Level 2 / 0 MP - not 105 MP and not a double level-up.
test('chain: piecie MP gain crossing 100 raises one Level and resets MP to 0', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_levelup_chain', name: 'MP-cap Chain',
		mosjes: ['mosje_gandoe_destroyer'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_destroyer', { mp: 80, level: 1 });
	await setHand(page, 'player_1', ['piecie_kannetje_melk']);

	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_kannetje_melk');   // +25 on 80 → should CAP at 100

	const after = await ownSlotObj(page, 0);
	console.log(`MP-cap chain: → Lv${after.level}/${after.mp} (expected Lv2/0)`);
	await ss(page, 'chain-mp-cap');
	expect(after.level).toBe(2);                    // exactly one Level up
	expect(after.mp).toBe(0);                       // MP resets, no carry-over
});

// ── Chain F: Tikker grants QUEST_BLOCKED → General Quest is blocked ──────────
// Activate Tikker (+40 MP and QUEST_BLOCKED status). A General Quest attempt is
// then refused — no payment modal, MP unchanged, log notes the block.
test('chain: Tikker QUEST_BLOCKED prevents a General Quest', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_tikker_chain', name: 'Tikker Chain',
		mosjes: ['mosje_gandoe_destroyer'],
		piecies: ['piecie_tikker', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	await setMosjeMP(page, 'player_1', 0, 40);
	await setHand(page, 'player_1', ['piecie_tikker']);

	await playCardFromHand(page, 'piecie_tikker');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_tikker');          // +40 MP + QUEST_BLOCKED status

	// Confirm the status is present
	const st = await ownSlotObj(page, 0);
	const blocked = (st?.statusEffects || []).some(e => e.type === 'QUEST_BLOCKED');
	console.log('QUEST_BLOCKED present:', blocked, '| MP after Tikker:', st?.mp);
	expect(blocked).toBe(true);

	// 2.0: try to Quest — the Mosje can be picked but every Quest is disabled (QUEST_BLOCKED)
	const mpBefore = await ownSlot0(page);
	await page.click('#btn-quest');
	await page.locator('.modal-mosje-select-btn[data-id="0"]').click();
	await page.waitForTimeout(500);
	const refused = await page.locator('.modal-card').filter({ hasText: 'No Quest available' }).isVisible({ timeout: 1000 }).catch(() => false);
	await ss(page, 'chain-tikker-questblock');
	const mpAfter = await ownSlot0(page);
	console.log(`Quest-block: refused=${refused}, MP ${mpBefore}→${mpAfter}`);
	expect(refused).toBe(true);                     // quest refused — "No Quest available"
	expect(mpAfter).toBe(mpBefore);                 // no MP spent on a blocked quest
});

// ── Chain: Chris DDR's Perfect Combo Chain (2.0) ──────────────────────────────
// Card List: "whenever you activate a Piecie, roll a die: 5-6 activate another READY Piecie of yours for free
// (no Energy). Up to 2 times per turn." The chained Piecie never starts another chain roll (chain rule).
test('chain: Chris DDR Perfect Combo Chain - activating a Piecie chains another ready Piecie for free', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_chrisddr_chain', name: 'Chris DDR Perfect Combo Chain',
		mosjes: ['mosje_chris_ddr'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 - chains model an established board

	await setMosjeMP(page, 'player_1', 0, 15);
	await page.evaluate(() => {
		const h = window.__testHooks;
		h.setEnergy('player_1', 3);
		for (const slot of [0, 1, 2]) h.setPiecieOnField('player_1', slot, 'piecie_kannetje_melk', { faceDown: true });
		h.unlockPiecies('player_1');
		h.setNextAbilityDice([5, 1]);
	});
	await page.waitForTimeout(150);

	const before = await ownSlot0(page);
	await activate(page, 'piecie_kannetje_melk');
	await ss(page, 'chain-chrisddr-perfect-combo');

	const after = await ownSlot0(page);
	const state = await getGameState(page);
	console.log(`Chris DDR Perfect Combo Chain: MP ${before}->${after}, chains=${state?.players?.player_1?.ddrChainsThisTurn}`);
	expect(after, 'paid activation +25 and one free chained activation +25').toBe(before + 50);
	expect(state?.players?.player_1?.ddrChainsThisTurn).toBe(1);
	expect(state?.players?.player_1?.energy, 'only the first activation was paid for').toBe(3);
});
