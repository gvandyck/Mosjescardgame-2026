// getTierAttributes.js — frame tier, layout and root classes for a v1 card (Phase 7 A1).
// The tier is the FRAME tier from getFrameTier (Mosje 4, or 5 with ★★★★★ / foil; Quest 1; others by
// rarity). The rarity diamonds are separate: they show the rules rarity (getRarityDiamonds).
import { getFrameTier } from '../../data/getFrameTier.js';
import { getRarityDiamonds } from './getRarityDiamonds.js';
import { isFullArt } from './isFullArt.js';

export function getTierAttributes(card) {
  const tier = getFrameTier(card);
  const layout = isFullArt(tier) ? 'fullart' : 'boxed';
  return {
    tier,
    layout,
    classes: `card--tier-${tier} card--${layout} card--tierlayout`,
    enabled: true,
    diamonds: getRarityDiamonds(card),
    foil: tier === 5,
  };
}
