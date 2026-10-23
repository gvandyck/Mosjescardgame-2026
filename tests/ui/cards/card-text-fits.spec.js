// Every card's ability text ends inside its text box, at the pop-up size and at the small 230px hand stress size.
// Renders each card definition with the real card renderer and real CSS.
// Mosjes are always full art (no plate, Phase 7 A1), so the boxed set is exactly the non-Mosje cards of frame tier 1-3.
// Every card type has the 2.0 frosted text box now (Places and the 38 2.0 Quests since 62-04): its text either fits, or it is
// flagged data-cv1-clamped (bottom fade + "..." , D-02) and stays inside the box. No face may still carry a legacy plate.
// The clamped set is pinned, so a card that starts to clamp is noticed instead of silently losing text.
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard } from '../helpers.js';

// Cards whose text is longer than the 2.0 boxed text box holds at the 11.5 floor (full text: modal panel, detail view).
const CLAMPED = ['piecie_bowie_stormey'];

for (const width of [440, 230]) {
	test(`ability text fits the plate for every card at ${width}px wide`, async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
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
			const { getFrameTier } = await import('/src/data/getFrameTier.js');
			// Quests: only the 38 with a stack have a 2.0 face (the 10 leftover V4 Quests use the unified template)
			const cards = [...MOSJES, ...PIECIES, ...SNELLE_PIECIES, ...PLACES, ...QUESTS.filter((q) => q.stack)].filter((c) => !c.disabled);
			const holder = document.createElement('div');
			holder.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#000';
			document.body.appendChild(holder);
			const expectedBoxed = cards.filter((c) => getFrameTier(c) <= 3).length;
			const bad = [];
			const clamped = [];
			let boxed = 0;
			for (const c of cards) {
				const card = renderCard({ ...c, description: c.abilityDescription || c.description || '' }, { compact: false });
				card.style.setProperty('--cv1-w', `${w}px`);
				holder.replaceChildren(card);
				const plate = card.querySelector('.ct-plate');
				const box = card.querySelector('.cv2-textbox');
				if (plate) { bad.push(`${c.id} (still has a legacy plate)`); continue; }
				if (card.classList.contains('card--boxed')) boxed++;
				if (!box) continue; // a Quest with no cost and no Also text has no text box
				const face = card.querySelector('.cv1-face--2');
				const text = card.querySelector('.cv2-text');
				const flagged = face.dataset.cv1Clamped === 'true';
				if (flagged) clamped.push(c.id);
				if (card.classList.contains('card--boxed')) {
					// a boxed text box never covers the art window
					const under = card.querySelector('.cv1-window').getBoundingClientRect().bottom - box.getBoundingClientRect().top;
					if (under > 1) bad.push(`${c.id} (text box covers the art window by ${Math.round(under)}px)`);
				}
				if (text) {
					// the text stays inside the box ...
					const out = text.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
					if (out > 1) bad.push(`${c.id} (text area leaves the box by ${Math.round(out)}px)`);
					// ... and when it does not all fit, the face says so (fade + ellipsis)
					if (text.scrollHeight > text.clientHeight + 1 && !flagged) bad.push(`${c.id} (text cut but not flagged clamped)`);
				}
			}
			holder.remove();
			return { boxed, expectedBoxed, bad, clamped };
		}, width);
		expect(result.boxed).toBeGreaterThan(90);
		expect(result.boxed, 'exactly the frame tier 1-3 cards are boxed').toBe(result.expectedBoxed);
		expect(result.bad, 'cards whose text runs out of the plate').toEqual([]);
		expect(result.clamped, 'cards whose text is clamped').toEqual(CLAMPED);
	});
}
