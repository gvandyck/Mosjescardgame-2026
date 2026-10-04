// buildFoilLayers.js — tier 3 (rare) foil markup, CardTiers7/8 tier-3 card.
// frame: foil art ring (outer rect 19 / 119, 234 high) that sits over the
// art window border. window: cosmos dots + rainbow sheen; must stay DIRECT
// children of .cv1-window so their blend modes mix with the art.
// Styling lives in styles/card-tiers-foil.css.
export function buildFoilLayers() {
  return {
    frame: '<i class="ct-art-ring ct-ring ct-foil ct-foil-anim"></i>',
    window: '<i class="ct-cosmos"></i><i class="ct-rainbow ct-foil-anim"></i>',
  };
}
