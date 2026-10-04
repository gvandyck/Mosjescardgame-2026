// Card frame v1 — Snelle faces rendered from REAL game data (HANDOFF section 8). Small spec.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT, openGame, renderGallery, measureGallery } from './cardv1-helpers.js';

test('card frame v1 — Snelle: layout rules, field tile, small size', async ({ page }) => {
  await openGame(page);
  const ids = await page.evaluate(async () => {
    const { getCardsByType } = await import('/src/data/cardIndex.js');
    return getCardsByType('SNELLE_PIECIE').map(c => c.id);
  });
  expect(ids.length).toBeGreaterThan(10);
  fs.mkdirSync(OUT, { recursive: true });

  await renderGallery(page, 'full', 440, ids);
  const report = await measureGallery(page);
  fs.writeFileSync(`${OUT}/snelle-popup-metrics.json`, JSON.stringify(report, null, 2));
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/snelle-popup.png` });
  for (const row of report) {
    for (const [k, v] of Object.entries(row.lefts)) if (v !== null) expect(v, `${row.id} ${k} left`).toBeCloseTo(42, 0);
    expect(row.descNameGap, `${row.id} desc/name gap`).toBeGreaterThanOrEqual(0);
    expect(row.descClearOfInfo, `${row.id} desc clear of info`).toBe(true);
    expect(row.infoOverBadge, `${row.id} info vs badge`).toBe(false);
    expect(row.firstOverflow, `${row.id} name overflow`).toBe(false);
    expect(row.badgeValueFits && row.badgeLabelFits, `${row.id} badge`).toBe(true);
    expect(row.flaggedOverflow, `${row.id} flagged overflowing`).toBe(false);
    expect(row.pillText).toBe('SNELLE');
    expect(row.pillColor).toBe('rgb(161, 98, 7)'); // #A16207
    expect(row.borderText).toBe('Instant - play any time');
  }

  await renderGallery(page, 'field', 240, ids);
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/snelle-field.png` });
  await renderGallery(page, 'full', 96, ids);
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/snelle-small.png` });
});
