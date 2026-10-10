// Dev-only: 2.0 fields for one Quest row. V4 description/roll/successMP/failMP/rarity are kept.
import { QUEST_COST_IDS } from './questCostIds.mjs';
import { composeQuestText } from './composeQuestText.mjs';

function rollTrait(rolls) {
  if (/^no (roll|trait)$/i.test(rolls)) return 'none';
  if (/best trait/i.test(rolls)) return 'best';
  return rolls.toLowerCase();
}

export function buildQuestsFields(row, id, parsed) {
  let costId = null;
  if (row.costText) {
    costId = QUEST_COST_IDS[row.costText];
    if (!costId) throw new Error(`No costId for "${row.costText}" on ${id}`);
  }
  const fields = {
    name: row.name,
    text: composeQuestText(row, parsed.bands),
    stack: row.stack,
    band: row.band,
    rollTrait: rollTrait(row.rolls),
    costText: row.costText,
    costId,
    win: row.win,
    lose: row.lose,
    extras: row.extras,
  };
  return { fields, comments: {} };
}
