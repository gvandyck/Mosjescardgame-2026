// getAbilityTextSize.js — ability text size (reference px at 440 wide) for
// tier-layout cards. ONE size for every card type (16), so descriptions read the same everywhere.
// Only long text in a boxed plate (fixed height) steps down, before it would clip:
// 200+ chars -> 17, 300+ chars -> 16.
const BASE_SIZE = 18;
const BOXED_STEPS = [[300, 16], [200, 17]];

export function getAbilityTextSize({ lines = [], layout = 'fullart' } = {}) {
  if (layout !== 'boxed') return BASE_SIZE;
  const total = lines.reduce((sum, l) => sum + String(l).length, 0);
  const step = BOXED_STEPS.find(([min]) => total >= min);
  return step ? step[1] : BASE_SIZE;
}
