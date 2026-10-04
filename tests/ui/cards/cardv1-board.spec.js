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

test('card frame v1 — hand hover popup and click-detail modal are readable', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 900 });
  await seedOfflineSession(page);
  await page.goto(GAME_URL_TEST);
  await waitForBoard(page);
  await setMosjeOnField(page, 'player_1', 0, 'mosje_coert_kasteluck', { mp: 30, level: 0 });
  await setHand(page, 'player_1', ['piecie_kannetje_melk', 'mosje_jisca']);
  await page.waitForTimeout(3500);

  // Hand hover: the enlarged card appears and its description is readable (>= 12px on screen).
  await page.locator('.hand-card[data-card-id="piecie_kannetje_melk"]').first().hover({ position: { x: 30, y: 30 } });
  const popup = page.locator('.hover-zoom .card-v1--full');
  await expect(popup).toBeVisible();
  const descPx = await popup.locator('.cv1-desc').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(descPx).toBeGreaterThanOrEqual(12);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/hand-hover-popup.png` });

  // Field click -> detail modal with a large card (text >= 9px on screen, card >= 300px wide).
  await page.mouse.move(5, 300);
  await page.locator('.mosje-card--owned.card-v1--field').first().click();
  const modalCard = page.locator('.card-detail .cd-preview .card-v1--full');
  await expect(modalCard).toBeVisible();
  const box = await modalCard.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(300);
  const modalDescPx = await modalCard.locator('.cv1-desc').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(modalDescPx).toBeGreaterThanOrEqual(9);
  await page.screenshot({ path: `${OUT}/detail-modal.png` });
});
