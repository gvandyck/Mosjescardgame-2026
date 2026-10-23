// Card frame v1 — Piecie faces (2.0, Phase 7 A5) rendered from REAL game data.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT, openGame, renderGallery } from './cardv1-helpers.js';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';

// Per rendered card: the card data next to what the face shows (collected in the page).
function readFaces() {
  return [...document.querySelectorAll('#cv1-gallery [data-test-card]')].map((card) => ({
    id: card.dataset.testCard,
    pill: card.querySelector('.cv2-pill')?.textContent ?? null,
    pillColor: getComputedStyle(card.querySelector('.cv2-pill')).backgroundColor,
    info: card.querySelector('.cv2-info')?.textContent ?? null,
    cornerVal: card.querySelector('.cv2-corner-val')?.textContent ?? null,
    cornerHook: card.querySelector('.cv2-corner')?.dataset.cv1Cost ?? null,
    cornerLabel: card.querySelector('.cv2-corner-label')?.textContent ?? null,
    cornerSub: card.querySelector('.cv2-corner-sub')?.textContent ?? null,
    label: card.querySelector('.cv2-label')?.textContent ?? null,
    stays: !!card.querySelector('[data-cv1-stays]'),
    textBoxHasNeeds: /Needs:/.test(card.querySelector('.cv2-textbox')?.textContent ?? ''),
    firstOverflow: card.querySelector('.cv2-first').scrollWidth > card.querySelector('.cv2-first').clientWidth + 1,
    firstLines: Math.round(card.querySelector('.cv2-first').getBoundingClientRect().height / parseFloat(getComputedStyle(card.querySelector('.cv2-first')).lineHeight)),
  }));
}

test.describe('card frame v1 — Piecie (2.0 face)', () => {
  let ids;
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    ids = await page.evaluate(async () => {
      const { getCardsByType } = await import('/src/data/cardIndex.js');
      const all = getCardsByType('PIECIE').filter((c) => !c.disabled);
      const byName = (n) => all.find((c) => c.name === n)?.id;
      const byLen = (f) => [...all].sort((a, b) => f(b) - f(a))[0].id;
      const wanted = [
        byName('Kannetje Melk'), all.find((c) => c.cost > 0)?.id, byName('Leipe Swap'), byName('Stookerino'),
        byLen((c) => c.description.length), byLen((c) => c.name.length), byName('Dikke Taks'),
        byLen((c) => (c.needsText || '').length), // the Needs line that wraps to two lines
        ...['food', 'gear', 'pet', 'substance'].map((t) => all.find((c) => c.tag === t)?.id),
        ...['mp', 'attack', 'utility'].map((g) => all.find((c) => !c.tag && c.group === g)?.id),
        all.find((c) => c.stays)?.id, 'piecie_bowie_stormey', 'piecie_tony', 'piecie_gekke_vogels',
      ].filter(Boolean);
      return [...new Set(wanted)];
    });
    expect(ids.length).toBeGreaterThan(14);
    fs.mkdirSync(OUT, { recursive: true });
  });

  test('pop-up mode 440x660: 2.0 zones, Needs line, label, STAYS, cost + screenshot', async ({ page }) => {
    await renderGallery(page, 'full', 440, ids);
    const zones = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    const faces = await page.evaluate(readFaces);
    const data = await page.evaluate(async (list) => {
      const { getCardById } = await import('/src/data/cardIndex.js');
      const { getPiecieLabel } = await import('/src/ui/cardV1/getPiecieLabel.js');
      return Object.fromEntries(list.map((id) => { const c = getCardById(id); return [id, { cost: String(c.cost), needsText: c.needsText || null, stays: !!c.stays, label: getPiecieLabel(c) }]; }));
    }, ids);
    fs.writeFileSync(`${OUT}/piecie-popup-metrics.json`, JSON.stringify(zones.map((z, i) => ({ ...z, ...faces[i] })), null, 2));
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/piecie-popup.png` });

    expect(findFaceCollisions(zones), 'zones that collide or leave the card').toEqual([]);
    for (const [i, z] of zones.entries()) {
      const f = faces[i];
      const d = data[z.id];
      expect(z.face, `${z.id} uses the 2.0 face`).toBe(2);
      expect(f.pill, `${z.id} pill`).toBe('PIECIE');
      expect(f.pillColor, `${z.id} pill colour`).toBe('rgb(21, 128, 61)'); // #15803D
      // Needs line exactly when the card has needsText, and the sentence is not repeated in the text box
      if (d.needsText) expect(f.info, `${z.id} Needs line`).toBe(`Needs: ${d.needsText}`);
      else expect(f.info, `${z.id} has no info line`).toBeNull();
      expect(f.textBoxHasNeeds, `${z.id} Needs sentence repeated in the text box`).toBe(false);
      // cost corner = the Energy cost, label exactly COST (0 shows the number 0)
      expect(f.cornerVal, `${z.id} cost`).toBe(d.cost);
      expect(f.cornerHook, `${z.id} data-cv1-cost`).toBe(d.cost);
      expect(f.cornerLabel, `${z.id} cost label`).toBe('COST');
      // tag-first label (CSS uppercases it) and the STAYS chip
      expect(f.label.toLowerCase(), `${z.id} label`).toBe(d.label.toLowerCase());
      expect(f.stays, `${z.id} STAYS chip`).toBe(d.stays);
      // left edges: cost block, info, pill row and label all start at 42 (reference px at 440)
      for (const k of ['corner', 'info', 'pills', 'label']) {
        if (z.zones[k]) expect(Math.abs(z.zones[k].l - 42), `${z.id} ${k} left`).toBeLessThanOrEqual(1);
      }
      expect(Math.abs(z.zones.textbox.l - 30), `${z.id} text box left`).toBeLessThanOrEqual(1);
      // the stack sits on the 42 edge at bottoms 54 (pill row) / 30 (label) / 85 (info, when there is one) and the
      // text box ends at 108, or 6.75 above a Needs line that wraps (it shortens the box instead of overlapping it)
      const fromBottom = (zone) => Math.round((z.height - z.zones[zone].b) * 10) / 10;
      expect(Math.abs(fromBottom('pills') - 54), `${z.id} pill row bottom`).toBeLessThanOrEqual(1);
      expect(Math.abs(fromBottom('label') - 30), `${z.id} label bottom`).toBeLessThanOrEqual(1);
      if (z.zones.info) {
        expect(Math.abs(fromBottom('info') - 85), `${z.id} info bottom`).toBeLessThanOrEqual(1);
        expect(Math.abs((z.height - z.zones.textbox.b) - (z.height - z.zones.info.t + 6.75)), `${z.id} text box sits 6.75 above the info line`).toBeLessThanOrEqual(1);
      } else {
        expect(Math.abs(fromBottom('textbox') - 108), `${z.id} text box bottom`).toBeLessThanOrEqual(1);
      }
      expect(f.firstOverflow, `${z.id} name overflow`).toBe(false);
      expect(f.firstLines, `${z.id} name lines`).toBeLessThanOrEqual(2);
      expect(z.textPx, `${z.id} text size`).toBeGreaterThanOrEqual(11.5);
    }
  });

  test('boxed cards keep the text box under the art window (window 124..348, text box from 366)', async ({ page }) => {
    await renderGallery(page, 'full', 440, ids);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#cv1-gallery [data-test-card]')].map((card) => {
      const c = card.getBoundingClientRect();
      const box = card.querySelector('.cv2-textbox').getBoundingClientRect();
      const win = card.querySelector('.cv1-window').getBoundingClientRect();
      return { id: card.dataset.testCard, boxed: card.classList.contains('card--boxed'), boxTop: box.top - c.top, winBottom: win.bottom - c.top };
    }));
    const boxed = rows.filter((r) => r.boxed);
    expect(boxed.length, 'the gallery has boxed (tier 1-3) cards').toBeGreaterThan(3);
    for (const r of boxed) expect(r.boxTop, `${r.id} text box starts below the art window`).toBeGreaterThanOrEqual(r.winBottom - 1);
  });

  test('field mode 240x176 + hand/board sizes: screenshots', async ({ page }) => {
    await renderGallery(page, 'field', 240, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/piecie-field.png` });
    // 2.0 Piecie tile: name and type pill (+ STAYS chip) never overlap, at 240 and at 120
    const tiles = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    expect(tiles.every((t) => t.tile && t.zones.name && t.zones.pills), 'every Piecie tile has a name and a pill row').toBe(true);
    expect(findFaceCollisions(tiles), 'Piecie tile zones collide at 240').toEqual([]);
    await renderGallery(page, 'field', 120, ids);
    expect(findFaceCollisions(await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]')), 'Piecie tile zones collide at 120').toEqual([]);
    await renderGallery(page, 'full', 230, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/piecie-hand-230.png` });
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
    await expect(page.locator('#noart .cv2-first')).toHaveText('Kannetje Melk');
    await page.locator('#noart').screenshot({ path: `${OUT}/piecie-noart.png` });
  });
});
