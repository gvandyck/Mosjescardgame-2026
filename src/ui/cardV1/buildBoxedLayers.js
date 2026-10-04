// buildBoxedLayers.js — background layers of the boxed tier layout (tiers 1-3),
// RARITY-TIERS-DESIGN.md sec. 4 layers 2-7 in order: waves, calm gradients,
// grain, top-left light, inner line, then tier chrome (diamonds + side text).
// All styling lives in styles/card-tiers-boxed.css.
import { buildTierChrome } from './buildTierChrome.js';

export function buildBoxedLayers(tier) {
  return '<i class="ct-waves"></i>'
    + '<i class="ct-calm ct-calm--top"></i><i class="ct-calm ct-calm--bottom"></i>'
    + '<i class="ct-grain"></i><i class="ct-light"></i>'
    + `<i class="ct-inner ct-inner--t${tier}"></i>`
    + buildTierChrome(tier);
}
