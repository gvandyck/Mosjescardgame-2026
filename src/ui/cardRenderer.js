// cardRenderer.js — Takes a single card data object and returns
// a styled HTML element for it. Used by boardRenderer and handRenderer.
//
// Quest cards get different CSS classes based on questType:
//   "GENERAL"  → class "card--quest-general"  (purple border)
//   "PERSONAL" → class "card--quest-personal" (gold border + character badge)
//
// Fully implemented in Phase 5. CSS classes defined in styles/cards.css.

console.log('[UI] cardRenderer.js loaded');

export function renderCard(card, options = {}) {
  const element = document.createElement('article');
  const type = String(card.type || 'UNKNOWN').toUpperCase();
  const title = String(card.name || 'Unnamed Card');
  const desc = String(card.description || card.flavourText || '');

  element.className = [
    'card',
    getTypeClass(type),
    getQuestCssClass(card),
    options.compact ? 'card--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const typeLabel = card.questType === 'PERSONAL' ? 'PERSONAL QUEST' : type.replaceAll('_', ' ');
  const difficulty = card.difficulty ? `<span class="card__difficulty">${escapeHtml(card.difficulty)}</span>` : '';
  const badge = card.questType === 'PERSONAL'
    ? `<span class="card__portrait-badge">${escapeHtml(shortMosjeName(card.requiredMosjeId))}</span>`
    : '';

  if (type === 'MOSJE') {
    element.innerHTML = renderMosjeCardInner(card, { title, typeLabel, badge });
    return element;
  }

  element.innerHTML = `
    ${badge}
    <div class="card__top">
      <span class="card__type-label">${escapeHtml(typeLabel)}</span>
      ${difficulty}
    </div>
    <h3 class="card__name">${escapeHtml(title)}</h3>
    <p class="card__desc">${escapeHtml(desc)}</p>
    ${renderMpMeta(card)}
  `;

  return element;
}

function renderMosjeCardInner(card, { title, typeLabel, badge }) {
  const traits = card.traits || {};
  const traitEntries = Object.entries(traits)
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const traitBadges = traitEntries.length
    ? traitEntries.map(([name, value]) => `<span class="card__trait-badge">${escapeHtml(capitalize(name))} ${Number(value)}</span>`).join('')
    : '<span class="card__trait-badge">No traits</span>';

  const abilityText = card.abilityDescription || describeAbility(card.abilityId);
  const synergyText = Array.isArray(card.synergyWith) && card.synergyWith.length
    ? card.synergyWith.map(shortMosjeName).join(', ')
    : 'None';
  const petText = card.petSynergy ? card.petSynergy.replace('piecie_', '') : 'None';

  return `
    ${badge}
    <div class="card__top">
      <span class="card__type-label">${escapeHtml(typeLabel)}</span>
      ${card.rarity ? `<span class="card__difficulty">${escapeHtml(card.rarity)}</span>` : ''}
    </div>
    <h3 class="card__name">${escapeHtml(title)}</h3>
    <div class="card__traits">${traitBadges}</div>
    <p class="card__desc">${escapeHtml(String(card.flavourText || card.description || ''))}</p>
    <div class="card__meta card__meta--stacked">
      <div><strong>Ability:</strong> ${escapeHtml(abilityText)}</div>
      <div><strong>Synergy:</strong> ${escapeHtml(synergyText)}</div>
      <div><strong>Pet:</strong> ${escapeHtml(petText)}</div>
      <div><strong>MP/LVL:</strong> ${Number(card.mp ?? card.startMP ?? 0)} / ${Number(card.level || 0)}</div>
    </div>
  `;
}

function describeAbility(abilityId) {
  if (!abilityId) return 'No ability.';
  return abilityId
    .replace('ability_', '')
    .split('_')
    .map(capitalize)
    .join(' ');
}

function capitalize(text) {
  const value = String(text || '');
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getTypeClass(type) {
  if (type === 'MOSJE') return 'card--mosje';
  if (type === 'PIECIE') return 'card--piecie';
  if (type === 'SNELLE_PIECIE') return 'card--snelle';
  if (type === 'PLACE') return 'card--place';
  if (type === 'QUEST') return 'card--quest';
  return 'card--unknown';
}

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

function renderMpMeta(card) {
  if (typeof card.mp === 'number' || typeof card.level === 'number') {
    return `<div class="card__meta">MP ${Number(card.mp || 0)} • LVL ${Number(card.level || 0)}</div>`;
  }
  return '';
}

function shortMosjeName(requiredMosjeId) {
  if (!requiredMosjeId) return 'PQ';
  return requiredMosjeId.replace('mosje_', '').slice(0, 3).toUpperCase();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
