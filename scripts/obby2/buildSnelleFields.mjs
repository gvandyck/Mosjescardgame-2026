// Dev-only: 2.0 fields for one Snelle row.
import { STAYS_BY_ID } from './staysById.mjs';
import { GIVES_MP_IDS } from './givesMpIds.mjs';

export function buildSnelleFields(row, id) {
  const fiveStar = (row.rarity.match(/★/g) || []).length === 5;
  const fields = {
    name: row.name,
    rarity: row.rarity,
    description: row.text,
    cost: row.cost,
    costText: row.costText,
    tag: null,
    stays: STAYS_BY_ID[id] ?? null,
    levelGate: null,
    limitPerDeck: fiveStar || id === 'snelle_the_protector' ? 1 : 2,
    givesMP: GIVES_MP_IDS.includes(id),
  };
  return { fields, comments: {} };
}
