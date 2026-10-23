// Phase 62-07 — Phase 7 section A10 Playwright checks for the 2.0 card faces, at 1920x1080, with screenshots for Gandalf
// (tests/ui/screenshots/cardv1/a10-*.png). DOM / geometry / pixel assertions only, no pixel baselines.
// Out of scope here: the Fresh / Protected badge item of A10 (Phase 63 owns the badges and their tests).
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT, openGame } from './cardv1-helpers.js';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard, setHand, setMosjeOnField, clearEntryProtection } from '../helpers.js';
import { CARD_ID_MAP } from '../../../scripts/obby2/cardIdMap.mjs';
import { samplePixels } from '../../helpers/samplePixels.js';
import { contrastRatio, compositeOver } from '../../helpers/contrast.js';
import { DIM_ROW_OPACITY } from '../../../src/ui/cardV1/faceTokens.js';

const STACK_COLOR = { FIGHTING: 'rgb(194, 65, 12)', DIGITAL: 'rgb(14, 116, 144)', ARTISTIC: 'rgb(162, 28, 175)' };
const WHITE = [255, 255, 255];

async function openBoard(page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await seedOfflineSession(page);
  await page.goto(GAME_URL_TEST);
  await waitForBoard(page);
  fs.mkdirSync(OUT, { recursive: true });
}

// A mixed gallery: items = [{ id, mode: 'full' | 'field', width, patch }]; patch merges into the card (live state such as failTokens).
async function renderItems(page, items, { width = 2400, height = 1400 } = {}) {
  await page.setViewportSize({ width, height });
  await page.evaluate(async ({ items, width, height }) => {
    const { renderCard } = await import('/src/ui/cardRenderer.js');
    const { getCardById } = await import('/src/data/cardIndex.js');
    document.getElementById('cv1-gallery')?.remove();
    const root = document.createElement('div');
    root.id = 'cv1-gallery';
    root.style.cssText = `position:fixed;left:0;top:0;width:${width}px;min-height:${height}px;z-index:99999;background:#0d0b14;display:flex;flex-wrap:wrap;gap:24px;padding:24px;align-content:flex-start;align-items:flex-start`;
    items.forEach((item, i) => {
      const field = item.mode === 'field';
      const el = renderCard({ ...getCardById(item.id), ...(item.patch || {}) }, { compact: field, fieldMode: field });
      el.style.setProperty('--cv1-w', `${item.width}px`);
      el.dataset.testCard = item.key || `${item.id}#${i}`;
      root.appendChild(el);
    });
    document.body.appendChild(root);
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 400));
  }, { items, width, height });
}

const card = (page, key) => page.locator(`#cv1-gallery [data-test-card="${key}"]`);

test.describe('A10 — 2.0 card faces at 1920x1080', () => {
  test('A10 Mosje pop-up lights the current level row after a level-up', async ({ page }) => {
    await openBoard(page);
    await clearEntryProtection(page);
    await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 90, level: 1 });
    await page.waitForTimeout(4000); // intro overlays
    const tile = page.locator('.mosje-card--owned.card-v1--field').first();
    const dock = page.locator('.hover-zoom');
    await page.mouse.move(5, 500);

    // Level 1: the dock card lights row 1, Power 20, chip LVL 1.
    await tile.hover();
    await expect(dock).toBeVisible();
    await expect(dock.locator('[data-cv1-level-row="1"]')).toHaveAttribute('data-lit', 'true');
    await expect(dock.locator('[data-cv1-level-row="2"]')).toHaveAttribute('data-lit', 'false');
    await expect(dock.locator('[data-cv1-level-row="3"]')).toHaveAttribute('data-lit', 'false');
    await expect(dock.locator('[data-cv1-power]')).toHaveAttribute('data-cv1-power', '20');
    await expect(dock.locator('.cv2-lvl-chip')).toHaveText('LVL 1');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/a10-mosje-l1.png` });
    await page.mouse.move(5, 500);
    await expect(dock).toHaveCount(0);

    // The level-up (test hook): row 2 is lit with the level 2 Power.
    await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50, level: 2 });
    await page.waitForTimeout(800);
    await tile.hover();
    await expect(dock).toBeVisible();
    await expect(dock.locator('[data-cv1-level-row="2"]')).toHaveAttribute('data-lit', 'true');
    await expect(dock.locator('[data-cv1-level-row="1"]')).toHaveAttribute('data-lit', 'false');
    await expect(dock.locator('[data-cv1-level-row="3"]')).toHaveAttribute('data-lit', 'false');
    await expect(dock.locator('[data-cv1-power]')).toHaveAttribute('data-cv1-power', '30');
    await expect(dock.locator('.cv2-lvl-chip')).toHaveText('LVL 2');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/a10-mosje-l2.png` });
    await page.mouse.move(5, 500);
    await expect(dock).toHaveCount(0);

    // The detail view's card lights row 2 as well.
    await tile.click();
    const detail = page.locator('.card-detail .cd-preview .card-v1--full');
    await expect(detail).toBeVisible();
    await expect(detail.locator('[data-cv1-level-row="2"]')).toHaveAttribute('data-lit', 'true');
    await expect(detail.locator('[data-cv1-level-row="1"]')).toHaveAttribute('data-lit', 'false');
    await expect(detail.locator('[data-cv1-power]')).toHaveAttribute('data-cv1-power', '30');
    await expect(detail.locator('.cv2-lvl-chip')).toHaveText('LVL 2');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/a10-mosje-detail.png` });
    await page.locator('#modal-close-preview').click();
    await expect(page.locator('.card-detail')).toHaveCount(0);

    // A Mosje in the hand has no live state: row 1 is lit, in the hand and in its dock preview.
    await setHand(page, 'player_1', ['mosje_jisca']);
    const hand = page.locator('.hand-card[data-card-id="mosje_jisca"]').first();
    await expect(hand).toBeVisible();
    await expect(hand.locator('[data-cv1-level-row="1"]')).toHaveAttribute('data-lit', 'true');
    await expect(hand.locator('[data-cv1-level-row="2"]')).toHaveAttribute('data-lit', 'false');
    await hand.hover({ position: { x: 40, y: 40 } });
    await expect(dock).toHaveCount(1);
    await expect(dock.locator('[data-cv1-level-row="1"]')).toHaveAttribute('data-lit', 'true');
    await expect(dock.locator('[data-cv1-level-row="3"]')).toHaveAttribute('data-lit', 'false');
  });

  test('A10 Place shows its Energy cost', async ({ page }) => {
    await openGame(page);
    const placeIds = Object.values(CARD_ID_MAP.places);
    expect(placeIds.length).toBe(20);
    await renderItems(page, placeIds.map((id) => ({ id, mode: 'full', width: 440, key: id })), { width: 2400, height: 2900 });
    const corners = await page.evaluate(async (ids) => {
      const { getCardById } = await import('/src/data/cardIndex.js');
      return ids.map((id) => {
        const el = document.querySelector(`#cv1-gallery [data-test-card="${id}"]`);
        return { id, printed: String(getCardById(id).cost), hook: el.querySelector('.cv2-corner')?.dataset.cv1Cost, text: el.querySelector('.cv2-corner-val')?.textContent, label: el.querySelector('.cv2-corner-label')?.textContent };
      });
    }, placeIds);
    for (const c of corners) {
      expect(c.hook, `${c.id} data-cv1-cost`).toBe(c.printed);
      expect(c.text, `${c.id} corner value`).toBe(c.printed);
      expect(c.label, `${c.id} corner label`).toBe('COST');
    }
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/a10-place-gallery.png` });

    // On the board: the hover popup shows the cost, the Place tile itself does not (the cost is already paid).
    await openBoard(page);
    await page.evaluate(() => window.__testHooks.setActivePlace('place_the_gym', 'player_1'));
    await page.mouse.move(5, 5);
    await page.waitForTimeout(800);
    const tile = page.locator('#board-root .card-v1--field.card--place[data-card-id="place_the_gym"]').first();
    await expect(tile).toBeVisible();
    expect(await tile.locator('.cv2-corner, [data-cv1-cost]').count(), 'the Place tile shows no cost').toBe(0);
    await tile.hover();
    const dock = page.locator('.hover-zoom');
    await expect(dock).toBeVisible();
    await expect(dock.locator('.cv2-corner')).toHaveAttribute('data-cv1-cost', '3');
    await expect(dock.locator('.cv2-corner-val')).toHaveText('3');
    await expect(dock.locator('.cv2-corner-label')).toHaveText('COST');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/a10-place-board.png` });
  });

  test('A10 Quest shows stack colour, need, win / lose and fail pips', async ({ page }) => {
    await openGame(page);
    const quests = ['quest_arm_wrestling', 'quest_debug_system', 'quest_leap_of_faith'];
    const items = quests.map((id) => ({ id, mode: 'full', width: 440, key: `pop-${id}` }));
    for (const n of [0, 1, 2]) items.push({ id: 'quest_arm_wrestling', mode: 'field', width: 240, patch: { failTokens: n }, key: `tile-${n}` });
    await renderItems(page, items, { width: 2000, height: 760 });

    const expected = {
      quest_arm_wrestling: { stack: 'FIGHTING', need: '2× 4+', needLabel: 'NEED', win: '40', lose: '-30' },
      quest_debug_system: { stack: 'DIGITAL', need: '★★', needLabel: 'TRAINED', win: '25', lose: 'none' },
      quest_leap_of_faith: { stack: 'ARTISTIC', need: '4+', needLabel: 'COIN', win: '50', lose: '-25' },
    };
    for (const id of quests) {
      const q = card(page, `pop-${id}`);
      const e = expected[id];
      const pill = q.locator('.cv2-footer-pill');
      await expect(pill, `${id} pill`).toHaveText(`${e.stack} QUEST`);
      expect(await pill.evaluate((el) => getComputedStyle(el).backgroundColor), `${id} stack colour`).toBe(STACK_COLOR[e.stack]);
      await expect(q.locator('.cv2-corner'), `${id} need`).toHaveAttribute('data-cv1-need', e.need);
      await expect(q.locator('.cv2-corner-label'), `${id} need label`).toHaveText(e.needLabel);
      await expect(q.locator('[data-cv1-win]'), `${id} win hook`).toHaveAttribute('data-cv1-win', e.win);
      await expect(q.locator('[data-cv1-lose]'), `${id} lose hook`).toHaveAttribute('data-cv1-lose', e.lose);
      await expect(q.locator('.cv2-stat--left .cv2-stat-val'), `${id} WIN number`).toHaveText(`+${e.win}`);
      if (e.lose === 'none') await expect(q.locator('.cv2-stat--right .cv2-stat-val'), `${id} cannot fail`).toHaveText("can't fail");
      else await expect(q.locator('.cv2-stat--right .cv2-stat-val'), `${id} LOSE number`).toHaveText(`−${Math.abs(Number(e.lose))}`);
    }

    // The tile: 2 fail pips, 0 / 1 / 2 of them filled, plus need, WIN and LOSE.
    for (const n of [0, 1, 2]) {
      const t = card(page, `tile-${n}`);
      await expect(t.locator('[data-cv1-pip]'), `tile ${n}: pips`).toHaveCount(2);
      await expect(t.locator('[data-cv1-pip="filled"]'), `tile ${n}: filled pips`).toHaveCount(n);
      await expect(t.locator('[data-cv1-pip="empty"]'), `tile ${n}: empty pips`).toHaveCount(2 - n);
      await expect(t.locator('[data-cv1-need]')).toHaveAttribute('data-cv1-need', '2× 4+');
      await expect(t.locator('[data-cv1-win]')).toHaveAttribute('data-cv1-win', '40');
      await expect(t.locator('[data-cv1-lose]')).toHaveAttribute('data-cv1-lose', '-30');
    }
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/a10-quest.png` });
  });

  test('A10 Piecie shows its Needs line and STAYS chip', async ({ page }) => {
    await openGame(page);
    const ids = ['piecie_dikke_taks', 'piecie_bowie_stormey', 'piecie_kannetje_melk'];
    await renderItems(page, ids.map((id) => ({ id, mode: 'full', width: 440, key: id })), { width: 1600, height: 760 });

    const dikke = card(page, 'piecie_dikke_taks');
    await expect(dikke.locator('.cv2-info')).toHaveText('Needs: one of your Mosjes at Level 2+');
    await expect(dikke.locator('[data-cv1-stays]')).toHaveCount(0);

    const bowie = card(page, 'piecie_bowie_stormey');
    await expect(bowie.locator('.cv2-pills [data-cv1-stays="true"]')).toHaveText('STAYS');
    await expect(bowie.locator('.cv2-info'), 'no requirement, no Needs line').toHaveCount(0);
    await expect(bowie.locator('.cv2-label')).toHaveText('Pet');

    const melk = card(page, 'piecie_kannetje_melk');
    await expect(melk.locator('.cv2-corner')).toHaveAttribute('data-cv1-cost', '0');
    await expect(melk.locator('.cv2-corner-val')).toHaveText('0');
    await expect(melk.locator('.cv2-label')).toHaveText('Food');
    await expect(melk.locator('.cv2-info')).toHaveCount(0);
    await expect(melk.locator('[data-cv1-stays]')).toHaveCount(0);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/a10-piecie.png` });

    // On the board a face-up staying Piecie shows the STAYS chip on its tile.
    await openBoard(page);
    await page.evaluate(() => window.__testHooks.setPiecieOnField('player_1', 0, 'piecie_bowie_stormey', { faceDown: false }));
    await page.mouse.move(5, 5);
    await page.waitForTimeout(800);
    const tile = page.locator('#board-root .board-zone--player .field-piecie-card[data-card-id="piecie_bowie_stormey"]').first();
    await expect(tile).toBeVisible();
    await expect(tile.locator('[data-cv1-stays="true"]')).toHaveText('STAYS');
    await expect(tile.locator('.cv2-pill')).toHaveText('PIECIE');
    expect(await tile.locator('[data-cv1-cost]').count(), 'the Piecie tile shows no cost').toBe(0);
    await page.screenshot({ path: `${OUT}/a10-piecie-tile.png` });
  });

  test('A10 frosted text box keeps 4.5:1 over white art (and the dimmed level rows)', async ({ page }) => {
    await openGame(page);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#ffffff"/></svg>';
    const whiteArt = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    const ids = ['mosje_alyssa_bulldozer', 'piecie_kannetje_melk'];
    await renderItems(page, ids.map((id) => ({ id, mode: 'full', width: 440, patch: { artPath: whiteArt }, key: id })), { width: 1100, height: 760 });

    // Glyph-free probe points (relative to the card), checked with Range rects so no letter sits on them.
    const probe = await page.evaluate(() => {
      const out = {};
      for (const el of document.querySelectorAll('#cv1-gallery [data-test-card]')) {
        const c = el.getBoundingClientRect();
        const inGlyph = (x, y, nodes) => nodes.some((n) => {
          const r = document.createRange();
          r.selectNodeContents(n);
          return [...r.getClientRects()].some((g) => x >= g.left - 1 && x <= g.right + 1 && y >= g.top - 1 && y <= g.bottom + 1);
        });
        const textNodes = [...el.querySelectorAll('.cv2-text, .cv2-level-row')];
        const tb = el.querySelector('.cv2-textbox').getBoundingClientRect();
        const box = { x: tb.left + tb.width / 2, y: tb.top + 5 }; // inside the 12px top padding of the text box
        const dim = el.querySelector('.cv2-level-row[data-lit="false"]');
        let level = null;
        if (dim) {
          const r = dim.getBoundingClientRect();
          level = { x: r.left + 3, y: r.top + r.height / 2 }; // the row's 8px left padding, left of its first letter
        }
        const tbArt = el.querySelector('.cv1-window')?.getBoundingClientRect();
        out[el.dataset.testCard] = {
          box: [box.x - c.left, box.y - c.top],
          boxGlyph: inGlyph(box.x, box.y, textNodes),
          level: level && [level.x - c.left, level.y - c.top],
          levelGlyph: level ? inGlyph(level.x, level.y, textNodes) : null,
          boxOverArt: !!tbArt && tb.top < tbArt.bottom - 1, // does the text box overlap the art window?
        };
      }
      return out;
    });

    const report = [];
    for (const id of ids) {
      const p = probe[id];
      expect(p.boxGlyph, `${id}: the text box probe point is glyph free`).toBe(false);
      const el = card(page, id);
      const points = [p.box, ...(p.level ? [p.level] : [])];
      const px = await samplePixels(page, el, points);
      const boxBg = px[0];
      const boxRatio = contrastRatio(WHITE, boxBg);
      let line = `${id} (${p.boxOverArt ? 'text box over the art' : 'text box under the art window'}): text box bg rgb(${boxBg.map(Math.round)}) ratio ${boxRatio.toFixed(2)}:1`;
      expect(boxRatio, `${id}: white text on the frosted box`).toBeGreaterThanOrEqual(4.5);
      if (id === 'mosje_alyssa_bulldozer') {
        // full art: the box really sits on the white art (worst case), so the blur + tint must carry the contrast
        expect(p.boxOverArt, `${id}: the text box sits over the art`).toBe(true);
        expect(boxBg[0], `${id}: white art shows through the box (backdrop is bright)`).toBeGreaterThan(60);
        expect(p.level, `${id}: has a dimmed level row`).not.toBeNull();
        expect(p.levelGlyph, `${id}: the level probe point is glyph free`).toBe(false);
        const levelBg = px[1];
        const dimText = compositeOver(WHITE, DIM_ROW_OPACITY, levelBg);
        const dimRatio = contrastRatio(dimText, levelBg);
        line += `; level block bg rgb(${levelBg.map(Math.round)}), dim row text rgb(${dimText.map(Math.round)}) ratio ${dimRatio.toFixed(2)}:1`;
        expect(dimRatio, `${id}: dimmed level rows`).toBeGreaterThanOrEqual(4.5);
      } else {
        expect(p.level, `${id}: a Piecie has no level rows`).toBeNull();
      }
      report.push(line);
    }
    console.log(`A10 contrast over pure white art:\n  ${report.join('\n  ')}`);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/a10-contrast.png` });
  });
});
