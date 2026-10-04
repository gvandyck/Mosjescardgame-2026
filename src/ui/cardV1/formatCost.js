// formatCost.js — cost badge content for Piecie/Snelle: "Free" or the MP number.
// Free is shown in smaller type (word) and labelled COST; numbers are labelled MP COST
// in the pop-up. The field tile always uses COST.
export function formatCost(mpCost) {
  const cost = Number(mpCost) || 0;
  if (cost <= 0) return { value: 'Free', label: 'COST', fieldLabel: 'COST', word: true };
  return { value: String(cost), label: 'MP COST', fieldLabel: 'COST' };
}
