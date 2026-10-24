// Regression: the Activate chip in a field Piecie's action tray must show its full label ("Activate · N Energy"), be a big
// enough tap target, and not be covered by the hand ("CTIVAT" clipped / overlapping the pill was the old tile-button bug).
// 63-06: the tile no longer carries an Activate button; Activate is a chip in the tray that opens when the Piecie is tapped.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT } from './cardv1-helpers.js';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';
import { tapOwnCard } from '../../helpers/boardTaps.js';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard, setHand, setMosjeOnField, playCardFromHand, endTurnAndWait, clearEntryProtection } from '../helpers.js';

const PIECIE = 'piecie_ronald_kip'; // costs 2 Energy: the chip label carries the cost

test('Activate chip in a field Piecie tray is fully visible, big enough and not covered by the hand', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1920, height: 1080 }); // the 2.0 board is judged at Full HD (was 1600x1000)
  await seedOfflineSession(page);
  await page.goto(GAME_URL_TEST);
  await waitForBoard(page);
  await setMosjeOnField(page, 'player_1', 0, 'mosje_jisca', { mp: 45, level: 1 });
  await setHand(page, 'player_1', [PIECIE]);
  await playCardFromHand(page, PIECIE);
  await endTurnAndWait(page);
  await clearEntryProtection(page);

  await tapOwnCard(page, 'piecie', PIECIE);
  const chip = page.locator('[data-action-tray] [data-action="activate"]');
  await expect(chip).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: `${OUT}/activate-btn.png` });

  await expect(chip, 'the label carries the Energy cost').toHaveText(/^Activate · \d+ Energy$/);
  const m = await chip.evaluate((b) => {
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { textClipped: b.scrollWidth > b.clientWidth + 1, height: r.height, width: r.width, coveredBy: hit && !b.contains(hit) ? hit.className || hit.tagName : null };
  });
  expect(m.textClipped, 'the chip label is not clipped').toBe(false);
  expect(m.height, 'chip is at least 44 px tall').toBeGreaterThanOrEqual(44);
  expect(m.coveredBy, 'nothing (the hand) covers the chip at its centre').toBeNull();
  // 2.0 tile: no button on the tile any more, and the tile zones stay clear of each other and inside the tile
  expect(await page.locator('#piecies-player .card-v1--field button').count(), 'the Piecie tile carries no button').toBe(0);
  const zones = await page.evaluate(collectFaceZones, '#piecies-player .card-v1--field');
  expect(findFaceCollisions(zones), 'tile zones that collide or leave the tile').toEqual([]);
});
