/**
 * alyssa-jisca-synergy.spec.js — Phase 38 (D-01..D-05) repro-first browser test.
 *
 * REPRO-FIRST per CLAUDE.md: this spec drives the REAL .js game via
 * window.__testHooks and is written to FAIL on current code, because
 * synergyEffect is null on all 3 duo cards and no engine effect exists yet
 * (engine wiring is Plan 38-02 — a separate wave). Both scenarios below are
 * EXPECTED RED until then. Do not "fix" this spec in this plan.
 *
 * Scenario A (D-02, Alyssa side): while Jisca is also on the field, Alyssa
 * gains +10 MP at the start of each of her owner's turns (on top of the
 * fixed +10 turn trickle every active Mosje already gets — src/engine/
 * turnManager.js:286). Total expected delta across one turn boundary once
 * wired: 20 MP. Today (RED): only the 10 MP trickle fires.
 *
 * Scenario B (D-03, Jisca side): while an Alyssa is also on the field, the
 * FIRST Piecie the owner plays each turn gives +10 MP (once-per-turn cap —
 * a second Piecie played the same turn grants no additional bonus). Uses
 * piecie_katjegang (STATUS_EFFECT, zero own MP effect) so the only possible
 * MP delta observed is the synergy bonus itself, not the Piecie's own effect.
 * Today (RED): no MP delta at all on either play.
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	waitForBoard,
	setMosjeOnField,
	setHand,
	clearEntryProtection,
	playCardFromHand,
	getGameState,
	endTurnAndWait,
	mockDiceRoll,
	ss,
} from '../helpers.js';

// A duo deck for player_1 carrying both cards this phase cares about, plus a
// harmless custom bot deck for player_2 with ZERO Piecies/Snelle Piecies/
// Places — the bot literally has nothing to play against Alyssa, so the only
// remaining opponent-touching surface is a General Quest reward, which
// mockDiceRoll below neutralizes (forced-fail dice = no quest reward fires).
const PLAYER_DECK = {
	id: 'custom_alyssa_jisca_synergy_player',
	name: 'Alyssa/Jisca Synergy Test — Player',
	mosjes: ['mosje_alyssa_bulldozer', 'mosje_jisca'],
	piecies: ['piecie_katjegang', 'piecie_katjegang'],
	snellePiecies: [],
	places: [],
	quests: [],
};

const BOT_DECK_HARMLESS = {
	id: 'custom_alyssa_jisca_synergy_bot',
	name: 'Alyssa/Jisca Synergy Test — Harmless Bot',
	mosjes: ['mosje_michelle'], // self-only ability (Tough Gamble) — no opponent-targeting card
	piecies: [],
	snellePiecies: [],
	places: [],
	quests: [],
};

/**
 * Seed TWO custom decks (player + bot) in one session, since seedCustomDeck
 * (tests/ui/helpers.js) only injects a single custom deck. Mirrors its own
 * addInitScript pattern — resolveCustomDeckDef (src/main.js) reads
 * `mosjes:customDeck:<id>` from sessionStorage regardless of which player
 * the deckId belongs to, so writing both entries works for both sides.
 */
async function seedDuoScenario(page, playerDeck, botDeck) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	await page.addInitScript((opts) => {
		sessionStorage.setItem('mosjes:offline', JSON.stringify({
			name: 'TestPlayer',
			deckId: opts.playerDeck.id,
			botDeckId: opts.botDeck.id,
		}));
		sessionStorage.setItem(`mosjes:customDeck:${opts.playerDeck.id}`, JSON.stringify(opts.playerDeck));
		sessionStorage.setItem(`mosjes:customDeck:${opts.botDeck.id}`, JSON.stringify(opts.botDeck));
	}, { playerDeck, botDeck });
}

test('Scenario A (D-02): Alyssa gains +10 MP at start of turn while Jisca is on field [EXPECTED RED — engine wiring is Plan 38-02]', async ({ page }) => {
	test.setTimeout(60000);
	// Force all dice rolls to fail (roll 1) so the harmless bot's General Quest
	// attempts (if any) never succeed a reward — Alyssa's MP stays isolated to
	// the trickle + synergy under test.
	await mockDiceRoll(page, 0);
	await seedDuoScenario(page, PLAYER_DECK, BOT_DECK_HARMLESS);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 20, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_jisca', { mp: 20, level: 1 });
	// U8 — model an established board, not a fresh-entry-protection scenario.
	await clearEntryProtection(page);

	const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	await ss(page, 'alyssa-jisca-scenario-a-before');

	// Advance through the bot's turn back to the owner's next turn — this is
	// where the turn-start trickle (+10, always) and the Alyssa synergy bonus
	// (+10, once wired) both fire (src/engine/turnManager.js startTurn).
	await endTurnAndWait(page);

	const after = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	const delta = after - before;
	console.log(`Scenario A — Alyssa MP delta across turn boundary: ${delta} (expect 20 = 10 trickle + 10 synergy once wired; RED today = 10)`);
	await ss(page, 'alyssa-jisca-scenario-a-after');

	// EXPECTED RED on current code: synergyEffect is null and no engine hook
	// exists, so the delta is only the fixed +10 turn trickle (10), not 20.
	expect(delta).toBe(20);
});

test('Scenario B (D-03): first Piecie played each turn gives Jisca +10 MP while an Alyssa is on field; second Piecie grants no extra [EXPECTED RED — engine wiring is Plan 38-02]', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0);
	await seedDuoScenario(page, PLAYER_DECK, BOT_DECK_HARMLESS);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 20, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_jisca', { mp: 20, level: 1 });
	await clearEntryProtection(page);
	await setHand(page, 'player_1', ['piecie_katjegang', 'piecie_katjegang']);

	const beforeFirst = (await getGameState(page)).players.player_1.activeSlots[1].mp; // Jisca, slot 1
	await playCardFromHand(page, 'piecie_katjegang'); // 1st Piecie this turn
	await page.waitForTimeout(400);
	const afterFirst = (await getGameState(page)).players.player_1.activeSlots[1].mp;
	const deltaFirst = afterFirst - beforeFirst;
	console.log(`Scenario B — Jisca MP delta after FIRST Piecie played: ${deltaFirst} (expect 10 once wired; RED today = 0)`);
	await ss(page, 'alyssa-jisca-scenario-b-first-piecie');

	await playCardFromHand(page, 'piecie_katjegang'); // 2nd Piecie this turn — once-per-turn cap
	await page.waitForTimeout(400);
	const afterSecond = (await getGameState(page)).players.player_1.activeSlots[1].mp;
	const deltaSecond = afterSecond - afterFirst;
	console.log(`Scenario B — Jisca MP delta after SECOND Piecie played: ${deltaSecond} (expect 0, once-per-turn cap; RED today = 0 — but for the wrong reason, no bonus exists at all yet)`);
	await ss(page, 'alyssa-jisca-scenario-b-second-piecie');

	// EXPECTED RED on current code: piecie_katjegang has zero own MP effect
	// (src/abilities/piecieEffects.js effect_katjegang) and no Jisca synergy
	// hook exists, so deltaFirst is 0 today instead of the expected 10.
	expect(deltaFirst).toBe(10);
	// This assertion is compatible with both RED (0 === 0, passes) and the
	// wired GREEN behavior (0 === 0, cap correctly enforced) — deltaFirst's
	// assertion above is the one that proves the RED/GREEN state honestly.
	expect(deltaSecond).toBe(0);
});
