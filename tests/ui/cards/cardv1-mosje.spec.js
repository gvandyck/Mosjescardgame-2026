// Card frame v1 — Mosje faces rendered from REAL game data in the real browser.
// Renders pop-up (440x660), field tile (240x176) and a small hand-size face for the
// HANDOFF section 8 test cards, asserts the layout rules, and saves screenshots +
// a metrics report to tests/ui/screenshots/cardv1/.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';
import { openOwnDetails } from '../../helpers/boardTaps.js';

const OUT = 'tests/ui/screenshots/cardv1';

// name fragment -> why it is in the set
const TEST_CARDS = [
  ['Alyssa, The Bulldozer', '3-effect card'],
  ['Ronald, The Master Chef', '2-effect card'],
  ['Jisca, The Maestro', 'longest text stress test'],
  ['FPS Coert', 'no nickname'],
  ['Dancing/DDR Chris', 'long first name, no nickname'],
  ['Parkour West, The Flow Fighter', 'long first name + nickname'],
  ['[...], The Hacker', 'placeholder first name + nickname'],
];

async function openGame(page) {
  await seedOfflineSession(page);
  await page.setViewportSize({ width: 2400, height: 2200 });
  await page.goto(GAME_URL_TEST);
  await page.waitForFunction(() => window.__testHooks, { timeout: 20000 });
}

// Renders every wanted Mosje into a gallery in the live page; returns card ids.
async function renderGallery(page, mode, widthPx, ids) {
  return page.evaluate(async ({ mode, widthPx, ids }) => {
    const { renderCard } = await import('/src/ui/cardRenderer.js');
    const { getCardById } = await import('/src/data/cardIndex.js');
    let root = document.getElementById('cv1-gallery');
    if (root) root.remove();
    root = document.createElement('div');
    root.id = 'cv1-gallery';
    root.style.cssText = 'position:fixed;left:0;top:0;width:2400px;min-height:2200px;z-index:99999;background:#0d0b14;display:flex;flex-wrap:wrap;gap:24px;padding:24px;align-content:flex-start';
    for (const id of ids) {
      const el = renderCard(getCardById(id), { compact: mode === 'field', fieldMode: mode === 'field' });
      el.style.setProperty('--cv1-w', `${widthPx}px`);
      el.dataset.testCard = id;
      root.appendChild(el);
    }
    document.body.appendChild(root);
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 400));
  }, { mode, widthPx, ids });
}

test.describe('card frame v1 — Mosje', () => {
  let ids;
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    ids = await page.evaluate(async (wanted) => {
      const { getCardsByType } = await import('/src/data/cardIndex.js');
      const mosjes = getCardsByType('MOSJE');
      const out = wanted.map(([name]) => mosjes.find(c => c.name === name)?.id);
      for (const sub of ['FIGHTING', 'DIGITAL', 'ARTISTIC']) {
        const c = mosjes.find(m => m.subtype === sub && !out.includes(m.id));
        if (c) out.push(c.id);
      }
      // longest nickname
      const nick = (c) => (c.name.match(/^\[.+?\],?\s*(.*)/) || c.name.match(/^[^,]*,\s*(.*)/) || [])[1] || '';
      out.push([...mosjes].sort((a, b) => nick(b).length - nick(a).length)[0].id);
      return out;
    }, TEST_CARDS);
    expect(ids.every(Boolean)).toBe(true);
    fs.mkdirSync(OUT, { recursive: true });
  });

  test('pop-up mode 440x660: 2.0 zones, no collisions + screenshot', async ({ page }) => {
    await renderGallery(page, 'full', 440, ids);
    const report = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    // Per card: the printed Energy cost (card data) next to what the face shows, the level rows, the font.
    const extra = await page.evaluate(async () => {
      const { getCardById } = await import('/src/data/cardIndex.js');
      return [...document.querySelectorAll('#cv1-gallery [data-test-card]')].map((card) => ({
        id: card.dataset.testCard,
        printedCost: String(getCardById(card.dataset.testCard).cost),
        shownCost: card.querySelector('.cv2-corner')?.dataset.cv1Cost,
        costText: card.querySelector('.cv2-corner-val')?.textContent,
        rows: [...card.querySelectorAll('.cv2-level-row')].map((r) => r.dataset.lit),
        fonts: getComputedStyle(card.querySelector('.cv2-first')).fontFamily,
      }));
    });
    // fonts must come from the self-hosted files (gstatic is blocked in this suite)
    expect(await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))).toEqual(expect.arrayContaining(['Sora', 'DM Sans']));
    fs.writeFileSync(`${OUT}/mosje-popup-metrics.json`, JSON.stringify(report.map((r, i) => ({ ...r, ...extra[i] })), null, 2));
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-popup.png` });

    expect(findFaceCollisions(report), 'zones that collide or leave the card').toEqual([]);
    for (const [i, row] of report.entries()) {
      expect(row.face, `${row.id} uses the 2.0 face`).toBe(2);
      // the cost block, name and text box start on their specified x (reference 42 / 120 / 30)
      expect(Math.abs(row.zones.corner.l - 42), `${row.id} corner left`).toBeLessThanOrEqual(1);
      expect(Math.abs(row.zones.name.l - 120), `${row.id} name left`).toBeLessThanOrEqual(1);
      expect(Math.abs(row.zones.textbox.l - 30), `${row.id} text box left`).toBeLessThanOrEqual(1);
      // cost = the card's Energy cost, shown as a number (0 stays "0")
      expect(extra[i].shownCost, `${row.id} data-cv1-cost`).toBe(extra[i].printedCost);
      expect(extra[i].costText, `${row.id} cost text`).toBe(extra[i].printedCost);
      // 3 level rows with row 1 lit when there is no live state
      expect(extra[i].rows, `${row.id} level rows`).toEqual(['true', 'false', 'false']);
      expect(row.rowOverflow, `${row.id} level row cut off`).toBe(false);
      // first name never wraps/clips and respects the 22px minimum
      expect(row.firstOverflow, `${row.id} first name overflow`).toBe(false);
      expect(row.firstPx, `${row.id} first name size`).toBeGreaterThanOrEqual(22);
      // text that does not fit is flagged (collisions helper) and the face is not left with overflowing text unflagged
      expect(row.textPx, `${row.id} text size`).toBeGreaterThanOrEqual(11.5);
    }
  });

  test('field mode 240x176 + hand sizes: 3 level rows at 230, only the lit one below 150', async ({ page }) => {
    await renderGallery(page, 'field', 240, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-field.png` });
    // 2.0 tile: name + nickname, L chip, Power box and MP box are all there, and no two of them overlap.
    const tiles = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    expect(tiles.length).toBe(ids.length);
    for (const t of tiles) {
      expect(t.tile, `${t.id} is a 2.0 field tile`).toBe(true);
      for (const zone of ['name', 'lvl', 'power', 'mp']) expect(t.zones[zone], `${t.id} tile ${zone}`).not.toBeNull();
    }
    expect(findFaceCollisions(tiles), 'tile zones that collide or leave the tile at 240').toEqual([]);
    await renderGallery(page, 'field', 120, ids);
    expect(findFaceCollisions(await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]')), 'tile zones that collide at 120').toEqual([]);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-field-120.png` });
    // Hand stress size: every Mosje shows all 3 level rows (row 1 lit) and nothing collides.
    await renderGallery(page, 'full', 230, ids);
    const hand = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    expect(findFaceCollisions(hand), 'zones that collide at 230').toEqual([]);
    for (const row of hand) {
      expect(row.visibleRows, `${row.id} visible rows at 230`).toBe(3);
      expect(row.litRows, `${row.id} lit row at 230`).toEqual(['1']);
    }
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-hand-230.png` });
    // Below 150 the 3 rows collapse to the lit one only; still no overlap.
    await renderGallery(page, 'full', 140, ids);
    const small = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    expect(findFaceCollisions(small), 'zones that collide at 140').toEqual([]);
    for (const row of small) {
      expect(row.visibleRows, `${row.id} visible rows at 140`).toBe(1);
      expect(row.litRows, `${row.id} lit row at 140`).toEqual(['1']);
    }
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-small.png` });
    await renderGallery(page, 'field', 150, ids);
    expect(findFaceCollisions(await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]')), 'tile zones that collide at 150').toEqual([]);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-field-board-size.png` });
  });

  test('very long ability text clamps (fade + ellipsis), the 3 level rows stay, the detail view never clamps', async ({ page }) => {
    // No real Mosje is long enough to clamp, so this synthetic one proves the path: 10 long sentences.
    await page.evaluate(async () => {
      const { renderCard } = await import('/src/ui/cardRenderer.js');
      const { getCardById } = await import('/src/data/cardIndex.js');
      const long = Array.from({ length: 10 }, (_, i) => `Clause ${i + 1} of an absurdly long ability: when this Mosje does something clever it gains 25 MP and draws a card.`).join(' ');
      const root = document.createElement('div');
      root.id = 'cv1-gallery';
      root.style.cssText = 'position:fixed;left:0;top:0;width:2400px;min-height:2200px;z-index:99999;background:#0d0b14;display:flex;gap:24px;padding:24px;align-items:flex-start';
      for (const [id, w, detail] of [['clamp-440', 440, false], ['clamp-230', 230, false], ['detail-440', 440, true]]) {
        const el = renderCard({ ...getCardById('mosje_alyssa_bulldozer'), abilityDescription: long }, { compact: false });
        el.style.setProperty('--cv1-w', `${w}px`);
        el.dataset.testCard = id;
        if (detail) { const wrap = document.createElement('div'); wrap.className = 'card-detail'; wrap.append(el); root.append(wrap); } else root.append(el);
      }
      document.body.append(root);
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 400));
    });
    const rows = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    const byId = Object.fromEntries(rows.map(r => [r.id, r]));
    for (const id of ['clamp-440', 'clamp-230']) {
      const r = byId[id];
      expect(r.clamped, `${id} flagged clamped`).toBe(true);
      expect(r.textOverflow, `${id} text really overflows its box`).toBe(true);
      expect(r.textPx, `${id} clamps at the floor size`).toBeCloseTo(11.5 * r.width / 440, 1);
      expect(r.visibleRows, `${id} keeps all 3 level rows`).toBe(3);
      expect(r.zones.textbox.b - r.zones.textbox.t, `${id} text box stays within 46% of the card`).toBeLessThanOrEqual(304 * r.width / 440 + 1);
      expect(r.zones.textbox.t, `${id} text box stays below the name`).toBeGreaterThan(r.zones.name.b);
    }
    expect(findFaceCollisions(rows.filter(r => r.id.startsWith('clamp'))), 'clamped faces: flagged, no collisions').toEqual([]);
    const ellipsis = await page.evaluate(() => getComputedStyle(document.querySelector('[data-test-card="clamp-440"] .cv2-text'), '::after').content);
    expect(ellipsis).toContain('…');
    // The detail view shows every word: no clamp fade, nothing cut.
    const d = byId['detail-440'];
    expect(d.textOverflow, 'detail view never cuts text').toBe(false);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-test-card="detail-440"] .cv2-text'), '::after').display)).toBe('none');
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-clamped.png` });
  });

  test('live game: board tile + hand + preview follow game state', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForSelector('.mosje-card--owned', { timeout: 15000 });
    await page.evaluate(() => {
      window.__testHooks.clearEntryProtection();
      window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_alyssa_bulldozer', { mp: 35, level: 1 });
      window.__testHooks.setMosjeOnField('player_1', 1, 'mosje_ronald_chef', { mp: 60, level: 1 });
      window.__testHooks.setHand('player_1', ['mosje_jisca', 'mosje_fps_coert', 'mosje_chris_ddr']);
    });
    const tile = page.locator('.mosje-card--owned.card-v1--field').first();
    await expect(tile).toBeVisible();
    // 11. live values: MP and level come from game state, not the printed Start MP
    await expect(tile.locator('[data-cv1-mp]')).toHaveAttribute('data-cv1-mp', '35');
    await expect(tile.locator('[data-cv1-level]')).toHaveText('L1');
    await page.evaluate(() => window.__testHooks.setMosjeMP('player_1', 0, 105));
    await expect(page.locator('.mosje-card--owned.card-v1--field [data-cv1-mp]').first()).toHaveAttribute('data-cv1-mp', '105');
    // existing interactions survive: ability button still attached to the owned tile
    await expect(page.locator('.mosje-card--owned .mosje-ability-btn').first()).toBeAttached();
    await expect(page.locator('.hand-card.card-v1--full').first()).toBeVisible();
    await page.waitForTimeout(4000); // let turn/intro overlays finish
    await page.setViewportSize({ width: 1600, height: 1300 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/mosje-live-board.png` });
    await tile.screenshot({ path: `${OUT}/mosje-live-tile.png` });
    await page.locator('.hand-card.card-v1--full').first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/mosje-live-preview.png` });
  });

  test('hover on a field Mosje shows the enlarged full card (arena hover popup); click still opens the modal', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.waitForSelector('.mosje-card--owned', { timeout: 15000 });
    await page.evaluate(() => {
      window.__testHooks.clearEntryProtection();
      window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_alyssa_bulldozer', { mp: 35, level: 1 });
    });
    await page.waitForTimeout(4000);
    const tile = page.locator('.mosje-card--owned.card-v1--field').first();
    await tile.hover();
    const big = page.locator('.hover-zoom');
    await expect(big).toBeVisible();
    await expect(big.locator('.cv2-first')).toHaveText('Alyssa');
    await expect(big.locator('[data-cv1-mp]')).toHaveAttribute('data-cv1-mp', '35'); // live state, not Start MP
    await expect(big.locator('.cv2-text')).toContainText('Unstoppable');
    await expect(big.locator('[data-cv1-level-row="1"]')).toHaveAttribute('data-lit', 'true'); // level 1: row 1 lit
    await expect(big.locator('[data-cv1-level-row="2"]')).toHaveAttribute('data-lit', 'false');
    const t = await tile.boundingBox();
    const b = await big.boundingBox();
    expect(b.height).toBeGreaterThan(t.height * 2);
    // D-09 panel under the docked card: visible, inside the viewport, with the rarity line; the dock box is still the card box.
    const panel = big.locator('.hover-zoom__panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.cv2-panel-line--rarity')).toHaveText(/^★+$/);
    const pb = await panel.boundingBox();
    expect(pb.y).toBeGreaterThanOrEqual(b.y + b.height - 1);
    expect(pb.y + pb.height).toBeLessThanOrEqual(1000);
    expect(pb.x).toBeGreaterThanOrEqual(0);
    expect(pb.x + pb.width).toBeLessThanOrEqual(1600);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/mosje-hover.png` });
    await page.mouse.move(5, 500);
    await expect(big).toHaveCount(0);

    // After a level-up the pop-up lights row 2 and shows the level 2 Power, MP and chip.
    await page.evaluate(() => window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50, level: 2 }));
    await page.waitForTimeout(800);
    await page.mouse.move(5, 500);
    await tile.hover();
    const bigL2 = page.locator('.hover-zoom');
    await expect(bigL2).toBeVisible();
    await expect(bigL2.locator('[data-cv1-level-row="2"]')).toHaveAttribute('data-lit', 'true');
    await expect(bigL2.locator('[data-cv1-level-row="1"]')).toHaveAttribute('data-lit', 'false');
    await expect(bigL2.locator('[data-cv1-power]')).toHaveAttribute('data-cv1-power', '30');
    await expect(bigL2.locator('[data-cv1-mp]')).toHaveAttribute('data-cv1-mp', '50');
    await expect(bigL2.locator('.cv2-lvl-chip')).toHaveText('LVL 2');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/mosje-hover-l2.png` });
    await page.mouse.move(5, 500);
    await expect(bigL2).toHaveCount(0);
    await openOwnDetails(page, 'mosje', 0); // an own tile opens its tray on tap; Details opens the view
    await expect(page.locator('.modal-card.card-detail').first()).toBeVisible();
    await expect(page.locator('.hover-zoom')).toHaveCount(0);
  });
});
