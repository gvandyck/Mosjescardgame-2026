// isFullArt.js — tier 4 (no foil) and tier 5 (full foil) use the full-art layout; tiers 1-3 are boxed.
export function isFullArt(tier) {
  return tier >= 4;
}
