// faceZones.js — shared by every card-face browser spec (Phase 62).
// collectFaceZones(selector) is SELF-CONTAINED: pass it to page.evaluate(collectFaceZones, selector). It measures
// every matched rendered card in the page; findFaceCollisions(rows) then runs in Node on the result.
// 2.0 faces (.cv1-face--2): the rect of each zone relative to the card (null when absent) plus the text checks.
// 2.0 field tiles (.cv2-tile, 62-05): the rects of name, L chip, Power, MP, pills, need, WIN, LOSE and fail pips (63-06: the
// tile has no Activate / ability button any more, those are chips in the action tray; Phase 63 overlays such as the state
// badges in .tile-badges sit over the art by design and are ignored).

export function collectFaceZones(selector) {
  const ZONES = {
    corner: '.cv2-corner', name: '.cv2-name', textbox: '.cv2-textbox', info: '.cv2-info',
    pills: '.cv2-pills', label: '.cv2-label', footer: '.cv2-footer',
  };
  const TILE_ZONES = {
    name: '.cv2-tile-name', lvl: '.cv2-tile-lvl', power: '[data-cv1-power]', mp: '[data-cv1-mp]',
    pills: '.cv2-tile-pills', need: '.cv2-tile-need', win: '[data-cv1-win]', lose: '[data-cv1-lose]',
    pips: '.cv2-tile-pips',
  };
  const round = (n) => Math.round(n * 10) / 10;
  return [...document.querySelectorAll(selector)].map((card) => {
    const c = card.getBoundingClientRect();
    const q = (s) => card.querySelector(s);
    const rect = (s) => {
      const el = q(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { l: round(r.left - c.left), t: round(r.top - c.top), r: round(r.right - c.left), b: round(r.bottom - c.top) };
    };
    const id = card.dataset.testCard || card.dataset.cardId || '?';
    if (q('.cv2-tile')) {
      return {
        id, width: c.width, height: c.height, face: 2, tile: true,
        zones: Object.fromEntries(Object.entries(TILE_ZONES).map(([key, sel]) => [key, rect(sel)])),
        textOverflow: false, clamped: false,
      };
    }
    if (q('.cv1-face--2')) {
      const text = q('.cv2-text');
      const rows = [...card.querySelectorAll('.cv2-level-row')];
      const visible = rows.filter((el) => getComputedStyle(el).display !== 'none');
      const first = q('.cv2-first');
      return {
        id, width: c.width, height: c.height, face: 2,
        zones: Object.fromEntries(Object.entries(ZONES).map(([key, sel]) => [key, rect(sel)])),
        textOverflow: !!text && text.scrollHeight > text.clientHeight + 1,
        clamped: q('.cv1-face--2').dataset.cv1Clamped === 'true',
        textPx: text ? parseFloat(getComputedStyle(text).fontSize) : null,
        visibleRows: visible.length,
        litRows: visible.filter((el) => el.dataset.lit === 'true').map((el) => el.dataset.cv1LevelRow),
        rowOverflow: visible.some((el) => el.scrollWidth > el.clientWidth + 1),
        firstPx: first ? parseFloat(getComputedStyle(first).fontSize) : null,
        firstOverflow: !!first && first.scrollWidth > (q('.cv2-name')?.clientWidth ?? 0) + 1,
      };
    }
    return { id, width: c.width, height: c.height, face: 0, zones: {} }; // no 2.0 face (an unknown type or a V4 Quest on the unified template)
  });
}

const overlap = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;

/** Strings `${id}: a x b` (two zones overlap by more than 1px on both axes), `${id}: a outside` (a zone leaves the card
 *  by more than 1px) and `${id}: overflow not flagged` (text runs out of its box without data-cv1-clamped)
 *  and `${id}: not a 2.0 face` (the card has neither a 2.0 face nor a 2.0 tile). [] = collision-free. */
export function findFaceCollisions(rows) {
  const out = [];
  for (const row of rows) {
    if (row.face === 0) { out.push(`${row.id}: not a 2.0 face`); continue; }
    const present = Object.entries(row.zones).filter(([, rect]) => rect);
    for (let i = 0; i < present.length; i += 1) {
      for (let j = i + 1; j < present.length; j += 1) {
        if (overlap(present[i][1], present[j][1])) out.push(`${row.id}: ${present[i][0]} x ${present[j][0]}`);
      }
      const z = present[i][1];
      if (z.l < -1 || z.t < -1 || z.r > row.width + 1 || z.b > row.height + 1) out.push(`${row.id}: ${present[i][0]} outside`);
    }
    if (row.textOverflow && !row.clamped) out.push(`${row.id}: overflow not flagged`);
  }
  return out;
}
