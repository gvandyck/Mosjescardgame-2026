// getRarityDiamonds.js — how many rarity diamonds a face lights: the ★ count of the rules rarity, 1..5.
// Quests have no rarity (Phase 7 A7) and light none. Missing or malformed rarity -> 1.
export function getRarityDiamonds(card) {
  if (String(card?.type || '').toUpperCase() === 'QUEST') return 0;
  const rarity = typeof card?.rarity === 'string' ? card.rarity : '';
  const count = (rarity.match(/★/g) || []).length;
  return Math.min(5, Math.max(1, count || 1));
}
