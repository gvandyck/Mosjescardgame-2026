// getDescriptionLayout.js — pick description font size + bottom-fade height.
// Reference px at 440x660. Default 14.5px; long text steps down to 12.5px; the
// fade grows with the text. Returns { size, fade, overflow } — overflow is true
// when the text still will not fit at the minimum size (must be reported).
const LINE_H = 1.5;
const GAP = 10;
const TEXT_W = 440 - 42 - 42;
const AVG_CHAR = 0.5; // average glyph width as a fraction of font size (DM Sans)
const BOTTOM = 114;
const NAME_BLOCK_BOTTOM = 40 + 42 + 20 * 1.2 + 7 + 24; // top + first name + nickname + gap
const MAX_FRACTION = 0.55;

function estimateHeight(lines, size) {
  const perLine = Math.max(1, Math.floor(TEXT_W / (size * AVG_CHAR)));
  const rows = lines.reduce((sum, l) => sum + Math.max(1, Math.ceil(l.length / perLine)), 0);
  return rows * size * LINE_H + Math.max(0, lines.length - 1) * GAP;
}

export function getDescriptionLayout(lines) {
  const sizes = [14.5, 14, 13.5, 13, 12.5];
  const limit = Math.min(MAX_FRACTION * 660, 660 - BOTTOM - NAME_BLOCK_BOTTOM);
  let chosen = sizes[sizes.length - 1];
  let fits = false;
  for (const size of sizes) {
    if (estimateHeight(lines, size) <= limit) { chosen = size; fits = true; break; }
  }
  const height = estimateHeight(lines, chosen);
  const short = lines.length <= 1 && height < 60;
  const fade = short ? 250 : Math.min(440, Math.max(380, Math.round(height + BOTTOM + 90)));
  return { size: chosen, fade, overflow: !fits };
}
