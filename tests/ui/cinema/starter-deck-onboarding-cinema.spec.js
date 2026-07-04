/**
 * starter-deck-onboarding-cinema.spec.js — "Cinema mode" walkthrough of every
 * screen/modal added in Phase 34 (Account Starter-Deck Onboarding & Active Deck):
 *
 *   Scene 1 — Guest lobby: the #deck-select dropdown, now duo-decks-only.
 *   Scene 2 — Blocking onboarding modal: a fresh signed-in account with 0 decks,
 *             forced to pick one of the 5 duo starter decks before anything else.
 *   Scene 3 — Active-deck panel: what a returning signed-in player sees instead
 *             of the dropdown (their chosen deck's name + Mosjes).
 *   Scene 4 — Change-deck switcher modal: swapping the active deck, and the
 *             panel re-rendering to match.
 *
 * Drives the REAL lobby DOM via the three committed, param-gated test hooks
 * (?testGuestDeck=1, ?testOnboarding=1, ?testActiveDeck=1) — no Firebase, but
 * the exact real handleLobbyAuthChange / promptStarterDeckPick / setupActiveDeckPanel
 * code paths run live. Same hooks the regression specs
 * (onboarding-starter-deck.spec.js, active-deck-lobby.spec.js) already prove.
 *
 * Every action holds for BEAT ms (default 5000 — five full seconds) so a human
 * can actually watch each screen/design before it moves on.
 *
 *   npx playwright test --project=visual tests/ui/cinema/starter-deck-onboarding-cinema.spec.js --headed
 *
 * Override the hold time: CINEMA=8000 npx playwright test ... (ms per beat).
 */

import { test, expect } from '@playwright/test';
import { ss } from '../helpers.js';

const DUO_IDS = [
	'DUO_COERT_BINTI',
	'DUO_GANDOE_MICHELLE',
	'DUO_CHRIS_YOURI',
	'DUO_JISCA_ALYSSA',
	'DUO_WEST_CLESS',
];

async function blockFirebase(page) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
}

test('🎬 Starter-deck onboarding & active-deck cinema — all 4 new lobby screens', async ({ page }, testInfo) => {
	test.setTimeout(180000);

	// Default to a slow, watchable 5s beat whenever this runs headed; CINEMA
	// env var overrides (e.g. CINEMA=0 for a fast smoke pass).
	const BEAT = process.env.CINEMA !== undefined
		? Number(process.env.CINEMA)
		: (testInfo.project.use.headless === false ? 5000 : 0);
	const beat = (label) => {
		if (label) console.log(`🎬 ${label}`);
		return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve();
	};

	await blockFirebase(page);

	// ── Scene 1: Guest lobby — dropdown is now duo-decks-only ────────────────
	await page.goto('/?testGuestDeck=1');
	await expect(page.locator('#deck-select')).toBeVisible();
	await expect(page.locator('#deck-select option')).toHaveCount(5);
	await ss(page, 'cinema-onboarding-1-guest-dropdown');
	await beat('Scene 1 — Guest lobby: Starter Deck dropdown now lists only the 5 duo decks (no PHYSICAL_FORCE / DIGITAL_CONTROL / ARTISTIC_RHYTHM)');

	await page.locator('#deck-select').click();
	await ss(page, 'cinema-onboarding-1b-guest-dropdown-open');
	await beat('Scene 1b — Dropdown open: Coert & Binti, Gandoe & Michelle, Chris & Youri, Jisca & Alyssa, West & Cless');
	await page.keyboard.press('Escape');

	// ── Scene 2: Blocking onboarding modal (fresh signed-in account, 0 decks) ─
	await page.goto('/?testOnboarding=1');
	const modalCard = page.locator('#modal-root .modal-card');
	await expect(modalCard).toBeVisible();
	await expect(modalCard.locator('h3')).toHaveText('Choose your starter deck');
	await expect(page.locator('.modal-mosje-select-btn')).toHaveCount(5);
	await expect(page.locator('#modal-option-cancel')).toHaveCount(0);
	await ss(page, 'cinema-onboarding-2-blocking-modal');
	await beat('Scene 2 — First login, 0 decks: BLOCKING "Choose your starter deck" modal. No cancel button — a new player must pick one of the 5 duo decks before reaching the lobby');

	// Hover each option briefly so the design (name + Mosjes meta line) is visible.
	for (const id of DUO_IDS) {
		await page.locator(`.modal-mosje-select-btn[data-id="${id}"]`).hover();
		await beat(`Scene 2 — Option: ${id}`);
	}

	await page.locator('.modal-mosje-select-btn[data-id="DUO_JISCA_ALYSSA"]').click();
	await expect(page.locator('#modal-root .modal-card')).toHaveCount(0);
	await expect(page.locator('#lobby-form')).toBeVisible();
	await ss(page, 'cinema-onboarding-3-picked-unblocked');
	await beat('Scene 2 — Picked "Jisca & Alyssa — Encore Bulldozer". Modal closes, deck is claimed (saved + set active + exact card grant), lobby unblocks');

	// ── Scene 3: Active-deck panel (returning signed-in player) ──────────────
	await page.goto('/?testActiveDeck=1');
	await expect(page.locator('#deck-select')).toBeHidden();
	const panel = page.locator('#active-deck-panel');
	await expect(panel).toBeVisible();
	await expect(panel.locator('.active-deck-panel__name')).toHaveText("Coert & Binti — Winston's Kitchen");
	await ss(page, 'cinema-onboarding-4-active-deck-panel');
	await beat('Scene 3 — Returning signed-in player: dropdown is HIDDEN, replaced by the active-deck panel showing their saved deck ("Coert & Binti — Winston\'s Kitchen") + its Mosjes, plus a "Change deck" button');

	// ── Scene 4: Change-deck switcher modal ───────────────────────────────────
	await page.locator('#btn-change-deck').click();
	const switcherButtons = page.locator('.modal-mosje-select-btn');
	await expect(switcherButtons).toHaveCount(2);
	await ss(page, 'cinema-onboarding-5-switcher-modal');
	await beat('Scene 4 — "Change deck" opens a switcher modal listing this player\'s saved decks (built on the same reusable selection modal as onboarding)');

	await page.locator('.modal-mosje-select-btn[data-id="DUO_GANDOE_MICHELLE"]').click();
	await expect(page.locator('#modal-root .modal-card')).toHaveCount(0);
	await expect(panel.locator('.active-deck-panel__name')).toHaveText('Gandoe & Michelle — The Box');
	await ss(page, 'cinema-onboarding-6-panel-reswitched');
	await beat('Scene 4 — Switched to "Gandoe & Michelle — The Box": modal closes, panel re-renders instantly to the new active deck. This is the deck the next game will use');

	console.log('🎬 End of Phase 34 walkthrough — onboarding, guest dropdown, active-deck panel, and switcher all shown.');
});
