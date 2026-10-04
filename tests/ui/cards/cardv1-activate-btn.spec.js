// Regression: the Activate button on a field Piecie tile must show its full label
// and must not overlap the kind pill ("CTIVAT" clipped, overlapping PIECIE).
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT } from './cardv1-helpers.js';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard, setHand, setMosjeOnField, playCardFromHand, endTurnAndWait, clearEntryProtection } from '../helpers.js';

test('Activate button on a field Piecie tile is fully visible and clear of the pill', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await seedOfflineSession(page);
  await page.goto(GAME_URL_TEST);
  await waitForBoard(page);
  await setMosjeOnField(page, 'player_1', 0, 'mosje_jisca', { mp: 45, level: 1 });
  await setHand(page, 'player_1', ['piecie_kannetje_melk']);
  await playCardFromHand(page, 'piecie_kannetje_melk');
  await endTurnAndWait(page);
  await clearEntryProtection(page);

  const btn = page.locator('#piecies-player .card-v1--field .hand-card__play-btn').first();
  await expect(btn).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: `${OUT}/activate-btn.png` });

  const m = await btn.evaluate((b) => {
    const tile = b.closest('.card-v1--field');
    const pill = tile.querySelector('.cv1-pill').getBoundingClientRect();
    const r = b.getBoundingClientRect();
    const t = tile.getBoundingClientRect();
    return {
      textClipped: b.scrollWidth > b.clientWidth + 1,
      overlapsPill: r.left < pill.right && r.right > pill.left && r.top < pill.bottom && r.bottom > pill.top,
      insideTile: r.left >= t.left && r.right <= t.right,
    };
  });
  expect(m.textClipped).toBe(false);
  expect(m.overlapsPill).toBe(false);
  expect(m.insideTile).toBe(true);
});
