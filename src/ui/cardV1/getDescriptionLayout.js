// getDescriptionLayout.js — pick description font size + bottom-fade height.
// Reference px at 440x660. Mosje text defaults to 14.5px; short Piecie/Snelle/Place
// text (allowLarge) is set bigger (18px for 1-2 rows, 16px for up to 3 rows), as in
// the reference. Long text steps down to 12.5px; the fade grows with the text.
// Returns { size, fade, overflow } — overflow is true when the text still will not
// fit at the minimum size (must be reported, never clipped silently).
const LINE_H = 1.5;
const GAP = 10;
const TEXT_W = 440 - 42 - 42;
const AVG_CHAR = 0.5; // average glyph width as a fraction of font size (DM Sans)
const BOTTOM = 114;
const NAME_BLOCK_BOTTOM = 40 + 42 + 20 * 1.2 + 7 + 24; // top + first name + nickname + gap
const MAX_FRACTION = 0.55;

function countRows(lines, size) {
  const perLine = Math.max(1, Math.floor(TEXT_W / (size * AVG_CHAR)));
  return lines.reduce((sum, l) => sum + Math.max(1, Math.ceil(l.length / perLine)), 0);
}

function estimateHeight(lines, size) {
  return countRows(lines, size) * size * LINE_H + Math.max(0, lines.length - 1) * GAP;
}

export function getDescriptionLayout(lines, { allowLarge = false, minFade = 380 } = {}) {
  const limit = Math.min(MAX_FRACTION * 660, 660 - BOTTOM - NAME_BLOCK_BOTTOM);
  let size = null;
  if (allowLarge) {
    if (countRows(lines, 18) <= 2) size = 18;
    else if (countRows(lines, 16) <= 3) size = 16;
  }
  let fits = size !== null;
  if (size === null) {
    size = 12.5;
    for (const candidate of [14.5, 14, 13.5, 13, 12.5]) {
      if (estimateHeight(lines, candidate) <= limit) { size = candidate; fits = true; break; }
    }
  }
  const height = estimateHeight(lines, size);
  const short = !allowLarge && lines.length <= 1 && height < 60;
  const fade = short ? 250 : Math.min(440, Math.max(minFade, Math.round(height + BOTTOM + 90)));
  return { size, fade, overflow: !fits };
}
