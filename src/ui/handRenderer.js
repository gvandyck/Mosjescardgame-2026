import { getCardById } from '../data/cardIndex.js';

console.log('[UI] handRenderer.js loaded');

export function renderHand(container, cards, onPlay = null, isLocalTurn = true, activeQuest = null, localPlayerId = null, gameState = null) {
	if (!container) return;

	const safeCards = Array.isArray(cards) ? cards : [];
	const questActive = !!activeQuest && activeQuest.phase !== 'RESOLVED';
	const questByOpponent = questActive && activeQuest.attacker && activeQuest.attacker !== localPlayerId;

	if (safeCards.length === 0) {
		container.innerHTML = '<p class="hand-empty">No cards in hand.</p>';
		return;
	}

	const row = document.createElement('div');
	row.className = 'hand-cards';
	row.id = 'hand-row';

	const total = safeCards.length;
	const maxAngle = 14;
	const spread = total > 1 ? (maxAngle * 2) / (total - 1) : 0;

	safeCards.forEach((entry, i) => {
		const cardId = entry?.cardId;
		const definition = cardId ? getCardById(cardId) : null;
		const card = { ...(definition || {}), ...(entry || {}) };
		if (!card || !card.type || !card.cardId) return;

		const angle = total > 1 ? -maxAngle + i * spread : 0;
		const translateY = Math.abs(angle) * 0.8;

		const isSnelle = card.type === 'SNELLE_PIECIE';
		const isReturned = card.type === 'MOSJE' && !!card.returnedThisTurn;

		let canPlay = false;
		if (onPlay) {
			if (isSnelle) {
				canPlay = true;
			} else if (questByOpponent) {
				canPlay = false;
			} else {
				canPlay = !!isLocalTurn && !isReturned;
			}
		}

		const wrap = document.createElement('div');
		wrap.className = `hand-card-wrap ${card.type.toLowerCase().replace('_', '-')} ${canPlay ? '' : 'hand-card-disabled'}`;
		wrap.dataset.index = String(i);
		wrap.style.setProperty('--base-angle', `${angle}deg`);
		setWrapTransform(wrap, angle, translateY, 0);

		if (isSnelle && questByOpponent) {
			wrap.classList.add('snelle-available');
		}

		const cardEl = document.createElement('div');
		cardEl.className = `card card--${card.type.toLowerCase()} ${getRarityClass(card)}`;
		cardEl.dataset.cardId = card.cardId;

		const face = document.createElement('div');
		face.className = 'card-face';
		face.innerHTML = buildHandCardHTML(card);
		cardEl.appendChild(face);
		wrap.appendChild(cardEl);

		if (canPlay || isSnelle) {
			const tooltip = buildHandTooltip(card, gameState, localPlayerId);
			wrap.appendChild(tooltip);
		}

		if (canPlay) {
			const btn = buildHandCardButton(card, isSnelle);
			btn.addEventListener('click', (event) => {
				event.stopPropagation();
				playCardFromHand(wrap, card, onPlay);
			});
			wrap.appendChild(btn);
		} else if (isReturned) {
			const lockBadge = document.createElement('div');
			lockBadge.className = 'hand-card-lock-badge';
			lockBadge.textContent = '🔒 Next turn';
			wrap.appendChild(lockBadge);
		}

		if (canPlay || isSnelle) {
			wrap.addEventListener('mouseenter', () => {
				cardEl.style.setProperty('--sweep', '100');
				cardEl.style.setProperty('--glow-o', '1');
				nudgeNeighbours(row, i);
			});

			wrap.addEventListener('mouseleave', () => {
				cardEl.style.setProperty('--sweep', '0');
				cardEl.style.setProperty('--glow-o', '0');
				clearNudges(row);
			});
		}

		row.appendChild(wrap);
	});

	container.innerHTML = '';
	container.appendChild(row);
}

function buildHandCardButton(card, isSnelle) {
	const btn = document.createElement('button');
	btn.className = 'hand-card-btn';
	btn.type = 'button';

	if (isSnelle) {
		btn.textContent = '⚡ Activate';
		btn.classList.add('hand-btn-snelle');
	} else if (card.type === 'MOSJE') {
		btn.textContent = 'Play Mosje';
		btn.classList.add('hand-btn-mosje');
	} else if (card.type === 'PLACE') {
		btn.textContent = 'Set Place';
		btn.classList.add('hand-btn-place');
	} else if (card.type === 'QUEST') {
		btn.textContent = 'Play Quest';
		btn.classList.add('hand-btn-quest');
	} else {
		btn.textContent = 'Set Card';
		btn.classList.add('hand-btn-piecie');
	}

	return btn;
}

function playCardFromHand(wrap, card, onPlay) {
	if (!onPlay || !card?.cardId || !card?.type) return;
	wrap.classList.add('hand-card-playing');
	setTimeout(() => {
		onPlay(card.cardId, card.type);
	}, 120);
}

function buildHandTooltip(card, gameState, myPlayerId) {
	const tip = document.createElement('div');
	tip.className = 'hand-card-tooltip';

	const synergies = (card.synergyWith || [])
		.map((id) => {
			const active = isSynergyActive(id, gameState, myPlayerId);
			return `<span class="tip-synergy ${active ? 'tip-syn-active' : ''}">${active ? '● ' : '○ '}${escapeHtml(
				String(id).replace('mosje_', '').replaceAll('_', ' ')
			)}</span>`;
		})
		.join('');

	const abilityPreview = String(card.abilityDescription || card.description || '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)[0] || '';

	tip.innerHTML = `
		<strong class="tip-name">${escapeHtml(card.name || 'Unnamed Card')}</strong>
		${abilityPreview ? `<p class="tip-ability">${escapeHtml(abilityPreview)}</p>` : ''}
		${synergies ? `<div class="tip-synergies">${synergies}</div>` : ''}
		${card.flavourText ? `<em class="tip-flavour">"${escapeHtml(card.flavourText)}"</em>` : ''}
	`;

	return tip;
}

function buildHandCardHTML(card) {
	const traitIcons = {
		physical: '⚡',
		mental: '🧠',
		social: '💬',
		creative: '🎨',
		technical: '🔧',
		resilient: '🛡️',
	};

	const traits = Object.entries(card.traits || {})
		.filter(([, value]) => Number(value) > 0)
		.slice(0, 3)
		.map(([trait, value]) => `<span class="hand-trait" data-trait="${escapeHtml(trait)}">${traitIcons[trait] || '•'} ${'★'.repeat(Number(value))}</span>`)
		.join('');

	const typeLabel = card.type === 'SNELLE_PIECIE' ? '⚡ INSTANT' : String(card.type || 'UNKNOWN').replace('_', ' ');
	const descriptionLine = escapeHtml(String(card.description || '').slice(0, 60));

	return `
		<div class="card-type-banner">${escapeHtml(typeLabel)}</div>
		<div class="card-art">
			${card.artPath ? `<img src="${escapeHtml(card.artPath)}" alt="${escapeHtml(card.name || 'Card art')}" onerror="this.style.display='none'" />` : ''}
			<div class="card-art-placeholder">${escapeHtml(String(card.name || '?').charAt(0) || '?')}</div>
			<div class="card-art-vignette"></div>
		</div>
		<div class="card-name">${escapeHtml(card.name || 'Unnamed Card')}</div>
		${traits ? `<div class="hand-traits">${traits}</div>` : ''}
		<div class="card-sub">${descriptionLine}</div>
	`;
}

function nudgeNeighbours(row, hoveredIndex) {
	const wraps = row.querySelectorAll('.hand-card-wrap');
	wraps.forEach((wrap, index) => {
		const angle = getBaseAngle(wrap);
		const translateY = Math.abs(angle) * 0.8;
		if (index === hoveredIndex) return;
		if (index < hoveredIndex) {
			setWrapTransform(wrap, angle, translateY, -12);
		} else {
			setWrapTransform(wrap, angle, translateY, 12);
		}
	});
}

function clearNudges(row) {
	const wraps = row.querySelectorAll('.hand-card-wrap');
	wraps.forEach((wrap) => {
		const angle = getBaseAngle(wrap);
		const translateY = Math.abs(angle) * 0.8;
		setWrapTransform(wrap, angle, translateY, 0);
	});
}

function setWrapTransform(wrap, angle, translateY, nudgeX) {
	wrap.style.transform = `rotate(${angle}deg) translateY(${translateY}px) translateX(${nudgeX}px)`;
}

function getBaseAngle(wrap) {
	const raw = String(wrap.style.getPropertyValue('--base-angle') || '0').replace('deg', '');
	const parsed = Number.parseFloat(raw);
	return Number.isFinite(parsed) ? parsed : 0;
}

function getRarityClass(card) {
	const rarity = String(card.rarity || '');
	if (rarity.includes('◆◆◆')) return 'rarity-ultra';
	if (rarity.includes('◆◆')) return 'rarity-rare';
	return '';
}

function isSynergyActive(synergyId, gameState, playerId) {
	const activeSlots = gameState?.players?.[playerId]?.activeSlots;
	if (Array.isArray(activeSlots)) {
		return activeSlots.some((slot) => slot && !slot.isDefeated && slot.cardId === synergyId);
	}
	return false;
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
