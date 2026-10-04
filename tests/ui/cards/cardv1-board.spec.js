// Card frame v1 — one live board with every card type: hand (Mosje, Piecie, Snelle, Place),
// an active Place on the field and a Mosje tile. Screenshot only + basic assertions.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT } from './cardv1-helpers.js';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard, setHand, setMosjeOnField, playCardFromHand } from '../helpers.js';

test('card frame v1 — live board with all card types', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await seedOfflineSession(page);
  await page.goto(GAME_URL_TEST);
  await waitForBoard(page);
  await setMosjeOnField(page, 'player_1', 0, 'mosje_jisca', { mp: 45, level: 1 });
  await setHand(page, 'player_1', ['place_the_gym', 'piecie_kannetje_melk', 'snelle_lucky_coin', 'mosje_alyssa_bulldozer']);
  await playCardFromHand(page, 'place_the_gym');
  await page.waitForTimeout(4000);

  await expect(page.locator('#board-root .card-v1--field.card--place').first()).toBeVisible();
  await expect(page.locator('#board-root .card-v1--field.card--place .cv1-badge')).toHaveCount(0);
  for (const type of ['piecie', 'snelle', 'mosje']) {
    await expect(page.locator(`.hand-card.card-v1--full.card--${type}`).first()).toBeVisible();
  }
  await page.screenshot({ path: `${OUT}/board-all-types.png` });
});
