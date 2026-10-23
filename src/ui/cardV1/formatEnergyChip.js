// formatEnergyChip.js — the Energy cost as a chip / tile line outside the card face: "0 Energy", "3 Energy",
// Blensen! "4 Energy or free". Same numbers as the face corner (formatEnergyCost); 0 renders "0", never "Free".
// Returns plain text; the caller escapes it.
import { formatEnergyCost } from './formatEnergyCost.js';

export function formatEnergyChip(card) {
  const { value, sub } = formatEnergyCost(card);
  return `${value} Energy${sub ? ` ${sub}` : ''}`;
}
