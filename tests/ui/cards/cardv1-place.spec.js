// Card frame v1 — Place faces (2.0, Phase 7 A6) rendered from REAL game data (HANDOFF section 8).
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT, openGame, renderGallery } from './cardv1-helpers.js';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';

// Per rendered card: what the face shows (collected in the page).
function readFaces() {
  return [...document.querySelectorAll('#cv1-gallery [data-test-card]')].map((card) => ({
    id: card.dataset.testCard,
    pill: card.querySelector('.cv2-pill')?.textContent ?? null,
    pillColor: getComputedStyle(card.querySelector('.cv2-pill')).backgroundColor,
    info: card.querySelector('.cv2-info')?.textContent ?? null,
    label: card.querySelector('.cv2-label')?.textContent ?? null,
    cornerVal: card.querySelector('.cv2-corner-val')?.textContent ?? null,
    cornerHook: card.querySelector('.cv2-corner')?.dataset.cv1Cost ?? null,
    cornerLabel: card.querySelector('.cv2-corner-label')?.textContent ?? null,
    hasBadge: !!card.querySelector('.cv1-badge'),
    hasFooter: !!card.querySelector('.cv2-footer'),
    firstOverflow: card.querySelector('.cv2-first').scrollWidth > card.querySelector('.cv2-first').clientWidth + 1,
    firstLines: Math.round(card.querySelector('.cv2-first').getBoundingClientRect().height / parseFloat(getComputedStyle(card.querySelector('.cv2-first')).lineHeight)),
  }));
}

test('card frame v1 — Place (2.0 face): cost, Good/Bad line, label, zones, field tile, small size', async ({ page }) => {
  await openGame(page);
  const ids = await page.evaluate(async () => {
    const { getCardsByType } = await import('/src/data/cardIndex.js');
    return getCardsByType('PLACE').map(c => c.id);
  });
  expect(ids.length).toBeGreaterThan(10);
  fs.mkdirSync(OUT, { recursive: true });

  await renderGallery(page, 'full', 440, ids);
  const zones = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
  const faces = await page.evaluate(readFaces);
  const data = await page.evaluate(async (list) => {
    const { getCardById } = await import('/src/data/cardIndex.js');
    const { formatGoodBadLine } = await import('/src/ui/cardV1/formatGoodBadLine.js');
    return Object.fromEntries(list.map((id) => { const c = getCardById(id); return [id, { cost: String(Number(c.cost) || 0), info: formatGoodBadLine(c.goodFor, c.badFor), hasLists: !!(c.goodFor?.length || c.badFor?.length) }]; }));
  }, ids);
  fs.writeFileSync(`${OUT}/place-popup-metrics.json`, JSON.stringify(zones.map((z, i) => ({ ...z, ...faces[i] })), null, 2));
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/place-popup.png` });

  expect(findFaceCollisions(zones), 'zones that collide or leave the card').toEqual([]);
  for (const [i, z] of zones.entries()) {
    const f = faces[i];
    const d = data[z.id];
    expect(z.face, `${z.id} uses the 2.0 face`).toBe(2);
    expect(f.pill, `${z.id} pill`).toBe('PLACE');
    expect(f.pillColor, `${z.id} pill colour`).toBe('rgb(109, 40, 217)'); // #6D28D9
    expect(f.label?.toLowerCase(), `${z.id} label`).toBe('only 1 in play');
    // A10 "a Place shows its cost": the Energy cost in the corner with the label COST (0 would show 0)
    expect(f.cornerVal, `${z.id} cost`).toBe(d.cost);
    expect(f.cornerHook, `${z.id} data-cv1-cost`).toBe(d.cost);
    expect(f.cornerLabel, `${z.id} cost label`).toBe('COST');
    // the Good/Bad line prints the Card List words as written, and only when the Place has either list
    if (d.hasLists) {
      expect(f.info, `${z.id} Good/Bad line`).toBe(d.info);
      expect(f.info, `${z.id} Good/Bad line start`).toMatch(/^(Good for:|Bad for:)/);
    } else {
      expect(f.info, `${z.id} has no info line`).toBeNull();
    }
    expect(f.hasBadge, `${z.id} must have no badge`).toBe(false);
    expect(f.hasFooter, `${z.id} must have no footer numbers`).toBe(false);
    // left edges: cost block, info, pill row and label all start at 42 (reference px at 440)
    for (const k of ['corner', 'info', 'pills', 'label']) {
      if (z.zones[k]) expect(Math.abs(z.zones[k].l - 42), `${z.id} ${k} left`).toBeLessThanOrEqual(1);
    }
    // the stack sits at bottoms 54 (pill row) / 30 (label) / 85 (info, when there is one)
    const fromBottom = (zone) => Math.round((z.height - z.zones[zone].b) * 10) / 10;
    expect(Math.abs(fromBottom('pills') - 54), `${z.id} pill row bottom`).toBeLessThanOrEqual(1);
    expect(Math.abs(fromBottom('label') - 30), `${z.id} label bottom`).toBeLessThanOrEqual(1);
    if (z.zones.info) expect(Math.abs(fromBottom('info') - 85), `${z.id} info bottom`).toBeLessThanOrEqual(1);
    expect(f.firstOverflow, `${z.id} name overflow`).toBe(false);
    expect(f.firstLines, `${z.id} name lines`).toBeLessThanOrEqual(2);
    expect(z.textPx, `${z.id} text size`).toBeGreaterThanOrEqual(11.5);
  }

  await renderGallery(page, 'field', 240, ids);
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/place-field.png` });
  // 2.0 Place tile: name and type pill never overlap, at 240 and at 120
  const tiles = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
  expect(tiles.every((t) => t.tile && t.zones.name && t.zones.pills), 'every Place tile has a name and a pill row').toBe(true);
  expect(findFaceCollisions(tiles), 'Place tile zones collide at 240').toEqual([]);
  await renderGallery(page, 'field', 120, ids);
  expect(findFaceCollisions(await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]')), 'Place tile zones collide at 120').toEqual([]);
  await renderGallery(page, 'full', 230, ids);
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/place-hand-230.png` });
  await renderGallery(page, 'full', 96, ids);
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/place-small.png` });
});
