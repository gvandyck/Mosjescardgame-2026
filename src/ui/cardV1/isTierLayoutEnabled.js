// isTierLayoutEnabled.js — per-tier rollout gate for the rarity-tier redesign.
// Tiers not in IMPLEMENTED_TIERS keep the current E1 face. URL overrides:
// ?tiers=all forces every tier on (demo page), ?tiers=off forces all off.
const IMPLEMENTED_TIERS = new Set([1, 2, 4]);

export function isTierLayoutEnabled(tier) {
  let param = null;
  try {
    param = new URLSearchParams(window.location.search).get('tiers');
  } catch {
    param = null;
  }
  if (param === 'all') return true;
  if (param === 'off') return false;
  return IMPLEMENTED_TIERS.has(tier);
}
