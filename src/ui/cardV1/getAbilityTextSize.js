// getAbilityTextSize.js — ability text size (reference px at 440 wide) for
// tier-layout cards. Length/line-count rule, never per card:
// Maximum is 17 (was 15; bumped +2 on Gandalf's request - descriptions were hard to read).
// full art: Mosje 16; up to 3 short lines 17; else 16.
// boxed: same, and very long text 15 (the plate has
// a fixed height; brief: shrink to 15 before clipping).
const ONE_SENTENCE_MAX = 110;
const SHORT_TOTAL_MAX = 240;
const BOXED_LONG_MIN = 360;

export function getAbilityTextSize({ lines = [], typeKey = '', layout = 'fullart' } = {}) {
  const type = String(typeKey).toUpperCase();
  const total = lines.reduce((sum, l) => sum + String(l).length, 0);
  const boxed = layout === 'boxed';
  if (layout !== 'fullart' && !boxed) return 16;
  if (boxed && total >= BOXED_LONG_MIN) return 15;
  if (type === 'MOSJE') return 16;
  if (lines.length <= 1 && total <= ONE_SENTENCE_MAX) return 17;
  if (lines.length <= 3 && total <= SHORT_TOTAL_MAX) return 17;
  return 16;
}
