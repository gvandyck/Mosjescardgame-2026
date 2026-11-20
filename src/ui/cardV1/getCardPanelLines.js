// getCardPanelLines.js — the lines of the hover / detail panel (Phase 62 D-09, 62-UI-SPEC Copywriting).
// Flavour text, rarity, "Limit 1 per deck" and the per-type reminder live here, not on the card face.
// Returns [{ kind: 'flavour' | 'rarity' | 'limit' | 'reminder', text }] in that order; [] when there is nothing to say.
import { getCardById } from '../../data/cardIndex.js';

const REMINDERS = {
  PIECIE: 'Place face-down for free. From your next turn, pay its cost to activate it.',
  SNELLE_PIECIE: "Play from your hand at any time, also on your opponent's turn, with saved Energy. Needs a free Piecie slot.",
  PLACE: 'Play from your hand on your turn. Works at once and stays until destroyed. Fresh Mosjes ignore it.',
  PERSONAL_QUEST: "Needs a Level 3 Mosje of this type that started your turn at Level 3. Your opponent can't discard it.",
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
  // 72-05: a Mosje on the field lists what it carries (names looked up by the caller's rows or the ids' own names).
  if (Array.isArray(card.attachments) && Number.isFinite(card.maxAttachments)) {
    const names = card.attachments.map(a => a.name || getCardById(a.cardId)?.name || String(a.cardId)).join(', ');
    lines.push({ kind: 'attachments', text: `Attachments ${card.attachments.length} / ${card.maxAttachments}${names ? `: ${names}` : ''}` });
  }
  return lines;
}
