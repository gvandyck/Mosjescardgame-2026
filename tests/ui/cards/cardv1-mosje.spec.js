// Card frame v1 — Mosje faces rendered from REAL game data in the real browser.
// Renders pop-up (440x660), field tile (240x176) and a small hand-size face for the
// HANDOFF section 8 test cards, asserts the layout rules, and saves screenshots +
// a metrics report to tests/ui/screenshots/cardv1/.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';

const OUT = 'tests/ui/screenshots/cardv1';

// name fragment -> why it is in the set
const TEST_CARDS = [
  ['[Alyssa] The Bulldozer', '3-effect card'],
  ['[Ronald] The Master Chef', '2-effect card'],
  ['[Jisca] The Maestro', 'longest text stress test'],
  ['[FPS Coert]', 'no nickname'],
  ['[Dancing/DDR Chris]', 'long first name, no nickname'],
  ['[Parkour West] The Flow Fighter', 'long first name + nickname'],
  ['[The Hacker]', 'placeholder first name, no nickname'],
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
      const nick = (c) => (c.name.match(/^\[.+?\]\s*(.*)/) || [])[1] || '';
      out.push([...mosjes].sort((a, b) => nick(b).length - nick(a).length)[0].id);
      return out;
    }, TEST_CARDS);
    expect(ids.every(Boolean)).toBe(true);
    fs.mkdirSync(OUT, { recursive: true });
  });

  test('pop-up mode 440x660: layout rules + screenshot', async ({ page }) => {
    await renderGallery(page, 'full', 440, ids);
    const report = await page.evaluate(() => {
      const rows = [];
      for (const card of document.querySelectorAll('#cv1-gallery [data-test-card]')) {
        const c = card.getBoundingClientRect();
        const rel = (sel) => {
          const el = card.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: +(r.left - c.left).toFixed(1), right: +(r.right - c.left).toFixed(1), top: +(r.top - c.top).toFixed(1), bottom: +(r.bottom - c.top).toFixed(1) };
        };
        const first = rel('.cv1-first'), nick = rel('.cv1-nick'), desc = rel('.cv1-desc'),
          info = rel('.cv1-info'), pill = rel('.cv1-pill'), border = rel('.cv1-border-text'), badge = rel('.cv1-badge');
        const nameBottom = (nick || first).bottom;
        // glyph origin of text lines: use range rects so padding/bearing is excluded
        rows.push({
          id: card.dataset.testCard,
          width: c.width, height: c.height,
          lefts: { first: first.left, nick: nick?.left ?? null, desc: desc.left, info: info.left, pill: pill.left, border: border.left },
          descTop: desc.top, nameBottom,
          descNameGap: +(desc.top - nameBottom).toFixed(1),
          descHeightPct: +(((desc.bottom - desc.top) / c.height) * 100).toFixed(1),
          infoRight: info.right, badgeLeft: badge.left, badgeTop: badge.top,
          infoOverBadge: info.right > badge.left && info.bottom > badge.top,
          firstOverflow: card.querySelector('.cv1-first').scrollWidth > card.querySelector('.cv1-name').clientWidth + 1,
          firstSize: parseFloat(getComputedStyle(card.querySelector('.cv1-first')).fontSize),
          descSize: parseFloat(getComputedStyle(card.querySelector('.cv1-desc')).fontSize),
          flaggedOverflow: card.querySelector('.cv1-face').dataset.cv1Overflow === 'true',
          fonts: getComputedStyle(card.querySelector('.cv1-first')).fontFamily,
        });
      }
      return rows;
    });
    // fonts must come from the self-hosted files (gstatic is blocked in this suite)
    expect(await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))).toEqual(expect.arrayContaining(['Sora', 'DM Sans']));
    fs.writeFileSync(`${OUT}/mosje-popup-metrics.json`, JSON.stringify(report, null, 2));
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-popup.png` });

    for (const row of report) {
      // 1. everything on the 42px left edge (names/desc/info/pill/border share one x)
      for (const [k, v] of Object.entries(row.lefts)) {
        if (v !== null) expect(k === 'desc' ? [40, 42] : [24, 40], `${row.id} ${k} left = ${v}`).toContain(Math.round(v));
      }
      // 3. no collisions: description must not run into the name block or the badge
      expect(row.descNameGap, `${row.id} desc/name gap`).toBeGreaterThanOrEqual(0);
      expect(row.infoOverBadge, `${row.id} info vs badge`).toBe(false);
      // 5. first name never wraps/clips and respects the 24px minimum
      expect(row.firstOverflow, `${row.id} first name overflow`).toBe(false);
      expect(row.firstSize, `${row.id} first name size`).toBeGreaterThanOrEqual(24);
      // Badge straddles the art window corner (window bottom = 620, right = 422)
      expect(row.badgeLeft).toBeLessThan(422);
    }
  });

  test('field mode 240x176 + small hand size: screenshots', async ({ page }) => {
    await renderGallery(page, 'field', 240, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-field.png` });
    const tooWide = await page.evaluate(() => [...document.querySelectorAll('#cv1-gallery .cv1-name')].map(n => n.scrollWidth > n.clientWidth));
    expect(tooWide.length).toBeGreaterThan(0); // ellipsis handles overflow; just prove the tiles rendered
    await renderGallery(page, 'full', 130, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-small.png` });
    await renderGallery(page, 'field', 150, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/mosje-field-board-size.png` });
  });

  test('live game: board tile + hand + preview follow game state', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForSelector('.mosje-card--owned', { timeout: 15000 });
    await page.evaluate(() => {
      window.__testHooks.clearEntryProtection();
      window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_alyssa_bulldozer', { mp: 35, level: 1 });
      window.__testHooks.setMosjeOnField('player_1', 1, 'mosje_ronald_chef', { mp: 60, level: 0 });
      window.__testHooks.setHand('player_1', ['mosje_jisca', 'mosje_fps_coert', 'mosje_chris_ddr']);
    });
    const tile = page.locator('.mosje-card--owned.card-v1--field').first();
    await expect(tile).toBeVisible();
    // 11. live values: MP and level come from game state, not the printed Start MP
    await expect(tile.locator('[data-cv1-mp]')).toHaveText('35');
    await expect(tile.locator('.cv1-pill')).toHaveText('L2');
    await page.evaluate(() => window.__testHooks.setMosjeMP('player_1', 0, 105));
    await expect(page.locator('.mosje-card--owned.card-v1--field [data-cv1-mp]').first()).toHaveText('105');
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
    await expect(big.locator('.cv1-first')).toHaveText('Alyssa');
    await expect(big.locator('[data-cv1-mp]')).toHaveText('35'); // live state, not Start MP
    await expect(big.locator('.cv1-desc')).toContainText('Unstoppable');
    const t = await tile.boundingBox();
    const b = await big.boundingBox();
    expect(b.height).toBeGreaterThan(t.height * 2);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/mosje-hover.png` });
    await page.mouse.move(5, 500);
    await expect(big).toHaveCount(0);
    await tile.click();
    await expect(page.locator('.modal-card.card-detail').first()).toBeVisible();
    await expect(page.locator('.hover-zoom')).toHaveCount(0);
  });
});
