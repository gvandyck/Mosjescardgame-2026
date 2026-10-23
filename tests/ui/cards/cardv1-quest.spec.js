// Card frame v1 — Quest faces (2.0, Phase 7 A7) rendered from REAL game data: the 38 Quests with a stack.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { OUT, openGame, renderGallery } from './cardv1-helpers.js';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';

const STACK_COLOR = { FIGHTING: 'rgb(194, 65, 12)', DIGITAL: 'rgb(14, 116, 144)', ARTISTIC: 'rgb(162, 28, 175)' };

// Per rendered card: what the face shows plus the fit checks the zone rects cannot see (collected in the page).
function readFaces() {
  return [...document.querySelectorAll('#cv1-gallery [data-test-card]')].map((card) => {
    const q = (s) => card.querySelector(s);
    const rect = (el) => el.getBoundingClientRect();
    const textRight = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().right; };
    const val = q('.cv2-corner-val');
    const divider = q('.cv2-divider');
    const stat = (side) => ({ val: q(`.cv2-stat--${side} .cv2-stat-val`), label: q(`.cv2-stat--${side} .cv2-stat-label`) });
    const left = stat('left');
    const right = stat('right');
    const pill = q('.cv2-footer-pill');
    const labelHasText = (el) => !!el.textContent.trim();
    return {
      id: card.dataset.testCard,
      need: q('.cv2-corner')?.dataset.cv1Need ?? null,
      needVal: val?.textContent ?? null,
      needLabel: q('.cv2-corner-label')?.textContent ?? null,
      // the need never reaches the divider: its drawn text ends before it
      needClear: !val || textRight(val) <= rect(divider).left - 1,
      needLabelClear: !q('.cv2-corner-label') || textRight(q('.cv2-corner-label')) <= rect(divider).left - 1,
      info: q('.cv2-info')?.textContent ?? null,
      pill: pill?.textContent ?? null,
      pillColor: pill ? getComputedStyle(pill).backgroundColor : null,
      win: q('[data-cv1-win]')?.dataset.cv1Win ?? null,
      winText: left.val?.textContent ?? null,
      winLabel: left.label?.textContent ?? null,
      lose: q('[data-cv1-lose]')?.dataset.cv1Lose ?? null,
      loseText: right.val?.textContent ?? null,
      loseLabel: right.label?.textContent ?? null,
      loseWord: !!q('.cv2-stat-val--word'),
      hasLvlChip: !!q('.cv2-lvl-chip'),
      hasPillsRow: !!q('.cv2-pills') || !!q('.cv2-label'),
      hasPowerMpCost: !!q('[data-cv1-power],[data-cv1-mp],[data-cv1-cost]'),
      hasDiamond: !!q('.ct-diamond--lit'),
      hasBadge: !!q('.cv1-badge'),
      hasQuestArt: !!q('.cv1-window > .cv2-quest-art'),
      boxed: card.classList.contains('card--boxed') && card.classList.contains('card--tier-1'),
      // footer: WIN, the pill and LOSE never touch each other
      footerClear: !pill || (
        Math.max(rect(left.val).right, labelHasText(left.label) ? rect(left.label).right : 0) <= rect(pill).left - 1
        && rect(pill).right <= Math.min(rect(right.val).left, labelHasText(right.label) ? rect(right.label).left : 1e9) - 1
      ),
      firstOverflow: q('.cv2-first').scrollWidth > q('.cv2-first').clientWidth + 1,
      firstLines: Math.round(rect(q('.cv2-first')).height / parseFloat(getComputedStyle(q('.cv2-first')).lineHeight)),
    };
  });
}

test.describe('card frame v1 — Quest (2.0 face)', () => {
  let ids;
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    ids = await page.evaluate(async () => {
      const { getCardsByType } = await import('/src/data/cardIndex.js');
      return getCardsByType('QUEST').filter((c) => c.stack).map((c) => c.id);
    });
    expect(ids.length).toBe(38);
    fs.mkdirSync(OUT, { recursive: true });
  });

  test('pop-up mode 440x660: stack colour, need, Rolls line, WIN / LOSE, no LVL chip, nothing collides', async ({ page }) => {
    await renderGallery(page, 'full', 440, ids);
    const zones = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    const faces = await page.evaluate(readFaces);
    const data = await page.evaluate(async (list) => {
      const { getCardById } = await import('/src/data/cardIndex.js');
      const { getQuestNeed } = await import('/src/ui/cardV1/getQuestNeed.js');
      const { formatQuestRollsLine } = await import('/src/ui/cardV1/formatQuestRollsLine.js');
      return Object.fromEntries(list.map((id) => {
        const c = getCardById(id);
        return [id, { stack: c.stack, win: String(c.win), lose: c.lose === null ? 'none' : String(c.lose), need: getQuestNeed(c), rolls: formatQuestRollsLine(c), noText: !c.costText && !c.extras }];
      }));
    }, ids);
    fs.writeFileSync(`${OUT}/quest-popup-metrics.json`, JSON.stringify(zones.map((z, i) => ({ ...z, ...faces[i] })), null, 2));
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/quest-popup.png` });

    expect(findFaceCollisions(zones), 'zones that collide or leave the card').toEqual([]);
    for (const [i, z] of zones.entries()) {
      const f = faces[i];
      const d = data[z.id];
      expect(z.face, `${z.id} uses the 2.0 face`).toBe(2);
      expect(f.boxed, `${z.id} tier-1 boxed frame`).toBe(true);
      // the whole card is in its stack colour
      expect(f.pill, `${z.id} pill text`).toBe(`${d.stack} QUEST`);
      expect(f.pillColor, `${z.id} pill colour`).toBe(STACK_COLOR[d.stack]);
      // dice need top-left with its label, and it stays clear of the divider
      expect(f.need, `${z.id} need`).toBe(d.need.value);
      expect(f.needVal, `${z.id} need value`).toBe(d.need.value);
      expect(f.needLabel, `${z.id} need label`).toBe(d.need.label);
      expect(f.needClear, `${z.id} need clears the divider`).toBe(true);
      expect(f.needLabelClear, `${z.id} need label clears the divider`).toBe(true);
      expect(f.info, `${z.id} Rolls line`).toBe(d.rolls);
      // WIN left, LOSE right (Trained: can't fail), pill between them
      expect(f.win, `${z.id} data-cv1-win`).toBe(d.win);
      expect(f.winText, `${z.id} WIN number`).toBe(`+${d.win}`);
      expect(f.winLabel, `${z.id} WIN label`).toBe('WIN');
      expect(f.lose, `${z.id} data-cv1-lose`).toBe(d.lose);
      if (d.lose === 'none') {
        expect(f.loseText, `${z.id} can't fail`).toBe("can't fail");
        expect(f.loseWord, `${z.id} can't fail is a word`).toBe(true);
        expect(f.loseLabel, `${z.id} no LOSE label when it cannot fail`).toBe('');
      } else {
        expect(f.loseText, `${z.id} LOSE number`).toBe(`−${Math.abs(Number(d.lose))}`);
        expect(f.loseLabel, `${z.id} LOSE label`).toBe('LOSE');
      }
      expect(f.footerClear, `${z.id} WIN / pill / LOSE overlap`).toBe(true);
      // what a Quest does not have
      expect(f.hasLvlChip, `${z.id} no LVL chip`).toBe(false);
      expect(f.hasPowerMpCost, `${z.id} no Power / MP / cost`).toBe(false);
      expect(f.hasPillsRow, `${z.id} no top pill row or label`).toBe(false);
      expect(f.hasDiamond, `${z.id} no lit diamond`).toBe(false);
      expect(f.hasBadge, `${z.id} no badge box`).toBe(false);
      // no real art yet: the stack-colour die placeholder shows
      expect(f.hasQuestArt, `${z.id} placeholder art`).toBe(true);
      // zones sit on the 42 edge at the stack bottoms (info 85 when there is one, footer numbers at 22)
      for (const k of ['corner', 'info']) if (z.zones[k]) expect(Math.abs(z.zones[k].l - 42), `${z.id} ${k} left`).toBeLessThanOrEqual(1);
      expect(Math.abs((z.height - z.zones.footer.b) - 22), `${z.id} footer bottom`).toBeLessThanOrEqual(1);
      if (z.zones.info) expect(Math.abs((z.height - z.zones.info.b) - 85), `${z.id} info bottom`).toBeLessThanOrEqual(1);
      // a Quest with no cost and no Also text has no text box at all
      expect(!!z.zones.textbox, `${z.id} text box exists exactly when there is text`).toBe(!d.noText);
      expect(f.firstOverflow, `${z.id} name overflow`).toBe(false);
      expect(f.firstLines, `${z.id} name lines`).toBeLessThanOrEqual(2);
      if (z.zones.textbox) expect(z.textPx, `${z.id} text size`).toBeGreaterThanOrEqual(11.5);
    }
  });

  test('field tile 240x176, hand 230 and small sizes: screenshots', async ({ page }) => {
    await renderGallery(page, 'field', 240, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/quest-field.png` });
    // 2.0 Quest tile: need, WIN, LOSE and 2 fail pips never overlap, at 240 and at 120
    const tiles = await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]');
    expect(tiles.every((t) => t.tile && t.zones.need && t.zones.win && t.zones.lose && t.zones.pips), 'every Quest tile has need, win, lose, pips').toBe(true);
    expect(findFaceCollisions(tiles), 'Quest tile zones collide at 240').toEqual([]);
    await renderGallery(page, 'field', 120, ids);
    expect(findFaceCollisions(await page.evaluate(collectFaceZones, '#cv1-gallery [data-test-card]')), 'Quest tile zones collide at 120').toEqual([]);
    await renderGallery(page, 'full', 230, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/quest-hand-230.png` });
    await renderGallery(page, 'full', 96, ids);
    await page.locator('#cv1-gallery').screenshot({ path: `${OUT}/quest-small.png` });
  });
});
