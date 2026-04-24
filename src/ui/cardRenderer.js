// cardRenderer.js — Takes a single card data object and returns
// a styled HTML element for it. Used by boardRenderer and handRenderer.
//
// Quest cards get different CSS classes based on questType:
//   "GENERAL"  → class "card--quest-general"  (purple border)
//   "PERSONAL" → class "card--quest-personal" (gold border + character badge)
//
// Fully implemented in Phase 5. CSS classes defined in styles/cards.css.

import { getCardById } from '../data/cardIndex.js';

console.log('[UI] cardRenderer.js loaded');

const TRAIT_ICONS = {
  physical: '⚡',
  mental: '🧠',
  social: '💬',
  creative: '🎨',
  technical: '🔧',
  resilient: '🛡️',
};

const TRAIT_COLORS = {
  physical: 'var(--trait-physical)',
  mental: 'var(--trait-mental)',
  social: 'var(--trait-social)',
  creative: 'var(--trait-creative)',
  technical: 'var(--trait-technical)',
  resilient: 'var(--trait-resilient)',
};

export function renderCard(card, options = {}) {
  const element = document.createElement('article');
  const resolvedCard = hydrateCard(card);
  const type = String(resolvedCard.type || 'UNKNOWN').toUpperCase();
  const title = String(resolvedCard.name || 'Unnamed Card');
  const desc = String(resolvedCard.description || resolvedCard.flavourText || '');

  element.className = [
    'card',
    getTypeClass(type),
    getQuestCssClass(resolvedCard),
    options.compact ? 'card--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const typeLabel = resolvedCard.questType === 'PERSONAL' ? 'PERSONAL QUEST' : type.replaceAll('_', ' ');
  const difficulty = resolvedCard.difficulty ? `<span class="card__difficulty">${escapeHtml(resolvedCard.difficulty)}</span>` : '';
  const badge = resolvedCard.questType === 'PERSONAL'
    ? `<span class="card__portrait-badge">${escapeHtml(shortMosjeName(resolvedCard.requiredMosjeId))}</span>`
    : '';

  if (type === 'MOSJE') {
    const subtypeClass = `mosje-subtype-${String(resolvedCard.subtype || '').toLowerCase()}`;
    if (subtypeClass !== 'mosje-subtype-') {
      element.classList.add(subtypeClass);
    }
    element.innerHTML = buildMosjeCardHTML(
      resolvedCard,
      options.gameState || null,
      options.viewingPlayerId || resolvedCard.ownerId || null
    );
    return element;
  }

  if (type === 'PLACE') {
    element.innerHTML = buildPlaceCardHTML(resolvedCard);
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
    ${renderMpMeta(resolvedCard)}
  `;

  return element;
}

export function buildMosjeCardHTML(card, gameState = null, viewingPlayerId = null) {
  const hasRealArt = typeof card.artPath === 'string'
    && card.artPath.length > 0
    && !card.artPath.endsWith('/placeholder.png');
  const artUrl = hasRealArt ? resolveArtPathForCss(card.artPath) : '';
  const artStyle = hasRealArt
    ? ` style="--mosje-art-url: url('${escapeCssUrl(artUrl)}');"`
    : '';

  const mosjeType = String(card.subtype || card.mosjeType || '').toLowerCase();
  const typeLabel = capitalize(mosjeType);
  const { displayName, nickname } = parseMosjeName(card.name);

  const traitRows = Object.entries(card.traits || {})
    .filter(([, stars]) => Number(stars) > 0)
    .map(([trait, stars]) => {
      const label = capitalize(trait);
      const starCount = Number(stars) || 0;
      const filled = '★'.repeat(starCount);
      const empty = '☆'.repeat(Math.max(0, 3 - starCount));
      return `
        <div class="mosje-trait-item" data-trait="${escapeHtml(trait)}">
          <span class="mosje-trait-name">${escapeHtml(label)}</span>
          <span class="mosje-trait-stars">${filled}<span class="mosje-trait-empty">${empty}</span></span>
        </div>
      `;
    })
    .join('');

  const ownedActiveMosjes = getOwnedActiveMosjeIds(gameState, viewingPlayerId);
  const ownedActivePiecies = getOwnedActivePiecieIds(gameState, viewingPlayerId);

  const synergyRows = (Array.isArray(card.synergyWith) ? card.synergyWith : [])
    .map((synergyId) => {
      const active = ownedActiveMosjes.has(synergyId);
      const statusClass = active ? 'synergy-active' : 'synergy-inactive';
      const statusLabel = active ? '● ACTIVE' : '○ inactive';
      const partnerName = formatIdLabel(synergyId, 'mosje_');
      return `
        <div class="mosje-synergy-row ${statusClass}">
          <div class="synergy-header">
            <span class="synergy-with-label">🔗 + ${escapeHtml(partnerName)}</span>
            <span class="synergy-status-badge">${statusLabel}</span>
          </div>
          <p class="synergy-effect-text">${escapeHtml(card.synergyEffect || '')}</p>
        </div>
      `;
    })
    .join('');

  const petActive = card.petSynergy ? ownedActivePiecies.has(card.petSynergy) : false;
  const petRow = card.petSynergy
    ? `
      <div class="mosje-pet-row ${petActive ? 'pet-active' : 'pet-inactive'}">
        <span class="pet-icon">🐾</span>
        <span class="pet-name">${escapeHtml(formatIdLabel(card.petSynergy, 'piecie_'))}</span>
        <span class="pet-status">${petActive ? '● active' : '○ not active'}</span>
      </div>
    `
    : '';

  const abilityLines = String(card.abilityDescription || describeAbility(card.abilityId) || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p class="ability-line">${escapeHtml(line)}</p>`)
    .join('');

  const rarityDots = String(card.rarity || '◆')
    .split('')
    .map((dot) => `<span class="rarity-dot">${escapeHtml(dot)}</span>`)
    .join('');

  const internalLevel = Number.isFinite(Number(card.level)) ? Number(card.level) : 0;
  const displayLevel = Math.max(1, Math.min(3, internalLevel + 1));
  const currentMp = Number(card.mp ?? card.startMP ?? 0);

  return `
    <div class="mosje-card-inner" data-mosje-type="${escapeHtml(mosjeType)}">
      <div class="mosje-full-art${hasRealArt ? '' : ' is-placeholder'}"${artStyle}></div>
      <div class="mosje-full-art-vignette"></div>

      <header class="mosje-header">
        <div class="mosje-title-group">
          <span class="mosje-name">${escapeHtml(displayName)}</span>
          ${nickname ? `<span class="mosje-flavor">${escapeHtml(nickname)}</span>` : ''}
          ${typeLabel ? `<span class="mosje-type type-${escapeHtml(mosjeType)}">${escapeHtml(typeLabel)}</span>` : ''}
        </div>
        <div class="mosje-hp">
          <span class="mosje-mp-label">MP</span>
          <span class="mosje-mp-value">${currentMp}</span>
        </div>
      </header>

      <div class="mosje-content">
        ${traitRows ? `<div class="mosje-traits">${traitRows}</div>` : ''}
        <div class="mosje-divider"></div>
        <div class="mosje-ability">
          <span class="mosje-ability-title">✦ ABILITY</span>
          ${abilityLines || `<p class="ability-line">${escapeHtml(describeAbility(card.abilityId) || 'No ability.')}</p>`}
        </div>

        ${synergyRows ? `
          <div class="mosje-divider"></div>
          <div class="mosje-synergies-section">
            <div class="section-label">🔗 SYNERGY</div>
            ${synergyRows}
          </div>
        ` : ''}

        ${petRow ? `
          <div class="mosje-divider"></div>
          <div class="mosje-pet-section">${petRow}</div>
        ` : ''}

        <footer class="mosje-footer">
          <span class="mosje-rarity">${rarityDots}</span>
          <span class="mosje-level-badge">LV.${displayLevel}</span>
        </footer>
      </div>
    </div>
  `;
}

export function buildPlaceCardHTML(card) {
  const hasRealArt = typeof card.artPath === 'string'
    && card.artPath.length > 0
    && !card.artPath.endsWith('/placeholder.png');
  const artUrl = hasRealArt ? resolveArtPathForCss(card.artPath) : '';
  const artStyle = hasRealArt
    ? ` style="--place-art-url: url('${escapeCssUrl(artUrl)}');"`
    : '';

  const triggerLabel = card.trigger
    ? card.trigger.replaceAll('_', ' ')
    : 'PASSIVE';

  const tagBadges = (Array.isArray(card.tags) ? card.tags : [])
    .map(t => `<span class="place-tag">${escapeHtml(t)}</span>`)
    .join('');

  const rarityStars = escapeHtml(String(card.rarity || '★★★☆☆'));

  return `
    <div class="place-card-inner">
      <div class="place-full-art${hasRealArt ? '' : ' is-placeholder'}"${artStyle}></div>
      <div class="place-full-art-vignette"></div>
      <div class="place-card-content">
        <div class="place-banner">
          <span class="place-type-label">PLACE</span>
          <span class="place-trigger-badge">${escapeHtml(triggerLabel)}</span>
        </div>

        <div class="place-identity">
          <h3 class="place-name">${escapeHtml(card.name || 'Unnamed Place')}</h3>
          ${tagBadges ? `<div class="place-tags">${tagBadges}</div>` : ''}
        </div>

        <div class="place-card-rule"></div>

        <div class="place-effect-section">
          <div class="section-label">✦ EFFECT</div>
          <p class="place-effect-text">${escapeHtml(card.description || '')}</p>
        </div>

        ${card.goodFor?.length || card.badFor?.length ? `
          <div class="place-card-rule"></div>
          <div class="place-affinity">
            ${card.goodFor?.length ? `<span class="place-good">▲ ${escapeHtml(card.goodFor.join(', '))}</span>` : ''}
            ${card.badFor?.length ? `<span class="place-bad">▼ ${escapeHtml(card.badFor.join(', '))}</span>` : ''}
          </div>
        ` : ''}

        ${card.flavourText ? `
          <div class="place-card-rule"></div>
          <p class="place-flavour">&quot;${escapeHtml(card.flavourText)}&quot;</p>
        ` : ''}

        <div class="place-footer">
          <span class="place-rarity">${rarityStars}</span>
        </div>
      </div>
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

function hydrateCard(card) {
  const fallback = card || {};
  const cardId = fallback.cardId || fallback.id;
  if (!cardId) return fallback;
  const definition = getCardById(cardId);
  return definition ? { ...definition, ...fallback } : fallback;
}

function formatIdLabel(id, prefix = '') {
  return String(id || '')
    .replace(prefix, '')
    .replaceAll('_', ' ')
    .trim();
}

function getOwnedActiveMosjeIds(gameState, viewingPlayerId) {
  const active = new Set();
  if (!gameState || !viewingPlayerId) return active;

  const slots = gameState.players?.[viewingPlayerId]?.activeSlots;
  if (Array.isArray(slots)) {
    for (const slot of slots) {
      if (slot && !slot.isDefeated && slot.cardId) active.add(slot.cardId);
    }
  }

  const mosjeStates = gameState.mosjeStates;
  if (mosjeStates && typeof mosjeStates === 'object') {
    for (const value of Object.values(mosjeStates)) {
      if (value?.ownerId === viewingPlayerId && !value?.defeated && value?.cardId) {
        active.add(value.cardId);
      }
    }
  }
  return active;
}

function getOwnedActivePiecieIds(gameState, viewingPlayerId) {
  const active = new Set();
  if (!gameState || !viewingPlayerId) return active;

  const slots = gameState.players?.[viewingPlayerId]?.piecieSlots;
  if (Array.isArray(slots)) {
    for (const slot of slots) {
      if (slot && !slot.faceDown && slot.cardId) active.add(slot.cardId);
    }
  }

  const piecieStates = gameState.piecieStates;
  if (piecieStates && typeof piecieStates === 'object') {
    for (const value of Object.values(piecieStates)) {
      if (value?.ownerId === viewingPlayerId && !value?.isFaceDown && value?.cardId) {
        active.add(value.cardId);
      }
    }
  }
  return active;
}

function parseMosjeName(name) {
  const match = String(name || '').match(/^\[(.+?)\]\s*(.*)/);
  if (match) {
    return { displayName: match[1].trim(), nickname: match[2].trim() || null };
  }
  return { displayName: String(name || 'Unnamed'), nickname: null };
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
