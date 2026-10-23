// formatSynergyLabel.js — the "Synergy: <partners>" line of a Mosje that has a synergy partner but no
// "While ..." text of its own. The partners are the Card List short names (card.synergyLabelText),
// printed as written: no id lookup, no joining (Gandalf 2026-10-20). Empty text -> no line.
export function formatSynergyLabel(text) {
  const names = String(text ?? '').trim();
  return names ? `Synergy: ${names}` : '';
}
