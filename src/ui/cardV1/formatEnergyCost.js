// formatEnergyCost.js — 2.0 cost block content: the Energy number, label COST, optional sub-line.
// 0 renders "0", never a word; Blensen! "4 or free" -> value 4, sub "or free".
export function formatEnergyCost(card) {
  const value = String(Math.max(0, Number(card?.cost) || 0));
  const m = String(card?.costText ?? '').match(/^\s*\d+\s+(.+)$/);
  return { value, label: 'COST', sub: m ? m[1].trim() : '' };
}
