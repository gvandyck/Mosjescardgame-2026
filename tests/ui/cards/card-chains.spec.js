/**
 * card-chains.spec.js — Logical multi-card / multi-step chains.
 *
 * These go beyond single-card assertions: they wire up a precise board with the
 * custom-scenario testHooks (setHand, setMosjeOnField, setMosjeMP, unlockPiecies)
 * and verify interactions — defeat-at-0 KNOCKOUT, MP-amplifier scaling, multi-Mosje
 * abilities, MP transfer. Runs in the `cards` project (single browser, gentle).
 *
 * Run: npm run test:cards   (or SLOWMO=400 npm run test:cards:watch to watch)
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	readOwnedMosjes, readOpponentMosjes, getGameState,
	setMosjeMP, setMosjeOnField, setHand, unlockPiecies, playCardFromHand,
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
		if (await t.isVisible({ timeout: 600 }).catch(() => false)) { await t.click(); await page.waitForTimeout(350); }
		else break;
	}
}

async function ownSlot0(page) { return (await getGameState(page))?.players?.player_1?.activeSlots?.[0]?.mp ?? null; }
async function ownSlot(page, i) { return (await getGameState(page))?.players?.player_1?.activeSlots?.[i]?.mp ?? null; }
async function ownSlotObj(page, i) { return (await getGameState(page))?.players?.player_1?.activeSlots?.[i] ?? null; }

// ── Chain A: Defeat-at-0 KNOCKOUT (validates Phase 30 in a real win) ─────────
// Opponent's lone Mosje at 5 MP (Lv0). Affoe drains -15 → below 0 → defeated →
// all opponent Mosjes gone → KNOCKOUT victory.
test('chain: Affoe drains opponent below 0 → KNOCKOUT win', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_ko_chain', name: 'KO Chain',
		mosjes: ['mosje_gandoe_destroyer'],
		piecies: ['piecie_affoe', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeMP(page, 'player_1', 0, 50);
	await setMosjeOnField(page, 'player_2', 1, null);   // ensure opponent has only ONE Mosje
	await setMosjeMP(page, 'player_2', 0, 5);           // lone opponent Mosje at 5 MP, Lv0
	await setHand(page, 'player_1', ['piecie_affoe']);

	await playCardFromHand(page, 'piecie_affoe');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_affoe');               // opp 5 - 15 = below 0 → defeat → KNOCKOUT

	await page.waitForSelector('#reward-overlay', { timeout: 10000 });
	const title = (await page.locator('.reward-title').textContent().catch(() => '')).trim();
	const subtitle = (await page.locator('.reward-subtitle').textContent().catch(() => '')).trim();
	console.log('KO chain result:', title, '|', subtitle);
	await ss(page, 'chain-defeat-at-0-knockout');
	expect(title).toBe('Victory!');
	expect(subtitle.toUpperCase()).toContain('KNOCKOUT');
});

// ── Chain B: MP Amplifier scales the NEXT gain ×1.5 ──────────────────────────
// Activate MP Amplifier (sets mpAmplifierActive), then Kannetje Melk (+25 base).
// Amplified: floor(25 × 1.5) = 37.
test('chain: MP Amplifier → next Kannetje Melk gains +37 (×1.5)', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_amp_chain', name: 'Amplifier Chain',
		mosjes: ['mosje_gandoe_destroyer'],
		piecies: ['piecie_mp_amplifier', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeMP(page, 'player_1', 0, 40);
	await setHand(page, 'player_1', ['piecie_mp_amplifier', 'piecie_kannetje_melk']);

	// Activate amplifier first (sets the flag, no MP change)
	await playCardFromHand(page, 'piecie_mp_amplifier');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_mp_amplifier');

	const flagged = await getGameState(page);
	expect(flagged?.players?.player_1?.mpAmplifierActive).toBe(true);

	// Now play + activate Kannetje Melk — gain should be amplified to 37
	const before = await ownSlot0(page);
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_kannetje_melk');
	const after = await ownSlot0(page);
	const delta = after - before;
	console.log(`Amplifier chain: Kannetje gain = ${delta} (expected 37 = floor(25×1.5))`);
	await ss(page, 'chain-mp-amplifier');
	expect(delta).toBe(37);
});

// ── Chain C: Tuk Healer heals BOTH active Mosjes +15 (two-Mosje scenario) ────
// Uses setMosjeOnField to put a second Mosje on the field (engine starts with one).
test('chain: Tuk Healer ability heals both active Mosjes +15', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_tuk_chain', name: 'Tuk Chain',
		mosjes: ['mosje_tuk_healer'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Ensure Tuk Healer is slot 0, and place a second Mosje in slot 1.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_tuk_healer', { mp: 30, level: 0 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 20, level: 0 });
	await page.waitForTimeout(150);

	const before0 = await ownSlot(page, 0);
	const before1 = await ownSlot(page, 1);
	expect(before0).toBe(30);
	expect(before1).toBe(20);

	// Use Tuk Healer's ability (+15 to all active Mosjes)
	const card = page.locator('.mosje-card--owned[data-card-id="mosje_tuk_healer"]');
	const btn = card.locator('.mosje-ability-btn');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(700);
	await ss(page, 'chain-tuk-healer-both');

	const after0 = await ownSlot(page, 0);
	const after1 = await ownSlot(page, 1);
	console.log(`Tuk Healer: slot0 ${before0}→${after0}, slot1 ${before1}→${after1}`);
	expect(after0).toBe(45); // 30 + 15
	expect(after1).toBe(35); // 20 + 15
});

// ── Chain D: Tactician transfers MP between two Mosjes (total preserved) ──────
test('chain: Tactician moves MP from high Mosje to low (total unchanged)', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_tact_chain', name: 'Tactician Chain',
		mosjes: ['mosje_tactician'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_tactician', { mp: 60, level: 0 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 10, level: 0 });
	await page.waitForTimeout(150);

	const totalBefore = (await ownSlot(page, 0)) + (await ownSlot(page, 1));

	const card = page.locator('.mosje-card--owned[data-card-id="mosje_tactician"]');
	const btn = card.locator('.mosje-ability-btn');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(700);
	// auto-dismiss any target picker
	const t = page.locator('.target-option, .modal-mosje-select-btn:not(:disabled)').first();
	if (await t.isVisible({ timeout: 600 }).catch(() => false)) { await t.click(); await page.waitForTimeout(300); }
	await ss(page, 'chain-tactician-transfer');

	const s0 = await ownSlot(page, 0);
	const s1 = await ownSlot(page, 1);
	const totalAfter = s0 + s1;
	console.log(`Tactician: slot0=${s0}, slot1=${s1}, total ${totalBefore}→${totalAfter}`);
	// Transfer moves up to 20 MP from the higher (60) to the lower (10); total preserved.
	expect(totalAfter).toBe(totalBefore);
	expect(s1).toBeGreaterThan(10);      // low Mosje received MP
	expect(s0).toBeLessThan(60);         // high Mosje gave MP
});

// ── Chain E: Piecie MP gain must CAP at 100 — KNOWN BUG (expected failure) ───
// Game rule (phase0-rulings.md): a Mosje's MP is always 0–100; piecies/abilities
// NEVER permanently level up (only Quests do) and their gains cap at 100.
// A Lv0/80 Mosje gaining +25 from Kannetje Melk should land at Lv0/100 (capped) —
// NOT Lv0/105, and NOT level up. The engine currently overshoots to 105 because
// piecie applyMPGain (piecieEffects.js) adds MP without clamping to 100.
// BUG: applyMPGain (+ other non-quest gain sites) don't clamp MP to 100.
// Remove test.fail() once the 0–100 cap is enforced.
test('chain: piecie MP gain caps at 100 (no level-up) — BUG: overshoots to 105', async ({ page }) => {
	test.fail(); // documents the missing 0–100 cap; flips green when gains clamp at 100
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_levelup_chain', name: 'MP-cap Chain',
		mosjes: ['mosje_gandoe_destroyer'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_destroyer', { mp: 80, level: 0 });
	await setHand(page, 'player_1', ['piecie_kannetje_melk']);

	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_kannetje_melk');   // +25 on 80 → should CAP at 100

	const after = await ownSlotObj(page, 0);
	console.log(`MP-cap chain: → Lv${after.level}/${after.mp} (expected Lv0/100; actual Lv0/105 = bug)`);
	await ss(page, 'chain-mp-cap');
	expect(after.level).toBe(0);                    // piecies never permanently level up
	expect(after.mp).toBe(100);                     // FAILS today: overshoots to 105 (no cap)
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

	// Attempt a General Quest — should be refused (no payment modal appears)
	const mpBefore = await ownSlot0(page);
	await page.click('#btn-general-quest').catch(() => {});
	await page.waitForTimeout(800);
	const payModalVisible = await page.locator('#modal-yes').isVisible({ timeout: 800 }).catch(() => false);
	await ss(page, 'chain-tikker-questblock');
	const mpAfter = await ownSlot0(page);
	console.log(`Quest-block: payment modal visible=${payModalVisible}, MP ${mpBefore}→${mpAfter}`);
	expect(payModalVisible).toBe(false);            // quest refused — no pay-to-attempt modal
	expect(mpAfter).toBe(mpBefore);                 // no MP spent on a blocked quest
});
