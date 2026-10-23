// getAbilityTextSize.js — ability text size (reference px at 440 wide) for
// tier-layout cards. ONE size (18) for every card type, so descriptions read the same everywhere.
// Boxed plate (fixed height): long text steps down by length first (200+ chars -> 17, 300+ -> 16), then keeps
// stepping down until the estimated height fits the plate, never below FLOOR. Text that still does not fit at
// the floor is reported by getBoxedTextFit (the plate then clips; the detail view shows everything).
const BASE_SIZE = 18;
const BOXED_STEPS = [[300, 16], [200, 17]];
const FIT_SIZES = [18, 17, 16, 15, 14, 13, 12.5, 12, 11.5];
const FLOOR = FIT_SIZES[FIT_SIZES.length - 1];
// Boxed plate: 440 - 2 x 24 wide minus 2 x 18 padding; 186 high minus 2 x 16 padding; line-height 1.26; 7px between paragraphs.
const PLATE_W = 440 - 48 - 36;
const PLATE_H = 186 - 32;
const LINE_H = 1.26;
const GAP = 7;
const AVG_CHAR = 0.47; // average glyph width as a fraction of font size (DM Sans)

function estimateHeight(lines, size) {
  const perLine = Math.max(1, Math.floor(PLATE_W / (size * AVG_CHAR)));
  const rows = lines.reduce((sum, l) => sum + Math.max(1, Math.ceil(String(l).length / perLine)), 0);
  return rows * size * LINE_H + Math.max(0, lines.length - 1) * GAP;
}

/** { size, fits } for a boxed plate: the largest size at or below the length ladder whose text fits the plate. */
export function getBoxedTextFit(lines = []) {
  const total = lines.reduce((sum, l) => sum + String(l).length, 0);
  const step = BOXED_STEPS.find(([min]) => total >= min);
  const ladder = step ? step[1] : BASE_SIZE;
  const size = FIT_SIZES.find((s) => s <= ladder && estimateHeight(lines, s) <= PLATE_H);
  return size ? { size, fits: true } : { size: FLOOR, fits: false };
}

export function getAbilityTextSize({ lines = [], layout = 'fullart' } = {}) {
  if (layout !== 'boxed') return BASE_SIZE;
  return getBoxedTextFit(lines).size;
}
