// packOpeningOverlay.js — Shows the pack opening result screen.
// Cards stagger in one by one. Each card shows name, type, art, and a NEW badge
// if the player had never owned this card before.

console.log('[UI] packOpeningOverlay.js loaded');

const TYPE_COLOUR = {
	MOSJE:        'var(--mosje-gold)',
	PIECIE:       'var(--piecie-blue)',
	SNELLE_PIECIE:'var(--snelle-red)',
	PLACE:        'var(--place-green)',
	QUEST:        'var(--quest-purple)',
};

const TYPE_LABEL = {
	MOSJE: 'Mosje', PIECIE: 'Piecie', SNELLE_PIECIE: 'Snelle', PLACE: 'Place', QUEST: 'Quest',
};

function cssUrl(path) {
	return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
}

function buildCardEl(card, isNew) {
	const colour = TYPE_COLOUR[card.cardType] || '#aaa';
	const label  = TYPE_LABEL[card.cardType]  || card.cardType;
	const hasArt = card.artPath && !card.artPath.includes('placeholder');
	const artStyle = hasArt ? `background-image: url('${cssUrl(card.artPath)}')` : '';

	const el = document.createElement('div');
	el.className = 'pack-card';
	el.style.borderColor = colour;
	el.innerHTML = `
		<div class="pack-card-art" style="${artStyle}">
			<div class="pack-card-art-overlay"></div>
			<span class="pack-card-type" style="color:${colour}">${label}</span>
			${isNew ? '<span class="pack-card-new">NEW</span>' : ''}
		</div>
		<div class="pack-card-body">
			<p class="pack-card-name">${card.name}</p>
			${card.rarity ? `<p class="pack-card-rarity">${card.rarity}</p>` : ''}
		</div>
	`;
	return el;
}

/**
 * @param {object} opts
 * @param {Array}   opts.drawnCards      card objects from drawPack()
 * @param {Set}     opts.ownedBefore     Set of cardIds owned BEFORE this pack open
 * @param {number}  opts.newBalance      updated Munten balance
 * @param {Function} opts.onClose        called when overlay is dismissed
 */
export function showPackOpeningOverlay({ drawnCards, ownedBefore, newBalance, onClose }) {
	document.getElementById('pack-opening-overlay')?.remove();

	const overlay = document.createElement('div');
	overlay.id = 'pack-opening-overlay';
	overlay.className = 'pack-opening-overlay';

	const newCount = drawnCards.filter(c => !ownedBefore.has(c.id)).length;
	const newLabel = newCount === drawnCards.length
		? 'All new cards!'
		: newCount > 0
			? `${newCount} new card${newCount > 1 ? 's' : ''}!`
			: 'All duplicates — keep collecting!';

	overlay.innerHTML = `
		<div class="pack-opening-inner">
			<h2 class="pack-opening-title">Pack Opened!</h2>
			<p class="pack-opening-sub">${newLabel}</p>
			<div class="pack-opening-cards" id="pack-cards-grid"></div>
			<p class="pack-opening-balance">Balance: <strong>${newBalance} Munten</strong></p>
			<div class="pack-opening-actions">
				<button class="reward-btn" id="pack-to-store">Open Another</button>
				<button class="reward-btn pack-btn--secondary" id="pack-to-builder">Go to Deck Builder</button>
			</div>
		</div>
	`;

	document.body.appendChild(overlay);

	const grid = document.getElementById('pack-cards-grid');
	drawnCards.forEach((card, i) => {
		const isNew = !ownedBefore.has(card.id);
		const el = buildCardEl(card, isNew);
		el.style.animationDelay = `${i * 0.12}s`;
		grid.appendChild(el);
	});

	requestAnimationFrame(() => overlay.classList.add('pack-opening-overlay--visible'));

	document.getElementById('pack-to-store').addEventListener('click', () => {
		overlay.remove();
		if (onClose) onClose();
	});

	document.getElementById('pack-to-builder').addEventListener('click', () => {
		window.location.href = './deck-builder.html';
	});
}
