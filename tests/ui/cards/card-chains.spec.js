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
	await clearEntryProtection(page); // U8 — chains model an established board

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
	const reason = (await page.locator('.reward-reason').textContent().catch(() => '')).trim();
	console.log('KO chain result:', title, '|', reason);
	await ss(page, 'chain-defeat-at-0-knockout');
	expect(title).toBe('Victory!');
	expect(reason.toUpperCase()).toContain('KNOCKOUT');
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

// ── Chain C: Tuk Healer's Healing Presence targets ONE chosen Mosje +10 (two-Mosje
// scenario, choosing the OTHER Mosje) ─────────────────────────────────────────
// 2026-07-13 ability-text-engine-reconciliation ruling replaced "heal ALL +15" with
// "choose this Mosje or another own Mosje, +10". Uses setMosjeOnField to put a
// second Mosje on the field (engine starts with one).
test('chain: Tuk Healer targets the chosen Mosje +10, leaves the other untouched', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_tuk_chain', name: 'Tuk Chain',
		mosjes: ['mosje_tuk_healer'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	// Ensure Tuk Healer is slot 0, and place a second Mosje in slot 1.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_tuk_healer', { mp: 30, level: 0 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 20, level: 0 });
	await page.waitForTimeout(150);

	const before0 = await ownSlot(page, 0);
	const before1 = await ownSlot(page, 1);
	expect(before0).toBe(30);
	expect(before1).toBe(20);

	// Use Tuk Healer's ability — two Mosjes on field, so a target picker appears.
	const card = page.locator('.mosje-card--owned[data-card-id="mosje_tuk_healer"]');
	const btn = card.locator('.mosje-ability-btn');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(400);
	// Choose slot 1 (the OTHER Mosje, not Tuk Healer itself).
	await page.locator('.target-option[data-id="player_1_slot_1"]').click();
	await page.waitForTimeout(700);
	await ss(page, 'chain-tuk-healer-targeted');

	const after0 = await ownSlot(page, 0);
	const after1 = await ownSlot(page, 1);
	console.log(`Tuk Healer: slot0 ${before0}→${after0}, slot1 ${before1}→${after1}`);
	expect(after0).toBe(30); // Tuk Healer itself untouched — target was slot 1
	expect(after1).toBe(30); // 20 + 10
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
	await clearEntryProtection(page); // U8 — chains model an established board

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

// ── Chain: Ming Natural's Lucky Draw — reveal modal, then (if a Piecie) a
// free-activate/keep choice; otherwise straight to hand +15 MP ─────────────
// 2026-07-13 ability-text-engine-reconciliation ruling: TEXT WINS, as a manual
// activation. Two deterministic decks (all-Piecie / all-SNELLE_PIECIE filler) drive
// each real branch instead of relying on shuffleDeck's RNG — a thin deck also
// drains to 0 on the 6-card opening draw alone, which would silently block Lucky
// Draw before the test even starts, so both decks use generous filler.
test('chain: Ming Natural Lucky Draw — draws a Piecie, choice modal appears, keep in hand', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_ming_chain_piecie', name: 'Ming Natural Chain (Piecie draw)',
		mosjes: ['mosje_ming_natural'],
		piecies: Array(12).fill('piecie_kannetje_melk'),
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	await setMosjeMP(page, 'player_1', 0, 40);
	await page.waitForTimeout(150);
	const handBefore = await getHandSize(page, 'player_1');
	const mpBefore = await ownSlot(page, 0);

	const card = page.locator('.mosje-card--owned[data-card-id="mosje_ming_natural"]');
	const btn = card.locator('.mosje-ability-btn');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(400);
	await page.locator('#modal-continue').click(); // reveal modal
	await page.waitForTimeout(400);
	await page.locator('.modal-mosje-select-btn[data-id="keep"]').click(); // choice modal
	await page.waitForTimeout(500);
	await ss(page, 'chain-ming-natural-piecie-keep');

	const handAfter = await getHandSize(page, 'player_1');
	const mpAfter = await ownSlot(page, 0);
	console.log(`Ming Natural (Piecie, kept): hand ${handBefore}→${handAfter}, MP ${mpBefore}→${mpAfter}`);
	expect(handAfter - handBefore).toBe(1); // kept, not activated
	expect(mpAfter).toBe(mpBefore); // no MP change on the Piecie/keep branch
});

test('chain: Ming Natural Lucky Draw — draws a non-Piecie, no choice modal, +15 MP', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_ming_chain_nonpiecie', name: 'Ming Natural Chain (non-Piecie draw)',
		mosjes: ['mosje_ming_natural'],
		piecies: [], snellePiecies: Array(12).fill('snelle_jensen'), places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	await setMosjeMP(page, 'player_1', 0, 40);
	await page.waitForTimeout(150);
	const handBefore = await getHandSize(page, 'player_1');
	const mpBefore = await ownSlot(page, 0);

	const card = page.locator('.mosje-card--owned[data-card-id="mosje_ming_natural"]');
	const btn = card.locator('.mosje-ability-btn');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(400);
	await page.locator('#modal-continue').click(); // reveal modal — no choice modal follows
	await page.waitForTimeout(500);
	await ss(page, 'chain-ming-natural-nonpiecie');

	const handAfter = await getHandSize(page, 'player_1');
	const mpAfter = await ownSlot(page, 0);
	console.log(`Ming Natural (non-Piecie): hand ${handBefore}→${handAfter}, MP ${mpBefore}→${mpAfter}`);
	expect(handAfter - handBefore).toBe(1);
	expect(mpAfter - mpBefore).toBe(15);
});

// ── Chain: Chris All-Rounder's Perfect Setup — 3+ face-down Piecies required,
// picks ONE via a target picker and free-activates it (no MP gain) ───────────
// 2026-07-13 ability-text-engine-reconciliation ruling: TEXT WINS (the 3+ gate)
// but drops the old 15 MP bonus. Not in card-registry.js because the generic
// runner can't pre-place 3 face-down Piecies before clicking the ability.
test('chain: Chris All-Rounder Perfect Setup — free-activates the chosen face-down Piecie', async ({ page }) => {
	test.setTimeout(60000);
	await seedCustomDeck(page, {
		id: 'custom_chris_chain', name: 'Chris Perfect Setup Chain',
		mosjes: ['mosje_chris'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	await setMosjeMP(page, 'player_1', 0, 40);
	await setHand(page, 'player_1', ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(150);

	// Place all 3 face-down — Perfect Setup's gate needs 3+ on the field, none activated.
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);

	const before = await ownSlot(page, 0);

	// Use Chris's ability — a target picker (modal-mosje-select-btn) appears for the 3 slots.
	const card = page.locator('.mosje-card--owned[data-card-id="mosje_chris"]');
	const btn = card.locator('.mosje-ability-btn');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(400);
	await page.locator('.modal-mosje-select-btn[data-id="0"]').click();
	await page.waitForTimeout(700);
	await ss(page, 'chain-chris-perfect-setup');

	const after = await ownSlot(page, 0);
	const state = await getGameState(page);
	const slot0 = state?.players?.player_1?.piecieSlots?.[0];
	const inGraveyard = state?.players?.player_1?.graveyard?.some(c => (c.cardId ?? c) === 'piecie_kannetje_melk');
	console.log(`Chris Perfect Setup: MP ${before}→${after}; slot0=${JSON.stringify(slot0)}`);

	// Kannetje Melk's own effect ran (+25 MP) — NOT the old 15 MP bonus Chris used to grant.
	expect(after).toBe(before + 25);
	// Non-persistent Piecie: activatePiecie sweeps it to graveyard, clearing the slot.
	expect(slot0).toBeNull();
	expect(inGraveyard).toBe(true);
});

// ── Chain: Jisca's Perfect Combo — rolling 5-6 free-activates the only eligible
// face-down Piecie (engine unlocks it, UI's step 2 calls activatePiecie) ────────
// 2026-07-13 ability-text-engine-reconciliation ruling: NEW DESIGN entirely
// replacing the old "+20 MP if last card was a Piecie" stub. Dice mocked to
// guarantee the 5-6 branch; the already-active/multi-choice branches are pure
// engine logic already covered by the unit tests in ability-text-reconciliation.test.ts.
test('chain: Jisca Perfect Combo — rolling 5-6 free-activates the only face-down Piecie', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0.99); // Math.random→0.99 ⇒ d6 always rolls 6

	await seedCustomDeck(page, {
		id: 'custom_jisca_chain', name: 'Jisca Perfect Combo Chain',
		mosjes: ['mosje_jisca'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	await setMosjeMP(page, 'player_1', 0, 40);
	await setHand(page, 'player_1', ['piecie_kannetje_melk']);
	await page.waitForTimeout(150);

	// Place exactly ONE face-down Piecie — single eligible slot, no target picker.
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);

	const before = await ownSlot(page, 0);

	const card = page.locator('.mosje-card--owned[data-card-id="mosje_jisca"]');
	const btn = card.locator('.mosje-ability-btn');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(900);
	await ss(page, 'chain-jisca-perfect-combo');

	const after = await ownSlot(page, 0);
	const state = await getGameState(page);
	const slot0 = state?.players?.player_1?.piecieSlots?.[0];
	console.log(`Jisca Perfect Combo: MP ${before}→${after}; slot0=${JSON.stringify(slot0)}`);

	// Kannetje Melk's own effect ran (+25 MP) via the free chain-activation.
	expect(after).toBe(before + 25);
	// Non-persistent Piecie: activatePiecie sweeps it to graveyard, clearing the slot.
	expect(slot0).toBeNull();
});

// ── Chain: Coert KasteLuck's Morning Luck — auto turn-start roll grants the NEXT
// Piecie played this turn same-turn activation (no test-only unlockPiecies call) ──
// 2026-07-13 ability-text-engine-reconciliation ruling: TEXT WINS (auto-trigger,
// not manual), but the grant is wired through the Chris+Youri canActivateOnTurn
// mechanism instead of the inert freePiecieActivationAvailable flag. Proves the
// full pipeline: startTurn's roll -> playPiecie's flag consumption -> the
// Activate button being genuinely usable THIS turn, without the test-only
// unlockPiecies escape hatch every other chain test relies on.
test('chain: Coert KasteLuck Morning Luck — rolling 4-6 lets the next Piecie activate same-turn', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0.99); // Math.random→0.99 ⇒ d6 always rolls 6 (turn-start roll AND any other rolls)

	await seedCustomDeck(page, {
		id: 'custom_kasteluck_chain', name: 'KasteLuck Morning Luck Chain',
		mosjes: ['mosje_coert_kasteluck'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	const stateAfterStart = await getGameState(page);
	expect(stateAfterStart?.players?.player_1?.kasteLuckSameTurnActivation).toBe(true);

	await setMosjeMP(page, 'player_1', 0, 40);
	await setHand(page, 'player_1', ['piecie_kannetje_melk']);
	await page.waitForTimeout(150);

	const before = await ownSlot(page, 0);

	// Place the Piecie — no unlockPiecies call. If Morning Luck's grant works, the
	// Activate button is already usable this same turn.
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);

	const stateAfterPlay = await getGameState(page);
	expect(stateAfterPlay?.players?.player_1?.kasteLuckSameTurnActivation).toBe(false); // one-shot, consumed
	const placedSlot = stateAfterPlay?.players?.player_1?.piecieSlots?.find(s => s !== null);
	expect(placedSlot?.canActivateOnTurn).toBe(stateAfterPlay?.turnNumber); // same turn, not turnNumber+1

	await activate(page, 'piecie_kannetje_melk'); // no prior unlockPiecies — proves it's genuinely activatable now
	await ss(page, 'chain-kasteluck-morning-luck');

	const after = await ownSlot(page, 0);
	console.log(`Coert KasteLuck Morning Luck: MP ${before}→${after}`);
	expect(after).toBe(before + 25); // Kannetje Melk's own effect ran
});

// ── Chain E: Piecie MP gain CAPS at 100 (no level-up) — Phase 31 ─────────────
// Game rule (phase0-rulings.md): a Mosje's MP is always 0–100; piecies/abilities
// NEVER permanently level up (only Quests do) and their gains cap at 100.
// A Lv0/80 Mosje gaining +25 from Kannetje Melk lands at Lv0/100 (capped) — not
// Lv0/105 and not a level-up. Enforced by applyMPGain cap + clampMosjeMp sweep.
test('chain: piecie MP gain caps at 100 (no level-up)', async ({ page }) => {
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

	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_destroyer', { mp: 80, level: 0 });
	await setHand(page, 'player_1', ['piecie_kannetje_melk']);

	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');
	await activate(page, 'piecie_kannetje_melk');   // +25 on 80 → should CAP at 100

	const after = await ownSlotObj(page, 0);
	console.log(`MP-cap chain: → Lv${after.level}/${after.mp} (expected Lv0/100)`);
	await ss(page, 'chain-mp-cap');
	expect(after.level).toBe(0);                    // piecies never permanently level up
	expect(after.mp).toBe(100);                     // +25 on 80 capped at 100 (not 105)
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

// ── Chain: Chris DDR's Perfect Combo Chain — activating a Piecie auto-chains
// another from hand (recursive, passive) ─────────────────────────────────────
// 2026-07-13 ability-text-engine-reconciliation ruling: TEXT WINS, replacing a
// "+5 MP per Piecie played" stub. After ANY Piecie activation, rolls 1d6; on 5-6,
// activates another Piecie from hand for free. Dice forced to 6 so the chain
// always fires; the recursive cap-at-3 and DJ 80/20 +2 synergy are pure engine
// logic already covered by the unit tests in ability-text-reconciliation.test.ts.
test('chain: Chris DDR Perfect Combo Chain — activating a Piecie auto-chains another from hand', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0.99); // Math.random→0.99 ⇒ d6 always rolls 6

	await seedCustomDeck(page, {
		id: 'custom_chrisddr_chain', name: 'Chris DDR Perfect Combo Chain',
		mosjes: ['mosje_chris_ddr'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page); // U8 — chains model an established board

	await setMosjeMP(page, 'player_1', 0, 40);
	await setHand(page, 'player_1', ['piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(150);

	// Place ONE face-down (the trigger); the other copy stays in hand as the chain target.
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await unlockPiecies(page, 'player_1');

	const before = await ownSlot0(page);
	const handBefore = await getHandSize(page, 'player_1');

	await activate(page, 'piecie_kannetje_melk');
	await ss(page, 'chain-chrisddr-perfect-combo');

	const after = await ownSlot0(page);
	const handAfter = await getHandSize(page, 'player_1');
	const state = await getGameState(page);
	console.log(`Chris DDR Perfect Combo Chain: MP ${before}→${after}, hand ${handBefore}→${handAfter}, chainUses=${state?.players?.player_1?.chrisDdrChainUsesThisTurn}`);

	// Original activation +25, chained Piecie +25 (both target Chris DDR himself)
	expect(after).toBe(before + 50);
	expect(handAfter).toBe(handBefore - 1); // chained Piecie consumed from hand
	expect(state?.players?.player_1?.chrisDdrChainUsesThisTurn).toBe(1);
});
