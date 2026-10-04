// getAbilityTextSize.js — ability text size (reference px at 440 wide) for
// tier-layout cards. Length/line-count rule, never per card:
// full art: Mosje 14; one short sentence 18; up to 3 short lines 15; else 14.
// `layout` is part of the signature so the boxed values (50-03) slot in here.
const ONE_SENTENCE_MAX = 110;
const SHORT_TOTAL_MAX = 240;

export function getAbilityTextSize({ lines = [], typeKey = '', layout = 'fullart' } = {}) {
  const type = String(typeKey).toUpperCase();
  const total = lines.reduce((sum, l) => sum + String(l).length, 0);
  if (layout !== 'fullart') return 14;
  if (type === 'MOSJE') return 14;
  if (lines.length <= 1 && total <= ONE_SENTENCE_MAX) return 18;
  if (lines.length <= 3 && total <= SHORT_TOTAL_MAX) return 15;
  return 14;
}
