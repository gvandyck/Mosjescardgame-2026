// cardRenderer.js — Takes a single card data object and returns
// a styled HTML element for it. Used by boardRenderer and handRenderer.
//
// Quest cards get different CSS classes based on questType:
//   "GENERAL"  → class "card--quest-general"  (purple border)
//   "PERSONAL" → class "card--quest-personal" (gold border + character badge)
//
// Fully implemented in Phase 5. CSS classes defined in styles/cards.css.

console.log('[UI] cardRenderer.js placeholder loaded');

// ─────────────────────────────────────────────────────────────
// getQuestCssClass
// Helper used by the renderer to pick the right Quest CSS class.
// card — a card data object from QUESTS
// Returns a CSS class name string.
// ─────────────────────────────────────────────────────────────
export function getQuestCssClass(card) {
  if (card.type !== 'QUEST') return '';
  if (card.questType === 'PERSONAL') return 'card--quest-personal';
  return 'card--quest-general';
}
