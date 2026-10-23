// getTextBoxLayout.js — text size for the 2.0 frosted text box (62-UI-SPEC, D-02).
// Ability text starts at 14.5, steps to 13, floors at 11.5; text that still does not fit is
// clamped (bottom fade + "…") instead of shrinking further. The 3 Mosje level rows keep their
// room, so they take it from the text first. Pure estimate in reference px at 440 wide.
// The numbers mirror styles/card-face-2-0.css: text box max 304 (46% of 660), boxed 366..552 = 186,
// inner width 440 - 2 x 30 - 2 x 14 = 352, padding 12 + 12.
import { TEXT_SIZES } from './faceTokens.js';

const INNER_W = 440 - 2 * 30 - 2 * 14;
const BOX_H = { fullart: 304, boxed: 186 };
const PAD_Y = 24;
const LINE_H = 1.5; // ability text line height
const GAP = 5; // between paragraphs
const GLYPH = 0.55; // average DM Sans glyph width as a fraction of the font size (a little wide on purpose)
const ROW_H = 11.5 * 1.35; // one level row
const ROWS_PAD = 16; // level block padding + the gap above it
const INFO_W = 356; // info line width (stack width minus its 12 + 12 inset)
const INFO_SIZE = 12.5;
const INFO_LINE_H = 16.5;

function estimateHeight(lines, size) {
  const rows = lines.reduce((sum, l) => sum + Math.max(1, Math.ceil((String(l).length * size * GLYPH) / INNER_W)), 0);
  return rows * size * LINE_H + Math.max(0, lines.length - 1) * GAP;
}

/** { size, clamped }: the largest size whose estimated height fits the room the text box has left. */
export function getTextBoxLayout({ lines = [], levelRowCount = 0, layout = 'fullart', info = '' } = {}) {
  const infoLines = Math.ceil((String(info).length * INFO_SIZE * GLYPH) / INFO_W);
  const rowsBlock = levelRowCount ? levelRowCount * ROW_H + ROWS_PAD : 0;
  const available = (BOX_H[layout] ?? BOX_H.fullart) - PAD_Y - rowsBlock - Math.max(0, infoLines - 1) * INFO_LINE_H;
  const fit = TEXT_SIZES.find((size) => estimateHeight(lines, size) <= available);
  return fit ? { size: fit, clamped: false } : { size: TEXT_SIZES[TEXT_SIZES.length - 1], clamped: true };
}
