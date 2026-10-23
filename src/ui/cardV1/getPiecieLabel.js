// getPiecieLabel.js — the label under a Piecie pill: its tag first, else its group (Phase 7 A5, D-07).
const TAG_LABELS = { food: 'Food', gear: 'Gear', substance: 'Substance', pet: 'Pet' };
const GROUP_LABELS = { mp: 'MP', attack: 'Attack', utility: 'Utility' };

export function getPiecieLabel(card) {
  return TAG_LABELS[card?.tag] || GROUP_LABELS[card?.group] || '';
}
