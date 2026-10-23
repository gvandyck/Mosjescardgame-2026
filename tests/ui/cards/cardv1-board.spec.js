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
  // 2.0 Place tile: the PLACE pill, and no cost (already paid) or badge
  await expect(page.locator('#board-root .card-v1--field.card--place .cv2-pill').first()).toHaveText('PLACE');
  await expect(page.locator('#board-root .card-v1--field.card--place [data-cv1-cost]')).toHaveCount(0);
  await expect(page.locator('#board-root .card-v1--field.card--place .cv1-badge')).toHaveCount(0);
  for (const type of ['piecie', 'snelle', 'mosje']) {
    await expect(page.locator(`.hand-card.card-v1--full.card--${type}`).first()).toBeVisible();
  }
  await page.screenshot({ path: `${OUT}/board-all-types.png` });
});

test('card frame v1 — click-detail modal shows a large readable card', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 900 });
  await seedOfflineSession(page);
  await page.goto(GAME_URL_TEST);
  await waitForBoard(page);
  await setMosjeOnField(page, 'player_1', 0, 'mosje_coert_kasteluck', { mp: 30, level: 1 });
  await setHand(page, 'player_1', ['piecie_kannetje_melk', 'mosje_jisca']);
  await page.waitForTimeout(3500);

  // Field click -> detail modal with a large card (text >= 9px on screen, card >= 300px wide).
  await page.mouse.move(5, 300);
  await page.locator('.mosje-card--owned.card-v1--field').first().click();
  const modalCard = page.locator('.card-detail .cd-preview .card-v1--full');
  await expect(modalCard).toBeVisible();
  const box = await modalCard.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(300);
  const modalDescPx = await modalCard.locator('.cv2-text').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(modalDescPx).toBeGreaterThanOrEqual(9);
  await page.screenshot({ path: `${OUT}/detail-modal.png` });

  // D-09 panel under the header: rarity stars, no V4 "max N/deck" copy-limit text, Levels section with the lit row.
  const mosjePanel = page.locator('.card-detail .cv2-panel');
  await expect(mosjePanel).toBeVisible();
  await expect(mosjePanel.locator('.cv2-panel-line--rarity')).toHaveText(/^★+$/);
  await expect(page.locator('.card-detail .cd-level-row')).toHaveCount(3);
  await expect(page.locator('.card-detail .cd-level-row[data-lit="true"]')).toHaveCount(1);
  expect(await page.locator('.card-detail').innerText()).not.toMatch(/max \d|\/deck/);
  await page.locator('#modal-close-preview').click();
  await expect(page.locator('.card-detail')).toHaveCount(0);

  // A face-up Piecie on the field: its panel carries the Piecie reminder; the chips show Energy, never Free / N MP.
  await page.evaluate(() => window.__testHooks.setPiecieOnField('player_1', 0, 'piecie_kannetje_melk', { faceDown: false }));
  await page.waitForTimeout(800);
  await page.mouse.move(5, 300);
  await page.locator('#board-root .board-zone--player .field-piecie-card[data-card-id="piecie_kannetje_melk"]').first().click();
  const piecieModal = page.locator('.card-detail');
  await expect(piecieModal).toBeVisible();
  await expect(piecieModal.locator('.cv2-panel-line--reminder')).toHaveText('Place face-down for free. From your next turn, pay its cost to activate it.');
  await expect(piecieModal.locator('.cd-chip').first()).toHaveText('0 Energy');
  expect(await piecieModal.innerText()).not.toMatch(/max \d|\/deck/);
  expect(await piecieModal.locator('.cd-chips').innerText()).not.toMatch(/Free|Requires|Interrupt|\bMP\b/); // no V4 chips
  await page.screenshot({ path: `${OUT}/detail-modal-piecie.png` });
});

test('card audit page: no card has cut text without a clamp flag or a zone outside its card (2.0 faces)', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/card-audit.html');
  await page.waitForSelector('#audit-root .cell');
  await page.waitForTimeout(2500); // fonts + the per-card animation-frame checks
  expect(await page.locator('#audit-root .cell').count()).toBeGreaterThan(100);
  expect(await page.locator('#audit-root .cv1-face--2').count(), 'the audited cards are 2.0 faces').toBeGreaterThan(100);
  const problems = await page.locator('#problems').innerText();
  expect(await page.locator('#audit-root .cell.bad').count(), problems).toBe(0);
  expect(problems).toBe('');
});
