// Every card at the three phone card sizes (Phase 72.1-05, D-08): 158 px (hand), 240 px (option row) and 300 px (detail face).
// Renders each card with the real renderer and real CSS inside the phone viewport. Its text either fits its text box, or the face is
// flagged data-cv1-clamped (bottom fade) and stays inside the box. No legacy plate, no .cv2-block (Personal Quest Needs / Pay / Roll)
// that leaves its face, no Personal Quest block cut without the clamp flag. The clamped set is pinned per width so a new clamp is
// noticed instead of silently accepted. Runs through the `phone` project (395x731 touch).
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard } from '../helpers.js';

// Cards whose text is longer than their text box holds at that width (full text: the detail view). Captured by hand, see the SUMMARY.
const CLAMPED = { 158: [], 240: [], 300: [] };

for (const width of [158, 240, 300]) {
	test(`phone card text fits for every card at ${width}px wide`, async ({ page }) => {
		await seedOfflineSession(page, 'EXAMPLE_TAKSEN', 'EXAMPLE_CREATIEVELINGEN');
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);
		const result = await page.evaluate(async (w) => {
			const { renderCard } = await import('/src/ui/cardRenderer.js');
			const { MOSJES } = await import('/src/data/mosjes.js');
			const { PIECIES } = await import('/src/data/piecies.js');
			const { SNELLE_PIECIES } = await import('/src/data/snellePiecies.js');
			const { PLACES } = await import('/src/data/places.js');
			const { QUESTS } = await import('/src/data/quests.js');
			const { PERSONAL_QUESTS } = await import('/src/data/personalQuests.js');
			const cards = [...MOSJES, ...PIECIES, ...SNELLE_PIECIES, ...PLACES, ...QUESTS.filter((q) => q.stack), ...PERSONAL_QUESTS].filter((c) => !c.disabled);
			const holder = document.createElement('div');
			holder.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#000';
			document.body.appendChild(holder);
			const bad = [];
			const clamped = [];
			let personal = 0;
			for (const c of cards) {
				const card = renderCard({ ...c, description: c.abilityDescription || c.description || '' }, { compact: false });
				card.style.setProperty('--cv1-w', `${w}px`);
				holder.replaceChildren(card);
				if (card.querySelector('.ct-plate')) { bad.push(`${c.id} (still has a legacy plate)`); continue; }
				const face = card.querySelector('.cv1-face--2');
				const box = card.querySelector('.cv2-textbox');
				const text = card.querySelector('.cv2-text');
				const flagged = face?.dataset.cv1Clamped === 'true';
				if (flagged) clamped.push(c.id);
				if (box && face) {
					const faceBox = card.getBoundingClientRect();
					const boxRect = box.getBoundingClientRect();
					if (boxRect.bottom - faceBox.bottom > 1) bad.push(`${c.id} (text box leaves the card by ${Math.round(boxRect.bottom - faceBox.bottom)}px)`);
					if (boxRect.right - faceBox.right > 1 || faceBox.left - boxRect.left > 1) bad.push(`${c.id} (text box leaves the card sideways)`);
				}
				if (text && box) {
					const out = text.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
					if (out > 1) bad.push(`${c.id} (text area leaves the box by ${Math.round(out)}px)`);
					if (text.scrollHeight > text.clientHeight + 1 && !flagged) bad.push(`${c.id} (text cut but not flagged clamped)`);
				}
				for (const blockEl of card.querySelectorAll('.cv2-block')) {
					personal++;
					const b = blockEl.getBoundingClientRect();
					const f = card.getBoundingClientRect();
					if (b.bottom > f.bottom + 1 || b.right > f.right + 1 || b.left < f.left - 1) bad.push(`${c.id} (a .cv2-block leaves the card)`);
					const label = blockEl.querySelector('.cv2-block-label')?.getBoundingClientRect();
					const body = blockEl.querySelector('.cv2-block-text')?.getBoundingClientRect();
					if (label && body && label.bottom > body.top + 1) bad.push(`${c.id} (a .cv2-block label collides with its text)`);
				}
			}
			holder.remove();
			return { count: cards.length, personal, bad, clamped };
		}, width);
		expect(result.count).toBeGreaterThan(100);
		expect(result.personal, 'the Personal Quest blocks were checked').toBeGreaterThan(0);
		console.log(`REPORT clamped at ${width}px: ${JSON.stringify(result.clamped)}`);
		expect(result.bad, 'cards whose text collides or runs out of the face').toEqual([]);
		expect(result.clamped, 'cards whose text is clamped').toEqual(CLAMPED[width]);
	});
}
