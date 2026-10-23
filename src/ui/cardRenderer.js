// cardRenderer.js — Takes a single card data object and returns
// a styled HTML element for it. Used by boardRenderer and handRenderer.
//
// Quest cards get different CSS classes based on questType:
//   "GENERAL"  → class "card--quest-general"  (purple border)
//   "PERSONAL" → class "card--quest-personal" (gold border + character badge)
//
// Every Mosje, Piecie, Snelle, Place and 2.0 Quest gets its 2.0 face from buildCardV1 (src/ui/cardV1/).
// Only a card type that has no 2.0 face (an unknown type, a leftover V4 Quest) falls back to the unified template below.

import { getCardById } from '../data/cardIndex.js';
import { buildCardV1 } from './cardV1/buildCardV1.js';

console.log('[UI] cardRenderer.js loaded');

export function renderCard(card, options = {}) {
  const element = document.createElement('article');
  const resolvedCard = hydrateCard(card);
  const type = String(resolvedCard.type || 'UNKNOWN').toUpperCase();

  element.className = [
    'card',
    getTypeClass(type),
    getQuestCssClass(resolvedCard),
    options.compact ? 'card--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');
  if (resolvedCard.cardId || resolvedCard.id) {
    element.dataset.cardId = resolvedCard.cardId || resolvedCard.id;
  }

  if (type === 'MOSJE') {
    const subtypeClass = `mosje-subtype-${String(resolvedCard.subtype || '').toLowerCase()}`;
    if (subtypeClass !== 'mosje-subtype-') {
      element.classList.add(subtypeClass);
    }
  }

  const v1 = buildCardV1(resolvedCard, { fieldMode: !!options.fieldMode });
  if (v1) {
    element.classList.add(...v1.className.split(' '));
    element.dataset.tier = v1.dataTier;
    element.dataset.cv1Diamonds = String(v1.diamonds);
    element.innerHTML = v1.html;
    return element;
  }
  element.innerHTML = buildUnifiedCardHTML(resolvedCard);
  return element;
}

// The fallback template for a card without a 2.0 face: full-cover art + name + description.
function buildUnifiedCardHTML(card) {
  const hasArt = typeof card.artPath === 'string'
    && card.artPath.length > 0
    && !card.artPath.endsWith('/placeholder.png');
  const artUrl = hasArt ? resolveArtPathForCss(card.artPath) : '';
  const artStyle = hasArt ? ` style="--card-art-url: url('${escapeCssUrl(artUrl)}');"` : '';

  const title = String(card.name || 'Unnamed');
  const desc = String(card.description || card.abilityDescription || card.flavourText || '');

  return `
    <div class="uc-art${hasArt ? '' : ' is-placeholder'}"${artStyle}></div>
    <div class="uc-vignette"></div>
    <div class="uc-body">
      <div class="uc-head">
        <h3 class="uc-title">${escapeHtml(title)}</h3>
      </div>
      <div class="uc-foot">
        ${desc ? `<p class="uc-text">${escapeHtml(desc)}</p>` : ''}
      </div>
    </div>
  `;
}

function getTypeClass(type) {
  if (type === 'MOSJE') return 'card--mosje';
  if (type === 'PIECIE') return 'card--piecie';
  if (type === 'SNELLE_PIECIE') return 'card--snelle card--snelle_piecie';
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

function hydrateCard(card) {
  const fallback = card || {};
  const cardId = fallback.cardId || fallback.id;
  if (!cardId) return fallback;
  const definition = getCardById(cardId);
  return definition ? { ...definition, ...fallback } : fallback;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeCssUrl(path) {
  return String(path || '')
    .replaceAll('\\', '/')
    .replaceAll("'", '%27')
    .replaceAll('"', '%22')
    .replaceAll('(', '%28')
    .replaceAll(')', '%29');
}

function resolveArtPathForCss(path) {
  const raw = String(path || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${window.location.origin}${raw}`;
  return new URL(raw, window.location.href).toString();
}
