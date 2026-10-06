// buildTierChrome.js — rarity-tier chrome for tier-layout cards: 5 tier
// diamonds (the first `tier` lit) and the two OBBY CARD GAME side labels.
// Replaces the E1 stripes + 3 diamonds (RARITY-TIERS-DESIGN.md sec. 3.1).
export function buildTierChrome(tier) {
  const diamonds = [0, 1, 2, 3, 4]
    .map((i) => `<i class="ct-diamond ct-diamond--${i + 1}${i < tier ? ' ct-diamond--lit' : ''}"></i>`)
    .join('');
  return `${diamonds}<div class="ct-side ct-side--l">OBBY CARD GAME</div><div class="ct-side ct-side--r">OBBY CARD GAME</div>`;
}
