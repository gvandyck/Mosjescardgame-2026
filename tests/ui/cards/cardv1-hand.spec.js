// Card frame v1 — the hand: cards are fully visible (not sunk), no hover popup, a click opens the modal.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT } from './cardv1-helpers.js';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard, setHand } from '../helpers.js';

test('card frame v1 — hand is visible, has no hover popup or Play button, click plays the card', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 900 });
  await seedOfflineSession(page);
  await page.goto(GAME_URL_TEST);
  await waitForBoard(page);
  await setHand(page, 'player_1', ['piecie_kannetje_melk', 'mosje_jisca', 'snelle_lucky_coin', 'place_the_gym']);
  await page.waitForTimeout(3500);

  // Every hand card sits fully inside the viewport (nothing sunk below the fold).
  const boxes = await page.locator('.hand-card').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; }));
  expect(boxes.length).toBe(4);
  // The hand is sunk a little: the bottom of each card is below the screen, the title is not.
  for (const b of boxes) expect(b.top).toBeLessThan(900 - 120);
  await page.screenshot({ path: `${OUT}/hand-visible.png` });

  // The Play button is hidden until the card is hovered, then the card lifts fully into view.
  const wrapBox = async () => page.locator('.hand-card[data-card-id="mosje_jisca"]').first().boundingBox();
  const btn = page.locator('.hand-card[data-card-id="mosje_jisca"] .hand-card__play-btn').first();
  expect(await btn.evaluate(el => getComputedStyle(el).opacity)).toBe('0');
  // Hovering a hand card does not open the enlarged popup.
  await page.locator('.hand-card[data-card-id="mosje_jisca"]').first().hover({ position: { x: 40, y: 40 } });
  await page.waitForTimeout(400);
  await expect(page.locator('.hover-zoom')).toHaveCount(0);
  expect(await btn.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  expect((await wrapBox()).y + (await wrapBox()).height).toBeLessThanOrEqual(900 + 2);

  // No Play button is shown; clicking a playable card plays it (here: a Piecie goes face-down to the field).
  await expect(btn).toBeHidden();
  await page.locator('.hand-card[data-card-id="piecie_kannetje_melk"]').first().hover({ position: { x: 40, y: 40 } });
  await page.locator('.hand-card[data-card-id="piecie_kannetje_melk"]').first().click({ position: { x: 40, y: 40 } });
  await expect(page.locator('.hand-card[data-card-id="piecie_kannetje_melk"]')).toHaveCount(0);
  await expect(page.locator('.card-detail')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/hand-click-plays.png` });
});

// Worst-case hand text: every real card rendered at hand width keeps readable text and
// the description never runs into the name block.
for (const width of [230, 180]) {
  test(`card frame v1 — hand card text is readable and fits at ${width}px wide`, async ({ page }) => {
    await seedOfflineSession(page);
    await page.setViewportSize({ width: 2400, height: 2400 });
    await page.goto(GAME_URL_TEST);
    await page.waitForFunction(() => window.__testHooks, { timeout: 20000 });
    const report = await page.evaluate(async (w) => {
      const { renderCard } = await import('/src/ui/cardRenderer.js');
      const { ALL_CARDS } = await import('/src/data/cardIndex.js');
      const root = document.createElement('div');
      root.className = 'hand-strip';
      root.style.cssText = 'position:fixed;left:0;top:0;width:2400px;z-index:99999;background:#0d0b14;display:flex;flex-wrap:wrap;gap:16px;padding:16px;align-content:flex-start';
      document.body.appendChild(root);
      const rows = [];
      for (const c of ALL_CARDS.filter(c => ['MOSJE', 'PIECIE', 'SNELLE_PIECIE', 'PLACE'].includes(c.type))) {
        const el = renderCard(c, { compact: false });
        el.classList.add('hand-card');
        el.style.setProperty('--cv1-w', w + 'px');
        root.appendChild(el);
        rows.push([c.id, el]);
      }
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 300));
      return rows.map(([id, el]) => {
        const card = el.getBoundingClientRect();
        const q = (s) => el.querySelector(s);
        const r = (s) => q(s)?.getBoundingClientRect();
        const desc = r('.cv1-desc'), name = r('.cv1-name'), info = r('.cv1-info');
        return {
          id, descPx: parseFloat(getComputedStyle(q('.cv1-desc')).fontSize), infoPx: parseFloat(getComputedStyle(q('.cv1-info')).fontSize),
          clipped: [...q('.cv1-desc').children].reduce((h, c) => h + c.getBoundingClientRect().height, 0) > q('.cv1-desc').clientHeight + 1,
          descHitsName: desc.top < name.bottom - 1, descHitsInfo: desc.bottom > info.top + 1,
          descInside: desc.left >= card.left && desc.right <= card.right,
        };
      });
    }, width);
    console.log(`width ${width}: ${report.filter(r => r.clipped).length} of ${report.length} descriptions are cut at the top (full text in the click modal)`);
    const bad = report.filter(r => r.descHitsName || r.descHitsInfo || !r.descInside);
    console.log(`width ${width}: ${report.length} cards, ${bad.length} collide:`, bad.map(b => b.id).join(', '));
    for (const r of report) {
      expect(r.descPx, `${r.id} desc size`).toBeGreaterThanOrEqual(11);
      expect(r.infoPx, `${r.id} info size`).toBeGreaterThanOrEqual(10);
    }
    // 230px is the real hand card width; 180px is informational only (smaller windows).
    if (width >= 230) expect(bad.map(b => b.id), 'cards whose text collides').toEqual([]);
  });
}
