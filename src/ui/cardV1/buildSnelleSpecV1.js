// buildSnelleSpecV1.js — Snelle Piecie card -> 2.0 face spec (62-02 SPEC CONTRACT, consumed by buildPopupFace; gold).
// Corner = Energy cost (Blensen! "4 or free" -> 4 with the sub-line "or free"). Info line only from needsText
// (the lead sentence is dropped from the text box). Pill SNELLE, label "Instant · any turn". Only Blensen! has
// stays (it keeps its slot until end of turn). fieldPill + badge only feed the legacy field tile (until 62-05).
import { TYPE_COLORS } from './typeColors.js';
import { splitSentences } from './splitSentences.js';
import { splitNeedsLead } from './splitNeedsLead.js';
import { formatEnergyCost } from './formatEnergyCost.js';
import { formatCost } from './formatCost.js';

export function buildSnelleSpecV1(card) {
  return {
    face: 2,
    typeKey: 'SNELLE_PIECIE',
    colors: TYPE_COLORS.SNELLE,
    name: { first: String(card.name || 'Snelle'), nick: '' },
    corner: { hook: 'cost', ...formatEnergyCost(card) },
    lines: splitSentences(splitNeedsLead(card.description || '', card.needsText)),
    levelRows: [],
    info: card.needsText ? `Needs: ${card.needsText}` : '',
    pill: 'SNELLE',
    stays: Boolean(card.stays),
    label: 'Instant · any turn',
    footer: null,
    fieldPill: 'SNELLE',
    badge: formatCost(card.mpCost),
    card,
    allowLarge: true,
    fieldArtPos: '60% 40%',
  };
}
