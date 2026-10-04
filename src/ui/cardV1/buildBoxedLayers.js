// buildBoxedLayers.js — background layers of the boxed tier layout (tiers 1-3),
// RARITY-TIERS-DESIGN.md sec. 4 layers 2-7 in order: waves, calm gradients,
// grain, top-left light, inner line, then tier chrome (diamonds + side text).
// Tier 3 wraps the waves with a rainbow tint and draws the inner line as a
// foil ring (inside the break-masked .ct-inner wrapper), see buildFoilLayers.
// All styling lives in styles/card-tiers-boxed.css + card-tiers-foil.css.
import { buildTierChrome } from './buildTierChrome.js';

export function buildBoxedLayers(tier) {
  const foil = tier === 3;
  const waves = foil
    ? '<i class="ct-waves-wrap"><i class="ct-waves"></i><i class="ct-rb ct-foil-anim"></i></i>'
    : '<i class="ct-waves"></i>';
  const inner = foil
    ? '<i class="ct-inner ct-inner--t3"><i class="ct-ring ct-foil ct-foil-anim"></i></i>'
    : `<i class="ct-inner ct-inner--t${tier}"></i>`;
  return waves
    + '<i class="ct-calm ct-calm--top"></i><i class="ct-calm ct-calm--bottom"></i>'
    + '<i class="ct-grain"></i><i class="ct-light"></i>'
    + inner
    + buildTierChrome(tier);
}
