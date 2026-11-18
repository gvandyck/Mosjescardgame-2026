// personalQuestTrigger - play a Personal Quest from the hand through the real UI (Play on the card, then the modals).
// A refused card shows a "cannot be played" modal: its text is read before it is closed and kept on c.seenText for the
// `refused` expectation (tests/helpers/personalQuestExpect.js). The caller answers the remaining modals with answerModals.
import { playCardFromHand } from '../ui/helpers.js';

export async function personalQuestTrigger(page, t, c) {
	await playCardFromHand(page, t.cardId);
	if (!c.expect?.refused) return;
	const modal = page.locator('.modal-card, .modal-content').first();
	await modal.waitFor({ state: 'visible', timeout: 5000 });
	c.seenText = (await modal.innerText()).replace(/\s+/g, ' ');
}
