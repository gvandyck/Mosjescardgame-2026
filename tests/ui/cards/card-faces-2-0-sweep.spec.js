// Phase 62-07 — collision sweep of EVERY 2.0 card (the 183 Card List ids) at the Mobile-ready sizes:
// pop-up / hand faces at 230 px (the old hand size, the stress case) and 120 px (phone), field tiles at 240 px (the table
// size) and 120 px. No two zones of a face may overlap, nothing may leave the card, text that runs out of its box must
// be flagged clamped. Screenshots: tests/ui/screenshots/cardv1/sweep-*.png.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT, openGame } from './cardv1-helpers.js';
import { CARD_ID_MAP } from '../../../scripts/obby2/cardIdMap.mjs';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';

const MOSJE_IDS = Object.values(CARD_ID_MAP.mosjes);
const ALL_IDS = ['mosjes', 'piecies', 'snelle', 'places', 'quests'].flatMap((type) => Object.values(CARD_ID_MAP[type]));

// Renders the 183 cards into one gallery. mode 'full' = pop-up / hand faces inside a .hand-strip root (as the hand does);
// mode 'field' = field tiles (a Quest tile gets one fail token so a filled pip is drawn too).
async function renderSweep(page, { mode, width, height }) {
  await page.setViewportSize({ width: 2400, height });
  await page.evaluate(async ({ mode, width, ids }) => {
    const { renderCard } = await import('/src/ui/cardRenderer.js');
    const { getCardById } = await import('/src/data/cardIndex.js');
    document.getElementById('sweep-gallery')?.remove();
    const root = document.createElement('div');
    root.id = 'sweep-gallery';
    if (mode === 'full') root.className = 'hand-strip';
    root.style.cssText = 'position:fixed;left:0;top:0;width:2400px;z-index:99999;background:#0d0b14;display:flex;flex-wrap:wrap;gap:16px;padding:16px;align-content:flex-start;align-items:flex-start';
    document.body.appendChild(root);
    for (const id of ids) {
      const def = getCardById(id);
      if (!def) throw new Error(`sweep: no card ${id}`);
      const field = mode === 'field';
      const card = field && def.type === 'QUEST' ? { ...def, failTokens: 1 } : def;
      const el = renderCard(card, { compact: field, fieldMode: field });
      if (!field) el.classList.add('hand-card');
      el.style.setProperty('--cv1-w', `${width}px`);
      el.dataset.testCard = id;
      root.appendChild(el);
    }
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 500));
  }, { mode, width, ids: ALL_IDS });
  const rows = await page.evaluate(collectFaceZones, '#sweep-gallery [data-test-card]');
  await page.locator('#sweep-gallery').screenshot({ path: `${OUT}/${mode === 'full' ? 'sweep' : 'sweep-tiles'}-${width}.png` });
  return rows;
}

test.describe('2.0 card faces: collision sweep of all 183 cards', () => {
  test.beforeEach(async ({ page }) => {
    expect(ALL_IDS.length, 'the Card List has 183 cards').toBe(183);
    expect(MOSJE_IDS.length).toBe(32);
    fs.mkdirSync(OUT, { recursive: true });
    await openGame(page);
  });

  for (const width of [230, 120]) {
    test(`every 2.0 card face is collision-free at ${width} px`, async ({ page }) => {
      const rows = await renderSweep(page, { mode: 'full', width, height: width === 230 ? 8200 : 2600 });
      expect(rows.length, 'every card rendered').toBe(183);
      const clamped = rows.filter((r) => r.clamped).map((r) => r.id);
      console.log(`faces at ${width} px: ${rows.length} cards, ${clamped.length} clamped (text cut with a fade): ${clamped.join(', ') || 'none'}`);
      expect(findFaceCollisions(rows), `faces that collide at ${width}`).toEqual([]);
      for (const id of MOSJE_IDS) {
        const r = rows.find((row) => row.id === id);
        // 3 level rows from the 150 px container query up, only the lit row below it
        expect(r.visibleRows, `${id} visible level rows at ${width}`).toBe(width >= 150 ? 3 : 1);
        expect(r.litRows, `${id} lit level row at ${width}`).toEqual(['1']);
      }
    });
  }

  for (const width of [240, 120]) {
    test(`every 2.0 field tile is collision-free at ${width} px`, async ({ page }) => {
      const rows = await renderSweep(page, { mode: 'field', width, height: width === 240 ? 4400 : 1900 });
      expect(rows.length, 'every card rendered').toBe(183);
      expect(rows.filter((r) => r.tile).length, 'every card is a 2.0 tile').toBe(183);
      console.log(`tiles at ${width} px: ${rows.length} cards, ${rows.filter((r) => r.clamped).length} clamped`);
      expect(findFaceCollisions(rows), `tiles that collide at ${width}`).toEqual([]);
      for (const id of MOSJE_IDS) {
        const r = rows.find((row) => row.id === id);
        for (const zone of ['name', 'lvl', 'power', 'mp']) expect(r.zones[zone], `${id} tile ${zone}`).not.toBeNull();
      }
    });
  }
});
