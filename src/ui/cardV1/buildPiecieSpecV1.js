// buildPiecieSpecV1.js — Piecie card -> face spec (green). Name only, "Requires: ..."
// info line, PIECIE pill, sub-category border text, cost badge.
import { TYPE_COLORS } from './typeColors.js';
import { splitSentences } from './splitSentences.js';
import { getRequirementText } from './getRequirementText.js';
import { getPiecieCategoryLabel } from './getPiecieCategoryLabel.js';
import { formatCost } from './formatCost.js';

export function buildPiecieSpecV1(card) {
  return {
    colors: TYPE_COLORS.PIECIE,
    name: { first: String(card.name || 'Piecie'), nick: '' },
    lines: splitSentences(card.description || ''),
    info: `Requires: ${getRequirementText(card.requirement)}`,
    pill: 'PIECIE',
    fieldPill: 'PIECIE',
    borderText: getPiecieCategoryLabel(card.subtype),
    badge: formatCost(card.mpCost),
    card,
    allowLarge: true,
    fieldArtPos: '50% 45%',
  };
}
