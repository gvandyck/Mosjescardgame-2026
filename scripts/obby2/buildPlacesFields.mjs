// Dev-only: 2.0 fields for one Place row. trigger/effectId/tags/isBoosterOnly are untouched.
export function buildPlacesFields(row) {
  const fiveStar = (row.rarity.match(/★/g) || []).length === 5;
  const fields = {
    name: row.name,
    rarity: row.rarity,
    description: row.text,
    goodFor: row.goodFor,
    badFor: row.badFor,
    cost: row.cost,
    limitPerDeck: fiveStar ? 1 : 2,
  };
  return { fields, comments: {} };
}
