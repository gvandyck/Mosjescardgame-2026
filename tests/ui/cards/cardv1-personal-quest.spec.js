// Card frame v1 — the 12 starter Personal Quests (72-02, D-01) in the real hand: v1 face, type colour,
// labelled Needs / Pay / Roll blocks with the printed text, no clipping.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT } from './cardv1-helpers.js';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard, setHand } from '../helpers.js';

const MAIN = { PHYSICAL: 'rgb(194, 65, 12)', DIGITAL: 'rgb(14, 116, 144)', CREATIVE: 'rgb(162, 28, 175)' };
const SHOT = '.planning/phases/72-screens-for-the-new-design/shots/72-02-personal-quest-faces.png';

test.describe('card frame v1 — Personal Quest', () => {
  let pqs;
  test.beforeEach(async ({ page }) => {
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await seedOfflineSession(page);
    await page.goto(GAME_URL_TEST);
    await waitForBoard(page);
    pqs = await page.evaluate(async () => (await import('/src/data/personalQuests.js')).PERSONAL_QUESTS.map((c) => ({
      id: c.id, mosjeType: c.mosjeType, needsText: c.needsText, payText: c.payText, rollText: c.rollText,
    })));
    expect(pqs.length).toBe(12);
  });

  for (const type of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) {
    test(`${type} Personal Quests in the hand: v1 face, blocks equal the printed text, no clipping`, async ({ page }) => {
      const group = pqs.filter((c) => c.mosjeType === type);
      expect(group.length).toBe(4);
      await setHand(page, 'player_1', group.map((c) => c.id));
      await page.waitForTimeout(800);
      for (const c of group) {
        const card = page.locator(`.card-v1.hand-card[data-card-id="${c.id}"]`).first();
        await expect(card, `${c.id} is a v1 face`).toHaveCount(1);
        await expect(card).toHaveClass(/card--personal-quest/);
        const info = await card.evaluate((el) => {
          const face = el.querySelector('.cv1-face--2');
          const box = el.querySelector('.cv2-textbox');
          const blocks = [...el.querySelectorAll('[data-cv1-pq-block]')].map((b) => ({
            key: b.dataset.cv1PqBlock,
            label: b.querySelector('.cv2-block-label').textContent,
            text: b.querySelector('.cv2-block-text').textContent,
            bottom: b.getBoundingClientRect().bottom,
          }));
          const cs = getComputedStyle(face);
          return {
            clamped: face.dataset.cv1Clamped === 'true',
            main: cs.getPropertyValue('--cv1-main').trim(),
            pill: el.querySelector('.cv2-pill')?.textContent,
            pillBg: getComputedStyle(el.querySelector('.cv2-pill')).backgroundColor,
            blocks,
            boxBottom: box.getBoundingClientRect().bottom,
            textScroll: el.querySelector('.cv2-text').scrollHeight - el.querySelector('.cv2-text').clientHeight,
          };
        });
        const want = [['needs', 'Needs', c.needsText], ['pay', 'Pay', c.payText], ['roll', 'Roll', c.rollText]].filter((w) => w[2]);
        expect(info.blocks.map((b) => [b.key, b.label, b.text]), `${c.id} blocks`).toEqual(want);
        expect(info.clamped, `${c.id} clamped`).toBe(false);
        expect(info.textScroll, `${c.id} text cut`).toBeLessThanOrEqual(1);
        for (const b of info.blocks) expect(b.bottom, `${c.id} ${b.key} inside the box`).toBeLessThanOrEqual(info.boxBottom + 1);
        expect(info.pill).toBe('PERSONAL QUEST');
        expect(info.pillBg, `${c.id} type colour`).toBe(MAIN[type]);
      }
      if (type === 'PHYSICAL') {
        // hover one card: the hand is sunk by design, the dock then shows the full face
        await page.locator('.card-v1.hand-card[data-card-id="pq_knocked_down_not_out"]').hover({ position: { x: 60, y: 40 } });
        await page.waitForTimeout(900);
        fs.mkdirSync('.planning/phases/72-screens-for-the-new-design/shots', { recursive: true });
        await page.screenshot({ path: SHOT });
      }
    });
  }
});
