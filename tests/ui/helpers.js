// tests/ui/helpers.js — Shared Playwright test utilities for all UI tests.

export const GAME_URL        = '/game?offline=true&player=player_1';
export const GAME_URL_TEST   = '/game?offline=true&player=player_1&testMode=true';

/**
 * Block Firebase CDN so it degrades to LOCAL mode immediately,
 * seed sessionStorage so the offline game starts without the lobby.
 */
export async function seedOfflineSession(page, deckId = 'PHYSICAL_FORCE', botDeck = 'ARTISTIC_RHYTHM') {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	await page.addInitScript((opts) => {
		sessionStorage.setItem('mosjes:offline', JSON.stringify({
			name: 'TestPlayer',
			deckId: opts.deckId,
			botDeckId: opts.botDeck,
		}));
	}, { deckId, botDeck });
}

/**
 * Seed a custom deck (for cards not in starter decks).
 * Injects both the offline config and the custom deck definition.
 * customDeck must be a valid deck object: { id, mosjes[], piecies[], snellePiecies[], places[], quests[] }
 */
export async function seedCustomDeck(page, customDeck, botDeck = 'PHYSICAL_FORCE') {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	await page.addInitScript((opts) => {
		sessionStorage.setItem('mosjes:offline', JSON.stringify({
			name: 'TestPlayer',
			deckId: opts.deck.id,
			botDeckId: opts.botDeck,
		}));
		sessionStorage.setItem(`mosjes:customDeck:${opts.deck.id}`, JSON.stringify(opts.deck));
	}, { deck: customDeck, botDeck });
}

/**
 * Wait until startGame has run and at least one owned Mosje card is on the board.
 * Attaches page-error logger automatically.
 */
export async function waitForBoard(page) {
	page.on('pageerror', err => console.log('[PAGE CRASH]', err.message));
	await page.waitForFunction(() => {
		const label = document.getElementById('turn-label');
		return label && !label.textContent.includes('Loading') && !label.textContent.includes('Connecting');
	}, { timeout: 20000 });
	await page.waitForSelector('.mosje-card--owned', { timeout: 10000 });
}

/** Save screenshot to tests/ui/screenshots/<name>.png */
export async function ss(page, name) {
	const fs = await import('fs');
	fs.default.mkdirSync('tests/ui/screenshots', { recursive: true });
	await page.screenshot({ path: `tests/ui/screenshots/${name}.png`, fullPage: false });
}

/** Read all game log rows as strings. */
export async function readLog(page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('#log-root .log-row')].map(el => el.textContent.trim())
	);
}

/** Read owned Mosje cards: [{ name, mp (number) }] */
export async function readOwnedMosjes(page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('.mosje-card--owned')].map(card => ({
			name: card.querySelector('.uc-title, .mosje-name-v2')?.textContent?.trim() ?? '?',
			mp:   Number(card.querySelector('.uc-mp-val, .mosje-mp-header')?.textContent?.trim() ?? '-1'),
		}))
	);
}

/** Read opponent Mosje cards: [{ name, mp (number) }] */
export async function readOpponentMosjes(page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('.mosje-card--opponent')].map(card => ({
			name: card.querySelector('.mosje-name-v2')?.textContent?.trim() ?? '?',
			mp:   Number(card.querySelector('.mosje-mp-header')?.textContent?.trim() ?? '-1'),
		}))
	);
}

/** Read all cards in the human player's hand: [{ cardId, cardType, name }] */
export async function readHand(page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('.hand-card-wrap')].map(wrap => ({
			cardId:   wrap.getAttribute('data-card-id') ?? '?',
			cardType: wrap.getAttribute('data-card-type') ?? '?',
			name:     (wrap.querySelector('.card__name') ?? wrap.querySelector('.place-name') ?? wrap.querySelector('.mosje-name-v2'))?.textContent?.trim() ?? '?',
		}))
	);
}

/** Count piecie slots that have a card (not empty, not just a slot outline). */
export async function countActivePiecieSlots(page) {
	return page.evaluate(() =>
		document.querySelectorAll('#piecies-player .piecie-slot.has-card').length
	);
}

/**
 * Check if a specific card is currently in the player's piecie zone.
 * Own piecies always render as full card elements (not .piecie-slot) because
 * toBoardViewModel sets faceDown:false for viewer-owned piecies.
 */
export async function isPiecieOnField(page, cardId) {
	return page.evaluate((id) =>
		document.querySelector(`#piecies-player [data-card-id="${id}"]`) !== null,
		cardId
	);
}

/**
 * Count how many of the player's piecies on field have an Activate button
 * (meaning they're placed but not yet activated = effectively "face-down" state).
 * Own piecies render as full cards; face-down state shows Activate button.
 */
export async function countFaceDownPiecies(page) {
	return page.evaluate(() =>
		document.querySelectorAll('#piecies-player [data-zone="piecie"] button').length
	);
}

/**
 * Use __testHooks to set a Mosje's MP directly (requires testMode=true in URL).
 * playerId: 'player_1' | 'player_2'
 * slotIndex: 0, 1, ...
 */
export async function setMosjeMP(page, playerId, slotIndex, mp) {
	await page.evaluate(({ pid, si, mp }) => {
		window.__testHooks?.setMosjeMP(pid, si, mp);
	}, { pid: playerId, si: slotIndex, mp });
	// Wait for re-render
	await page.waitForTimeout(200);
}

export async function setYouriUses(page, playerId, count) {
	await page.evaluate(({ pid, count }) => {
		window.__testHooks?.setYouriUses(pid, count);
	}, { pid: playerId, count });
}

/** Make all face-down piecies/places immediately activatable this turn (testMode=true). */
export async function unlockPiecies(page, playerId = 'player_1') {
	await page.evaluate((pid) => window.__testHooks?.unlockPiecies(pid), playerId);
	await page.waitForTimeout(200);
}

/** Replace a player's hand with exactly the given cardIds (keeps the hand small). */
export async function setHand(page, playerId, cardIds) {
	await page.evaluate(({ pid, ids }) => window.__testHooks?.setHand(pid, ids), { pid: playerId, ids: cardIds });
	await page.waitForTimeout(200);
}

/**
 * Place a specific Mosje into a slot with custom MP/level (testMode=true).
 * Enables two-Mosje and precise-board scenarios. Pass cardId=null to clear.
 *   setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 30, level: 1 })
 */
export async function setMosjeOnField(page, playerId, slotIndex, cardId, opts = {}) {
	await page.evaluate(({ pid, si, cid, o }) => window.__testHooks?.setMosjeOnField(pid, si, cid, o),
		{ pid: playerId, si: slotIndex, cid: cardId, o: opts });
	await page.waitForTimeout(200);
}

/** Set mpLostThisTurn on a Mosje slot (for comeback/adaptive ability tests). */
export async function setMpLostThisTurn(page, playerId, slotIndex, amount) {
	await page.evaluate(({ pid, si, amount }) => {
		window.__testHooks?.setMpLostThisTurn(pid, si, amount);
	}, { pid: playerId, si: slotIndex, amount });
}

/** Set pieciesPlayedThisTurn counter (for Chris DDR ability test). */
export async function setPieciesPlayedThisTurn(page, playerId, count) {
	await page.evaluate(({ pid, count }) => {
		window.__testHooks?.setPieciesPlayedThisTurn(pid, count);
	}, { pid: playerId, count });
}

/** Set lastCardPlayedType (for Jisca combo ability test). */
export async function setLastCardPlayedType(page, playerId, type) {
	await page.evaluate(({ pid, type }) => {
		window.__testHooks?.setLastCardPlayedType(pid, type);
	}, { pid: playerId, type });
}

/** Inject _pendingTargets into game state (for abilities that need pre-set targets). */
export async function setPendingTargets(page, targets) {
	await page.evaluate((t) => {
		window.__testHooks?.setPendingTargets(t);
	}, targets);
}

/** Inject a card directly into a player's hand (for ability cost-discard tests). */
export async function injectHandCard(page, playerId, cardId) {
	await page.evaluate(({ pid, id }) => {
		window.__testHooks?.injectHandCard(pid, id);
	}, { pid: playerId, id: cardId });
	await page.waitForTimeout(150);
}

/** Inject a card into a player's graveyard (for retrieve-from-graveyard ability tests). */
export async function injectGraveyardCard(page, playerId, cardId) {
	await page.evaluate(({ pid, id }) => {
		window.__testHooks?.injectGraveyardCard(pid, id);
	}, { pid: playerId, id: cardId });
}

/** Read current hand size for a player via testHooks. */
export async function getHandSize(page, playerId) {
	return page.evaluate((pid) => window.__testHooks?.getHandSize(pid) ?? -1, playerId);
}

/** Read current graveyard size for a player via testHooks. */
export async function getGraveyardSize(page, playerId) {
	return page.evaluate((pid) => window.__testHooks?.getGraveyardSize(pid) ?? -1, playerId);
}

/** Read a snapshot of the full game state (for asserting status effects, flags, etc.). */
export async function getGameState(page) {
	return page.evaluate(() => window.__testHooks?.getGameState() ?? null);
}

/**
 * Put a specific quest at the top of the shared general quest deck.
 * Use before clicking General Quest to guarantee a known quest is drawn.
 * questId: e.g. 'quest_arm_wrestling', 'quest_parkour_challenge'
 */
export async function injectQuestToTopOfDeck(page, questId) {
	await page.evaluate((id) => {
		window.__testHooks?.injectQuestToTopOfDeck(id);
	}, questId);
}

/**
 * Play a card from hand by its cardId.
 * Clicks the play button if visible, otherwise the card wrap itself.
 */
export async function playCardFromHand(page, cardId) {
	// Use .first() — multiple copies of the same card can be in hand
	const wrap = page.locator(`.hand-card-wrap[data-card-id="${cardId}"]`).first();
	await wrap.waitFor({ timeout: 5000 });
	const playBtn = wrap.locator('.hand-card__play-btn');
	if (await playBtn.isVisible({ timeout: 300 }).catch(() => false)) {
		await playBtn.click();
	} else {
		await wrap.click();
	}
}

/**
 * Dismiss the current modal by clicking Cancel / Annuleer (if present).
 * Returns true if a cancel button was found and clicked.
 */
export async function dismissModal(page) {
	const cancel = page.locator('.btn-cancel, #modal-option-cancel, button:has-text("Annuleer"), button:has-text("Cancel")').first();
	if (await cancel.isVisible({ timeout: 400 }).catch(() => false)) {
		await cancel.click();
		return true;
	}
	return false;
}

/**
 * Click End Turn and wait for the bot to finish (button re-enables).
 */
export async function endTurnAndWait(page) {
	await page.click('#btn-end-turn');
	await page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 25000 });
}

/**
 * Mock Math.random to always return a fixed value (0–1).
 * Call BEFORE page.goto. Used to make dice rolls deterministic.
 * value = 0 → die rolls 1 (always fail most quests)
 * value = 1 → die rolls 6 (always success most quests) — note: Math.floor(1*6)+1 = 7, so use 0.9999
 */
export async function mockDiceRoll(page, value) {
	await page.addInitScript((v) => {
		const original = Math.random;
		Math.random = () => v;
		// Restore after 30s so rest of game isn't permanently affected
		setTimeout(() => { Math.random = original; }, 30000);
	}, value);
}
