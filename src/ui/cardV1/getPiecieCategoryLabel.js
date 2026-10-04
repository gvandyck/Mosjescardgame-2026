// getPiecieCategoryLabel.js — border text for a Piecie: its sub-category, taken from the
// card subtype (the data categories; nothing is invented). PET is shown as
// "Pet Protection" per HANDOFF.
const LABELS = {
  'MOMENTUM-GAINING': 'Momentum-Gaining',
  UTILITY: 'Utility',
  ATTACK: 'Attack',
  SUBSTANCE: 'Substance',
  'DIGITAL-EQUIPMENT': 'Digital Equipment',
  'PHYSICAL-EQUIPMENT': 'Physical Equipment',
  PET: 'Pet Protection',
};

export function getPiecieCategoryLabel(subtype) {
  const key = String(subtype || '').toUpperCase();
  if (LABELS[key]) return LABELS[key];
  return key.toLowerCase().split('-').map((w) => `${w.charAt(0).toUpperCase()}${w.slice(1)}`).join(' ');
}
