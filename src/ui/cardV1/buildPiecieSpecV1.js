// buildPiecieSpecV1.js — Piecie card -> 2.0 face spec (62-02 SPEC CONTRACT, consumed by buildPopupFace; green).
// Corner = Energy cost (0 stays "0"). The info line is "Needs: <needsText>" only on cards that have one (D-03),
// and that same lead sentence is dropped from the text box (splitNeedsLead), so it is never shown twice.
// Label = the tag first (Food / Gear / Substance / Pet), else the group (MP / Attack / Utility) (D-07);
// stays turns on the STAYS chip beside the pill. fieldPill + badge only feed the legacy field tile (until 62-05).
import { TYPE_COLORS } from './typeColors.js';
import { splitSentences } from './splitSentences.js';
import { splitNeedsLead } from './splitNeedsLead.js';
import { getPiecieLabel } from './getPiecieLabel.js';
import { formatEnergyCost } from './formatEnergyCost.js';
import { formatCost } from './formatCost.js';

export function buildPiecieSpecV1(card) {
  return {
    face: 2,
    typeKey: 'PIECIE',
    colors: TYPE_COLORS.PIECIE,
    name: { first: String(card.name || 'Piecie'), nick: '' },
    corner: { hook: 'cost', ...formatEnergyCost(card) },
    lines: splitSentences(splitNeedsLead(card.description || '', card.needsText)),
    levelRows: [],
    info: card.needsText ? `Needs: ${card.needsText}` : '',
    pill: 'PIECIE',
    stays: Boolean(card.stays),
    label: getPiecieLabel(card),
    footer: null,
    fieldPill: 'PIECIE',
    badge: formatCost(card.mpCost),
    card,
    allowLarge: true,
    fieldArtPos: '50% 45%',
  };
}
