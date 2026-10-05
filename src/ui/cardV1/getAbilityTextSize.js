// getAbilityTextSize.js — ability text size (reference px at 440 wide) for
// tier-layout cards. Length/line-count rule, never per card:
// Maximum is 15 (Call of the Welloes' size, Gandalf's pick): short texts no longer grow bigger.
// full art: Mosje 14; up to 3 short lines 15; else 14.
// boxed: same, and very long text 13 (the plate has
// a fixed height; brief: shrink to 13 before clipping).
const ONE_SENTENCE_MAX = 110;
const SHORT_TOTAL_MAX = 240;
const BOXED_LONG_MIN = 360;

export function getAbilityTextSize({ lines = [], typeKey = '', layout = 'fullart' } = {}) {
  const type = String(typeKey).toUpperCase();
  const total = lines.reduce((sum, l) => sum + String(l).length, 0);
  const boxed = layout === 'boxed';
  if (layout !== 'fullart' && !boxed) return 14;
  if (boxed && total >= BOXED_LONG_MIN) return 13;
  if (type === 'MOSJE') return 14;
  if (lines.length <= 1 && total <= ONE_SENTENCE_MAX) return 15;
  if (lines.length <= 3 && total <= SHORT_TOTAL_MAX) return 15;
  return 14;
}
