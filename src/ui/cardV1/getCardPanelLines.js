// getCardPanelLines.js — the lines of the hover / detail panel (Phase 62 D-09, 62-UI-SPEC Copywriting).
// Flavour text, rarity, "Limit 1 per deck" and the per-type reminder live here, not on the card face.
// Returns [{ kind: 'flavour' | 'rarity' | 'limit' | 'reminder', text }] in that order; [] when there is nothing to say.
const REMINDERS = {
  PIECIE: 'Place face-down for free. From your next turn, pay its cost to activate it.',
  SNELLE_PIECIE: "Play from your hand at any time, also on your opponent's turn, with saved Energy. Needs a free Piecie slot.",
  PLACE: 'Play from your hand on your turn. Works at once and stays until destroyed. Fresh Mosjes ignore it.',
};

export function getCardPanelLines(card) {
  if (!card) return [];
  const type = String(card.type || card.cardType || '').toUpperCase();
  const lines = [];
  const flavour = String(card.flavourText || '').trim();
  if (flavour) lines.push({ kind: 'flavour', text: flavour });
  // Quests have no rarity tier (they are all frame tier 1); every other card prints its stars.
  if (card.rarity && !type.startsWith('QUEST')) lines.push({ kind: 'rarity', text: String(card.rarity) });
  if (card.limitPerDeck === 1) lines.push({ kind: 'limit', text: 'Limit 1 per deck' });
  if (REMINDERS[type]) lines.push({ kind: 'reminder', text: REMINDERS[type] });
  return lines;
}
