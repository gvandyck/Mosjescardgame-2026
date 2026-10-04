// buildSnelleSpecV1.js — Snelle Piecie card -> face spec (gold). Name only, "Requires: ..."
// info line, SNELLE pill, "Instant - play any time" border text, cost badge.
import { TYPE_COLORS } from './typeColors.js';
import { splitSentences } from './splitSentences.js';
import { getRequirementText } from './getRequirementText.js';
import { formatCost } from './formatCost.js';

export function buildSnelleSpecV1(card) {
  return {
    colors: TYPE_COLORS.SNELLE,
    name: { first: String(card.name || 'Snelle'), nick: '' },
    lines: splitSentences(card.description || ''),
    info: `Requires: ${getRequirementText(card.requirement)}`,
    pill: 'SNELLE',
    fieldPill: 'SNELLE',
    borderText: 'Instant - play any time',
    badge: formatCost(card.mpCost),
    card,
    allowLarge: true,
    fieldArtPos: '60% 40%',
  };
}
