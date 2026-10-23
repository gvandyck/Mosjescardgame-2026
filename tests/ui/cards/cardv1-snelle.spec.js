// Card frame v1 — Snelle faces (2.0, Phase 7 A5) rendered from REAL game data. Small spec.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT, openGame, renderGallery } from './cardv1-helpers.js';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';

function readFaces() {
  return [...document.querySelectorAll('#cv1-gallery [data-test-card]')].map((card) => ({
    id: card.dataset.testCard,
    pill: card.querySelector('.cv2-pill')?.textContent ?? null,
    pillColor: getComputedStyle(card.querySelector('.cv2-pill')).backgroundColor,
    info: card.querySelector('.cv2-info')?.textContent ?? null,
    label: card.querySelector('.cv2-label')?.textContent ?? null,
    cornerVal: card.querySelector('.cv2-corner-val')?.textContent ?? null,
    cornerLabel: card.querySelector('.cv2-corner-label')?.textContent ?? null,
    cornerSub: card.querySelector('.cv2-corner-sub')?.textContent ?? null,
    stays: !!card.querySelector('[data-cv1-stays]'),
    textBoxHasNeeds: /Needs:/.test(card.querySelector('.cv2-textbox')?.textContent ?? ''),
    firstOverflow: card.querySelector('.cv2-first').scrollWidth > card.querySelector('.cv2-first').clientWidth + 1,
  }));
}

test('card frame v1 — Snelle (2.0 face): zones, Needs line, label, cost, small sizes', async ({ page }) => {
  await openGame(page);
  const ids = await page.evaluate(async () => {
    const { getCardsByType } = await import('/src/data/cardIndex.js');
    return getCardsByType('SNELLE_PIECIE').map((c) => c.id);
  });
  expect(ids.length).toBeGreaterThan(10);
  fs.mkdirSync(OUT, { recursive: true });
  const data = await page.evaluate(async (list) => {
    const { getCardById } = await import('/src/data/cardIndex.js');
    return Object.fromEntries(list.map((id) => { const c = getCardById(id); return [id, { cost: String(c.cost), needsText: c.needsText || null, stays: !!c.stays, costText: c.costText || null }]; }));
  }, ids);

  await renderGallery(page, 'full', 440, ids);
  const zones = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
  const faces = await page.evaluate(readFaces);
  fs.writeFileSync(`${OUT}/snelle-popup-metrics.json`, JSON.stringify(zones.map((z, i) => ({ ...z, ...faces[i] })), null, 2));
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/snelle-popup.png` });
  expect(findFaceCollisions(zones), 'zones that collide or leave the card').toEqual([]);
  for (const [i, z] of zones.entries()) {
    const f = faces[i];
    const d = data[z.id];
    expect(z.face, `${z.id} uses the 2.0 face`).toBe(2);
    expect(f.pill).toBe('SNELLE');
    expect(f.pillColor, `${z.id} pill colour`).toBe('rgb(161, 98, 7)'); // #A16207
    expect(f.label.toLowerCase(), `${z.id} label`).toBe('instant · any turn');
    if (d.needsText) expect(f.info, `${z.id} Needs line`).toBe(`Needs: ${d.needsText}`);
    else expect(f.info, `${z.id} has no info line`).toBeNull();
    expect(f.textBoxHasNeeds, `${z.id} Needs sentence repeated in the text box`).toBe(false);
    expect(f.cornerVal, `${z.id} cost`).toBe(d.cost);
    expect(f.cornerLabel, `${z.id} cost label`).toBe('COST');
    expect(f.stays, `${z.id} STAYS chip`).toBe(d.stays);
    for (const k of ['corner', 'info', 'pills', 'label']) {
      if (z.zones[k]) expect(Math.abs(z.zones[k].l - 42), `${z.id} ${k} left`).toBeLessThanOrEqual(1);
    }
    const fromBottom = (zone) => Math.round((z.height - z.zones[zone].b) * 10) / 10;
    expect(Math.abs(fromBottom('pills') - 54), `${z.id} pill row bottom`).toBeLessThanOrEqual(1);
    expect(Math.abs(fromBottom('label') - 30), `${z.id} label bottom`).toBeLessThanOrEqual(1);
    if (z.zones.info) expect(Math.abs(fromBottom('info') - 85), `${z.id} info bottom`).toBeLessThanOrEqual(1);
    else expect(Math.abs(fromBottom('textbox') - 108), `${z.id} text box bottom`).toBeLessThanOrEqual(1);
    expect(f.firstOverflow, `${z.id} name overflow`).toBe(false);
    expect(z.clamped, `${z.id} flagged clamped`).toBe(false);
    expect(z.textPx, `${z.id} text size`).toBeGreaterThanOrEqual(11.5);
  }
  // Blensen! costs 4 or is free: the corner says 4 with "or free" under COST.
  const blensen = faces.find((f) => f.id === 'snelle_blensen');
  expect(blensen.cornerVal).toBe('4');
  expect(blensen.cornerSub).toBe('or free');
  expect(faces.filter((f) => f.cornerSub).map((f) => f.id)).toEqual(['snelle_blensen']);

  await renderGallery(page, 'field', 240, ids);
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/snelle-field.png` });
  // 2.0 Snelle tile: name and type pill (+ STAYS chip) never overlap, at 240 and at 120
  const tiles = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
  expect(tiles.every((t) => t.tile && t.zones.name && t.zones.pills), 'every Snelle tile has a name and a pill row').toBe(true);
  expect(findFaceCollisions(tiles), 'Snelle tile zones collide at 240').toEqual([]);
  await renderGallery(page, 'field', 120, ids);
  expect(findFaceCollisions(await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]')), 'Snelle tile zones collide at 120').toEqual([]);
  await renderGallery(page, 'full', 230, ids);
  const hand = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
  expect(findFaceCollisions(hand), 'zones that collide at 230').toEqual([]);
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/snelle-hand-230.png` });
  await renderGallery(page, 'full', 96, ids);
  await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/snelle-small.png` });
});
