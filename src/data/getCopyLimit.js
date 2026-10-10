// Phase 53: copies allowed per deck. Explicit limitPerDeck wins; else 1 for 5 stars, else 2.
export function getCopyLimit(card) {
  if (Number.isInteger(card?.limitPerDeck)) return card.limitPerDeck;
  const stars = (String(card?.rarity ?? '').match(/★/g) || []).length;
  return stars >= 5 ? 1 : 2;
}
