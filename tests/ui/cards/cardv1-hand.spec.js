// Card frame v1 — the hand: cards are fully visible (not sunk), no hover popup, a click opens the modal.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT } from './cardv1-helpers.js';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard, setHand } from '../helpers.js';

test('card frame v1 — hand is visible, has no hover popup, click opens the detail modal', async ({ page }) => {
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
  for (const b of boxes) expect(b.bottom).toBeLessThanOrEqual(900 + 2);
  await page.screenshot({ path: `${OUT}/hand-visible.png` });

  // Hovering a hand card does not open the enlarged popup.
  await page.locator('.hand-card[data-card-id="mosje_jisca"]').first().hover({ position: { x: 40, y: 40 } });
  await page.waitForTimeout(400);
  await expect(page.locator('.hover-zoom')).toHaveCount(0);

  // Clicking it opens the detail modal.
  await page.locator('.hand-card[data-card-id="mosje_jisca"]').first().click({ position: { x: 40, y: 40 } });
  await expect(page.locator('.card-detail')).toBeVisible();
  await page.screenshot({ path: `${OUT}/hand-click-modal.png` });
});
