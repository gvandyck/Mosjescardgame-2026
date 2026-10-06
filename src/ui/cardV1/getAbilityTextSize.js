// getAbilityTextSize.js — ability text size (reference px at 440 wide) for
// tier-layout cards. ONE size for every card type (16), so descriptions read the same everywhere.
// Only long text in a boxed plate (fixed height) steps down, before it would clip:
// 230+ chars -> 15, 330+ chars -> 14.
const BASE_SIZE = 16;
const BOXED_STEPS = [[330, 14], [230, 15]];

export function getAbilityTextSize({ lines = [], layout = 'fullart' } = {}) {
  if (layout !== 'boxed') return BASE_SIZE;
  const total = lines.reduce((sum, l) => sum + String(l).length, 0);
  const step = BOXED_STEPS.find(([min]) => total >= min);
  return step ? step[1] : BASE_SIZE;
}
