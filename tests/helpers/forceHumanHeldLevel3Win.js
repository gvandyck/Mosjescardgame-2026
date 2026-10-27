// forceHumanHeldLevel3Win.js — Playwright helper (not a test file): make the human (player_1) win by a held Level 3 in a few
// clicks, through the real UI (the recipe of tests/ui/full-game.spec.js, "reaching Level 3 is NOT an instant win").
// Needs a page opened with testMode=true (the setters live on window.__testHooks) and a board that has loaded.
// Resolves when #reward-overlay is on screen; throws if it does not show within `overlayTimeout`.
import { questViaUi } from '../ui/helpers.js';
import { clickEndTurn } from './clickEndTurn.js';

export async function forceHumanHeldLevel3Win(page, { overlayTimeout = 40000 } = {}) {
	await page.evaluate(() => {
		const hooks = window.__testHooks;
		// Both hands empty: a random opening Snelle would reroll or add a die in the forced Quest rolls below.
		hooks.setHand('player_1', []);
		hooks.setHand('player_2', []);
		// Level 2 / 90 MP, no quest-success ability: a winning Steady Quest (+25) pushes it past the Level 3 line.
		hooks.setMosjeOnField('player_1', 0, 'mosje_gandoe_destroyer', { mp: 90, level: 2 });
		hooks.setQuestFaceUp('FIGHTING', 'quest_tough_it_out');
		hooks.setNextDice([6, 6, 6]); // guaranteed success
		hooks.setTurnNumber(3);
	});
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	await page.waitForTimeout(800);

	// Level 3 reached this turn is no instant win. Shield the Mosje (entry protection) so the bot cannot knock it down
	// before the owner's next turn starts, where the held Level 3 wins.
	await page.evaluate(() => {
		const slot = window.__testHooks.getGameState().players.player_1.activeSlots[0];
		window.__testHooks.setMosjeOnField('player_1', 0, slot.cardId, { mp: slot.mp, level: slot.level, entryProtected: true });
	});
	await clickEndTurn(page);
	await page.waitForSelector('#reward-overlay', { timeout: overlayTimeout });
}
