// personalQuestExpect - the Personal Quest expectations of a card-test-library case (tests/ui/cards/personal-quest-registry-2-1.js).
//   gameOver: { card, mosje }  the game-over overlay names the win reason PERSONAL_QUEST, the winner, the card and the Mosje
//   failed: true               the roll missed: the game goes on, the card is gone from the hand, the Pay is spent
//   refused: RegExp            the modal says why (matched on its text); nothing is paid and the card stays in the hand
import { expect } from '@playwright/test';

export async function personalQuestExpect(page, c, before, after) {
	const e = c.expect;
	if (e.gameOver) {
		const overlay = page.locator('#reward-overlay');
		await expect(overlay).toBeVisible({ timeout: 15000 });
		await expect(overlay).toHaveAttribute('data-win-reason', 'PERSONAL_QUEST');
		await expect(overlay).toHaveAttribute('data-winner-id', 'player_1');
		await expect(page.locator('.reward-reason')).toContainText(e.gameOver.card);
		await expect(page.locator('.reward-reason')).toContainText(e.gameOver.mosje);
		expect(after.status).toBe('FINISHED');
	}
	if (e.failed) {
		expect(after.status).toBe('PLAYING');
		expect(after.players.player_1.hand.some(x => x.cardId === c.trigger.cardId)).toBe(false);
	}
	if (e.refused) {
		expect(c.seenText, 'the refusal modal').toMatch(e.refused);
		expect(after.status).toBe('PLAYING');
		expect(after.players.player_1.hand.some(x => x.cardId === c.trigger.cardId), 'the card stays in the hand').toBe(true);
		expect(after.players.player_1.hand.length, 'nothing discarded').toBe(before.players.player_1.hand.length);
		expect(after.players.player_1.energy, 'nothing paid').toBe(before.players.player_1.energy);
		expect(after.players.player_1.activeSlots[0].mp, 'no MP paid').toBe(before.players.player_1.activeSlots[0].mp);
	}
}
