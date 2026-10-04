// getTierFadeHeight.js — bottom gradient height (reference px) for tier-layout
// cards. Long Mosje abilities (3+ sentences or over LONG_TOTAL chars) get the
// board's 380px; everything else uses 270 (board range 250-300).
const LONG_TOTAL = 200;

export function getTierFadeHeight({ typeKey = '', lines = [] } = {}) {
  const total = lines.reduce((sum, l) => sum + String(l).length, 0);
  const isMosje = String(typeKey).toUpperCase() === 'MOSJE';
  if (isMosje && (lines.length >= 3 || total > LONG_TOTAL)) return 380;
  return 270;
}
