// Card frame v1 — Piecie faces rendered from REAL game data (HANDOFF section 8).
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT, openGame, renderGallery, measureGallery } from './cardv1-helpers.js';

test.describe('card frame v1 — Piecie', () => {
  let ids;
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    ids = await page.evaluate(async () => {
      const { getCardsByType } = await import('/src/data/cardIndex.js');
      const all = getCardsByType('PIECIE');
      const byName = (n) => all.find(c => c.name === n)?.id;
      const longest = [...all].sort((a, b) => b.description.length - a.description.length)[0].id;
      const longestName = [...all].sort((a, b) => b.name.length - a.name.length)[0].id;
      const bySub = (s) => all.find(c => c.subtype === s)?.id;
      const wanted = [
        byName('Kannetje Melk'), all.find(c => c.mpCost > 0)?.id, byName('Leipe Swap'), byName('Stookerino'),
        longest, longestName, all.find(c => c.requirement === 'level2')?.id,
        bySub('ATTACK'), bySub('PET'), bySub('SUBSTANCE'), bySub('DIGITAL-EQUIPMENT'), bySub('PHYSICAL-EQUIPMENT'), bySub('UTILITY'),
      ].filter(Boolean);
      return [...new Set(wanted)];
    });
    expect(ids.length).toBeGreaterThan(8);
    fs.mkdirSync(OUT, { recursive: true });
  });

  test('pop-up mode 440x660: layout rules + screenshot', async ({ page }) => {
    await renderGallery(page, 'full', 440, ids);
    const report = await measureGallery(page);
    fs.writeFileSync(`${OUT}/piecie-popup-metrics.json`, JSON.stringify(report, null, 2));
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/piecie-popup.png` });
    for (const row of report) {
      for (const [k, v] of Object.entries(row.lefts)) if (v !== null) expect(k === 'desc' ? [40, 42] : [24, 40], `${row.id} ${k} left = ${v}`).toContain(Math.round(v));
      expect(row.descNameGap, `${row.id} desc/name gap`).toBeGreaterThanOrEqual(0);
      expect(row.descClearOfInfo, `${row.id} desc clear of info line`).toBe(true);
      expect(row.infoOverBadge, `${row.id} info vs badge`).toBe(false);
      expect(row.firstOverflow, `${row.id} name overflow`).toBe(false);
      expect(row.firstSize, `${row.id} name size`).toBeGreaterThanOrEqual(24);
      expect(row.badgeValueFits && row.badgeLabelFits, `${row.id} badge content fits`).toBe(true);
      expect(row.pillText).toBe('PIECIE');
      expect(row.pillColor, `${row.id} pill colour`).toBe('rgb(21, 128, 61)'); // #15803D
      expect(row.infoText).toMatch(/^Requires: /);
      expect(row.badgeText).toMatch(/^(Free COST|\d+ MP COST)$/);
    }
  });

  test('field mode 240x176 + hand/board sizes: screenshots', async ({ page }) => {
    await renderGallery(page, 'field', 240, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/piecie-field.png` });
    await renderGallery(page, 'full', 96, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/piecie-small.png` });
    await renderGallery(page, 'field', 110, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/piecie-field-board-size.png` });
  });

  test('missing art falls back to the type-coloured window', async ({ page }) => {
    await page.evaluate(async () => {
      const { renderCard } = await import('/src/ui/cardRenderer.js');
      const { getCardById } = await import('/src/data/cardIndex.js');
      const el = renderCard({ ...getCardById('piecie_kannetje_melk'), artPath: 'assets/nope/missing.png' }, {});
      el.id = 'noart'; el.style.cssText = 'position:fixed;left:20px;top:20px;z-index:99999';
      document.body.appendChild(el);
    });
    await page.waitForTimeout(500); // broken image is removed by onerror
    await expect(page.locator('#noart img')).toHaveCount(0);
    await expect(page.locator('#noart .cv1-first')).toHaveText('Kannetje Melk');
    await page.locator('#noart').screenshot({ path: `${OUT}/piecie-noart.png` });
  });
});
