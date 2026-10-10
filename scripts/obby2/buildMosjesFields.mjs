// Dev-only: 2.0 fields for one Mosje row.
import { MOSJE_SYNERGY_LABELS } from './mosjeSynergyLabels.mjs';
import { FOIL_MOSJE_IDS } from './foilMosjeIds.mjs';

export function buildMosjesFields(row, id) {
  const fields = {
    name: row.name,
    rarity: row.rarity,
    startMP: row.startMP,
    abilityDescription: row.abilities.map((a) => `${a.name}: ${a.text}`).join(' '),
    synergyEffect: row.holderText ?? null,
    cost: row.cost,
    levels: row.levels,
    abilityName: row.abilities[0].name,
    synergyLabel: MOSJE_SYNERGY_LABELS[id] ?? [],
    limitPerDeck: (row.rarity.match(/★/g) || []).length === 5 ? 1 : 2,
    foil: FOIL_MOSJE_IDS.includes(id),
  };
  return { fields, comments: {} };
}
