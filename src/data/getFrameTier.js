// Phase 53 (Phase 7 A1): frame tier derived from rules rarity; never changes rarity.
// Mosjes are always full art (tier 4), tier 5 when 5 stars or foil. Quests always tier 1.
export function getFrameTier(card) {
  const stars = (String(card?.rarity ?? '').match(/★/g) || []).length;
  if (card?.type === 'MOSJE') return stars >= 5 || card.foil === true ? 5 : 4;
  if (card?.type === 'QUEST') return 1;
  return Math.min(5, Math.max(1, stars));
}
