// Shared helpers for the card frame v1 specs (render real cards in the live page).
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';

export const OUT = 'tests/ui/screenshots/cardv1';

export async function openGame(page) {
  await seedOfflineSession(page);
  await page.setViewportSize({ width: 2400, height: 2200 });
  await page.goto(GAME_URL_TEST);
  await page.waitForFunction(() => window.__testHooks, { timeout: 20000 });
}

// Renders the given cards into a gallery in the live page (mode: full or field).
export async function renderGallery(page, mode, widthPx, ids) {
  return page.evaluate(async ({ mode, widthPx, ids }) => {
    const { renderCard } = await import('/src/ui/cardRenderer.js');
    const { getCardById } = await import('/src/data/cardIndex.js');
    document.getElementById('cv1-gallery')?.remove();
    const root = document.createElement('div');
    root.id = 'cv1-gallery';
    root.style.cssText = 'position:fixed;left:0;top:0;width:2400px;min-height:2200px;z-index:99999;background:#0d0b14;display:flex;flex-wrap:wrap;gap:24px;padding:24px;align-content:flex-start';
    for (const id of ids) {
      const el = renderCard(getCardById(id), { compact: mode === 'field', fieldMode: mode === 'field' });
      el.style.setProperty('--cv1-w', `${widthPx}px`);
      el.dataset.testCard = id;
      root.appendChild(el);
    }
    document.body.appendChild(root);
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 400));
  }, { mode, widthPx, ids });
}
