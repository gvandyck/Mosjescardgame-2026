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
  if (resolvedCard.cardId || resolvedCard.id) {
    element.dataset.cardId = resolvedCard.cardId || resolvedCard.id;
  }

  if (type === 'MOSJE') {
    const subtypeClass = `mosje-subtype-${String(resolvedCard.subtype || '').toLowerCase()}`;
    if (subtypeClass !== 'mosje-subtype-') {
      element.classList.add(subtypeClass);
    }
  }

  // UNIFIED card template — every type renders the same: full-cover art + name +
  // description + rarity. Only the frame colour + art distinguish the type. The
  // verbose per-type info (traits, level, MP, trigger, affinity…) is hidden for now
  // and will return via an on-hover detail view.
  element.innerHTML = buildUnifiedCardHTML(resolvedCard, options);
  return element;
}

// One template for all card types.
function buildUnifiedCardHTML(card, options = {}) {
  const hasArt = typeof card.artPath === 'string'
    && card.artPath.length > 0
    && !card.artPath.endsWith('/placeholder.png');
  const artUrl = hasArt ? resolveArtPathForCss(card.artPath) : '';
  const artStyle = hasArt ? ` style="--card-art-url: url('${escapeCssUrl(artUrl)}');"` : '';

  // Name (top-left). Mosjes split into First name + "Nickname" (italic, below).
  const isMosjeCard = String(card.type || '').toUpperCase() === 'MOSJE';
  let title, nick = '';
  if (isMosjeCard) {
    const parsed = parseMosjeName(card.name);
    title = parsed.firstName || String(card.name || 'Unnamed');
    nick = parsed.nickname || '';
  } else {
    title = String(card.name || 'Unnamed');
  }
  const desc = String(card.description || card.abilityDescription || card.flavourText || '');
  const rarity = String(card.rarity || '★')
    .split('')
    .map((d) => `<span class="uc-rarity-dot">${escapeHtml(d)}</span>`)
    .join('');

  // Minimal MP/Level badge — only for Mosjes that are ON THE FIELD (slot has a live
  // numeric mp). Hand Mosjes are definitions (no .mp) and stay clean. Everything else
  // about the Mosje (traits, synergy…) is hidden until the hover-detail view.
  const isMosje = String(card.type || '').toUpperCase() === 'MOSJE';
  const mpBadge = (isMosje && Number.isFinite(card.mp))
    ? `<div class="uc-mp" data-mp="${card.mp}">
         ${Number.isFinite(card.level) ? `<span class="uc-mp-lvl">Lv ${(Number(card.level) || 0) + 1}</span>` : ''}
         <span class="uc-mp-val">${card.mp}</span>
       </div>`
    : '';

  const isOnFieldMosje = isMosje && Number.isFinite(card.mp);
  const enrichedMeta = (isOnFieldMosje && options.owned)
    ? buildOnFieldMosjeMeta(card, options)
    : '';
  // On-field Mosjes never show abilityDescription/flavour as uc-text (own use the meta
  // layer; opponent stay minimal — empty once main.js clears the description). Everything
  // else keeps the original fallback behavior.
  const footText = isOnFieldMosje
    ? String(card.description || '')
    : desc;

  return `
    <div class="uc-art${hasArt ? '' : ' is-placeholder'}"${artStyle}></div>
    <div class="uc-vignette"></div>
    ${mpBadge}
    <div class="uc-body">
      <div class="uc-head">
        <h3 class="uc-title">${escapeHtml(title)}</h3>
        ${nick ? `<p class="uc-nick">${escapeHtml(`"${nick}"`)}</p>` : ''}
      </div>
      <div class="uc-foot">
        ${enrichedMeta || (footText ? `<p class="uc-text">${escapeHtml(footText)}</p>` : '')}
        <div class="uc-rarity">${rarity}</div>
      </div>
    </div>
  `;
}

// Compact meta layer for the player's OWN on-field Mosjes: trait star-pips,
// a short ability snippet, and synergy ONLY when a partner is currently active.
function buildOnFieldMosjeMeta(card, options = {}) {
  const traitsHTML = Object.entries(card.traits || {})
    .filter(([, stars]) => Number(stars) > 0)
    .map(([trait, stars]) => {
      const n = Number(stars) || 0;
      const pips = '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
      return `<span class="uc-trait">${escapeHtml(capitalize(trait).slice(0, 4))} ${pips}</span>`;
    })
    .join('');

  const ability = String(card.abilityDescription || '').trim();
  const abilityHTML = ability ? `<p class="uc-ability">⚡ ${escapeHtml(ability)}</p>` : '';

  const activeMosjes = getOwnedActiveMosjeIds(options.gameState, options.viewingPlayerId);
  const synergyActive = (Array.isArray(card.synergyWith) ? card.synergyWith : [])
    .some((id) => activeMosjes.has(id));
  const synergyHTML = (synergyActive && card.synergyEffect)
    ? `<p class="uc-synergy">🔗 ${escapeHtml(card.synergyEffect)}</p>`
    : '';

  return `
    <div class="uc-meta">
      ${traitsHTML ? `<div class="uc-traits">${traitsHTML}</div>` : ''}
      ${abilityHTML}
      ${synergyHTML}
    </div>`;
}

function parseMosjeName(fullName) {
  // Parse "[FirstName] Nickname" format into { firstName, nickname }
  const match = String(fullName || '').match(/^\[(.+?)\]\s*(.*)/);
  if (match) {
    return {
      firstName: match[1],
      nickname: match[2] || '',
    };
  }
  // Fallback if format doesn't match
  return {
    firstName: String(fullName || 'Mosje'),
    nickname: '',
  };
}

export function buildMosjeCardHTML(card, gameState = null, viewingPlayerId = null) {
  const hasRealArt = typeof card.artPath === 'string'
    && card.artPath.length > 0
    && !card.artPath.endsWith('/placeholder.png');
  const artUrl = hasRealArt ? resolveArtPathForCss(card.artPath) : '';
  const artStyle = hasRealArt
    ? ` style="--mosje-art-url: url('${escapeCssUrl(artUrl)}');"`
    : '';

  const { firstName, nickname } = parseMosjeName(card.name);

  const traitRows = Object.entries(card.traits || {})
    .filter(([, stars]) => Number(stars) > 0)
    .map(([trait, stars]) => {
      const icon = TRAIT_ICONS[trait] || '•';
      const label = capitalize(trait);
      const starCount = Number(stars) || 0;
      const filled = '★'.repeat(starCount);
      const empty = '☆'.repeat(Math.max(0, 3 - starCount));
      const color = TRAIT_COLORS[trait] || '#aaaaaa';
      return `
        <div class="mosje-trait" data-trait="${escapeHtml(trait)}" data-stars="${starCount}" style="--trait-color: ${escapeHtml(color)}">
          <span class="trait-icon">${icon}</span>
          <span class="trait-name">${escapeHtml(label)}</span>
          <span class="trait-stars">${filled}<span class="trait-empty">${empty}</span></span>
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

  const rarityDots = String(card.rarity || '★')
    .split('')
    .map((dot) => `<span class="rarity-dot">${escapeHtml(dot)}</span>`)
    .join('');

  const internalLevel = Number.isFinite(Number(card.level)) ? Number(card.level) : 0;
  const displayLevel = Math.max(1, Math.min(3, internalLevel + 1));
  const levelText = ['', 'one', 'two', 'three'][displayLevel] || 'unknown';
  const rarityText = String(card.rarity || '').length;

  const currentMp = Number(card.mp ?? card.startMP ?? 0);

  // Build horizontal traits row without emoji
  const traitsHorizontal = Object.entries(card.traits || {})
    .filter(([, stars]) => Number(stars) > 0)
    .map(([trait, stars]) => {
      const label = capitalize(trait);
      const starCount = Number(stars) || 0;
      const filled = '★'.repeat(starCount);
      const empty = '☆'.repeat(Math.max(0, 3 - starCount));
      return `${escapeHtml(label)} ${filled}${empty}`;
    })
    .join(' • ');

  return `
    <div class="mosje-card-inner">
      <div class="mosje-full-art${hasRealArt ? '' : ' is-placeholder'}"${artStyle}></div>
      <div class="mosje-full-art-vignette"></div>
      <div class="mosje-card-content">
        <div class="mosje-header-v2">
          <div class="mosje-top-section">
            <div class="mosje-name-mp-row">
              <h3 class="mosje-name-v2">${escapeHtml(firstName)}</h3>
              <span class="mosje-mp-header">${currentMp}</span>
            </div>
            ${nickname ? `<p class="mosje-nickname-v2">${escapeHtml(nickname)}</p>` : ''}
          </div>
        </div>

        <div class="mosje-card-rule"></div>

        <div class="mosje-traits-horizontal">
          ${traitsHorizontal || '<span class="no-traits">No traits</span>'}
        </div>

        <div class="mosje-level-text-v2">
          Level ${escapeHtml(levelText)}
        </div>

        <div class="mosje-ability-section-v2">
          <p class="mosje-ability-text-v2">
            ${abilityLines || `<p class="ability-line">${escapeHtml(describeAbility(card.abilityId) || 'No ability.')}</p>`}
          </p>
        </div>

        ${synergyRows
          ? `
            <div class="mosje-synergies-section-v2">
              ${synergyRows}
            </div>
          `
          : ''}

        <div class="mosje-card-rule"></div>

        <div class="mosje-footer-stats">
          <span class="footer-stat-text">${rarityDots}</span>
        </div>
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

  const rarityDots = String(card.rarity || '★')
    .split('')
    .map((dot) => `<span class="rarity-dot">${escapeHtml(dot)}</span>`)
    .join('');

  return `
    <div class="place-card-inner">
      <div class="place-full-art${hasRealArt ? '' : ' is-placeholder'}"${artStyle}></div>
      <div class="place-full-art-vignette"></div>
      <div class="place-card-content">
        <div class="place-banner">
          <span class="place-trigger-badge">${escapeHtml(triggerLabel)}</span>
        </div>

        <div class="place-identity">
          <h3 class="place-name">${escapeHtml(card.name || 'Unnamed Place')}</h3>
          ${tagBadges ? `<div class="place-tags">${tagBadges}</div>` : ''}
        </div>

        <div class="place-card-rule"></div>

        <div class="place-effect-section">
          <p class="place-effect-text">${escapeHtml(card.description || '')}</p>
        </div>

        ${card.goodFor?.length || card.badFor?.length ? `
          <div class="place-card-rule"></div>
          <div class="place-affinity">
            ${card.goodFor?.length ? `<span class="place-good">▲ ${escapeHtml(card.goodFor.join(', '))}</span>` : ''}
            ${card.badFor?.length ? `<span class="place-bad">▼ ${escapeHtml(card.badFor.join(', '))}</span>` : ''}
          </div>
        ` : ''}

        <div class="place-footer">
          <span class="footer-stat-text">${rarityDots}</span>
        </div>
      </div>
    </div>
  `;
}

function buildCardWithArt(card) {
  const artUrl = resolveArtPathForCss(card.artPath);
  const artStyle = artUrl ? ` style="--piecie-full-art-url: url('${escapeCssUrl(artUrl)}');"` : '';

  return `
    <div class="piecie-card-inner">
      <div class="piecie-full-art"${artStyle}></div>
      <div class="piecie-full-art-vignette"></div>
      <div class="piecie-card-content">
        <h3 class="card__name">${escapeHtml(card.name || 'Unnamed Card')}</h3>
        <p class="card__desc">${escapeHtml(card.description || '')}</p>
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
