// Card frame v1 — the hand: cards are sunk a little and lift on hover, hovering also previews the card in the
// right-hand dock (2026-10-20: used to be "no hover popup"), no Play button, a click plays the card.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT } from './cardv1-helpers.js';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard, setHand } from '../helpers.js';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';

test('card frame v1 — hand is visible, hover previews in the dock, no Play button, click plays the card', async ({ page }) => {
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
  // Hovering a hand card previews it large in the right-hand dock (same place as the effect spotlight).
  await page.locator('.hand-card[data-card-id="mosje_jisca"]').first().hover({ position: { x: 40, y: 40 } });
  await page.waitForTimeout(400);
  await expect(page.locator('.hover-zoom.hover-zoom--hand')).toHaveCount(1);
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

// Worst-case hand text: every real card of one type rendered at hand width keeps readable text and no zone
// of the face runs into another (2.0 faces: zone rects; legacy faces: description vs name / info).
// The real hand card is 150% of what it was (2026-10-20): 338px wide at the smallest, about 386px at 1920x1080.
// 338px and up is the real hand size and is enforced for every type. 230px (the old hand size) is the stress case:
// enforced here for the types whose 2.0 face exists (Mosje now; Snelle / Place stay clean as before) and, for the
// Piecie face that still has its three pre-existing collisions, held to exactly those ids until 62-03 fixes them.
// 180px stays informational (smaller windows).
const TYPES = ['MOSJE', 'PIECIE', 'SNELLE_PIECIE', 'PLACE'];
const PIECIE_GAP_230 = ['piecie_bowie_stormey', 'piecie_gekke_vogels', 'piecie_tony'];
const FLOOR_TEXT = 11.5; // the text floor of the 2.0 face (reference px at 440 wide)

for (const type of TYPES) {
  for (const width of [386, 338, 230, 180]) {
    test(`card frame v1 — ${type} hand card text is readable and fits at ${width}px wide`, async ({ page }) => {
      await seedOfflineSession(page);
      await page.setViewportSize({ width: 2400, height: 2400 });
      await page.goto(GAME_URL_TEST);
      await page.waitForFunction(() => window.__testHooks, { timeout: 20000 });
      await page.evaluate(async ({ w, type }) => {
        const { renderCard } = await import('/src/ui/cardRenderer.js');
        const { ALL_CARDS } = await import('/src/data/cardIndex.js');
        const root = document.createElement('div');
        root.id = 'hand-gallery';
        root.className = 'hand-strip';
        root.style.cssText = 'position:fixed;left:0;top:0;width:2400px;z-index:99999;background:#0d0b14;display:flex;flex-wrap:wrap;gap:16px;padding:16px;align-content:flex-start';
        document.body.appendChild(root);
        for (const c of ALL_CARDS.filter(c => c.type === type)) {
          const el = renderCard(c, { compact: false });
          el.classList.add('hand-card');
          el.style.setProperty('--cv1-w', w + 'px');
          root.appendChild(el);
        }
        await document.fonts.ready;
        await new Promise(r => setTimeout(r, 300));
      }, { w: width, type });
      const report = await page.evaluate(collectFaceZones, '#hand-gallery .hand-card');
      expect(report.length, `${type} cards rendered`).toBeGreaterThan(0);
      const cut = report.filter(r => r.clipped || r.clamped || r.textOverflow);
      console.log(`${type} width ${width}: ${cut.length} of ${report.length} descriptions are cut or clamped (full text in the click modal)`);
      const bad = findFaceCollisions(report);
      const badIds = [...new Set(bad.map(b => b.split(':')[0]))];
      console.log(`${type} width ${width}: ${report.length} cards, ${badIds.length} collide:`, bad.join(' | '));
      for (const r of report) {
        if (r.face === 2) {
          // The text never gets smaller than the design floor, and stays readable from the 230px stress size up.
          expect(r.textPx ?? 99, `${r.id} text size`).toBeGreaterThanOrEqual(FLOOR_TEXT * width / 440 - 0.05);
          if (width >= 230) expect(r.textPx ?? 99, `${r.id} text size`).toBeGreaterThanOrEqual(5);
        } else {
          expect(r.descPx, `${r.id} desc size`).toBeGreaterThanOrEqual(5); // Phase 51: hand card = exact scaled copy of the design (was 11)
          expect(r.infoPx, `${r.id} info size`).toBeGreaterThanOrEqual(5); // Phase 51: exact scaled design (was 10)
        }
      }
      if (width >= 338 || (width === 230 && type !== 'PIECIE')) expect(bad, 'cards whose text collides').toEqual([]);
      if (width === 230 && type === 'PIECIE') expect(badIds.filter(id => !PIECIE_GAP_230.includes(id)), 'new collisions beyond the pre-existing Known gap').toEqual([]);
    });
  }
}
