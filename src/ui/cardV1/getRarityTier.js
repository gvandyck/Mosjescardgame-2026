// getRarityTier.js — rarity tier 1..4 from the star count of card.rarity.
// Missing or malformed rarity -> tier 1; 5+ stars are capped at tier 4.
export function getRarityTier(card) {
  const rarity = card && typeof card.rarity === 'string' ? card.rarity : '';
  const count = (rarity.match(/★/g) || []).length;
  return Math.min(4, Math.max(1, count || 1));
}
