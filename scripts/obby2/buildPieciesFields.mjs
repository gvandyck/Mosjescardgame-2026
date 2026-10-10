// Dev-only: 2.0 fields for one Piecie row.
import { STAYS_BY_ID } from './staysById.mjs';
import { GIVES_MP_IDS } from './givesMpIds.mjs';

export function buildPieciesFields(row, id) {
  const fiveStar = (row.rarity.match(/★/g) || []).length === 5;
  const fields = {
    name: row.name,
    rarity: row.rarity,
    description: row.text,
    cost: row.cost,
    tag: row.tag,
    group: row.group,
    stays: STAYS_BY_ID[id] ?? null,
    levelGate: row.text.startsWith('Needs: one of your Mosjes at Level 2+') ? 2 : null,
    limitPerDeck: fiveStar || id === 'piecie_mosje_reborn' ? 1 : 2,
    givesMP: GIVES_MP_IDS.includes(id),
  };
  const comments = {};
  if (id === 'piecie_tikker' || id === 'piecie_mp_hemorrhage') comments.stays = 'TODO(phase 59): confirm';
  if (id === 'piecie_mp_amplifier' || id === 'piecie_synergy_field') comments.givesMP = 'TODO(phase 59): confirm';
  return { fields, comments };
}
