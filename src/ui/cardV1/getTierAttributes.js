// getTierAttributes.js — tier number, layout and root classes for a v1 card.
// Classes: card--tier-N + card--boxed|card--fullart, plus card--tierlayout
// only when that tier's new layout is switched on (isTierLayoutEnabled).
import { getRarityTier } from './getRarityTier.js';
import { isFullArt } from './isFullArt.js';
import { isTierLayoutEnabled } from './isTierLayoutEnabled.js';

export function getTierAttributes(card) {
  const tier = getRarityTier(card);
  const layout = isFullArt(tier) ? 'fullart' : 'boxed';
  const enabled = isTierLayoutEnabled(tier);
  const classes = `card--tier-${tier} card--${layout}${enabled ? ' card--tierlayout' : ''}`;
  return { tier, layout, classes, enabled };
}
