// deck-builder.js — Deck Builder page logic.
// Auth-required (anonymous/guest users are redirected).
// Saves custom decks to Firebase RTDB under users/{uid}/decks.

import {
	onAuthStateChanged,
	getCurrentUser,
	reauthenticateCurrentUser,
	deleteCurrentAccount,
} from './multiplayer/authManager.js';
import {
	loadUserDecks,
	saveDeck,
	deleteDeck,
	getLastUserStoreError,
	deleteUserData,
} from './multiplayer/userStore.js';
import { initNewAccount } from './multiplayer/accountSetup.js';
import { getOwnedCardIds } from './multiplayer/collectionStore.js';
import { MOSJES } from './data/mosjes.js';
import { PIECIES } from './data/piecies.js';
import { SNELLE_PIECIES } from './data/snellePiecies.js';
import { PLACES } from './data/places.js';
import { QUESTS } from './data/quests.js';
import { initModalManager } from './ui/modalManager.js';

// ── Card pool (non-booster only) ──────────────────────────────────────────────
const ALL_CARDS = [
	...MOSJES.filter(c => !c.isBoosterOnly).map(c => ({ ...c, cardType: 'MOSJE' })),
	...PIECIES.filter(c => !c.isBoosterOnly).map(c => ({ ...c, cardType: 'PIECIE' })),
	...SNELLE_PIECIES.filter(c => !c.isBoosterOnly).map(c => ({ ...c, cardType: 'SNELLE_PIECIE' })),
	...PLACES.filter(c => !c.isBoosterOnly).map(c => ({ ...c, cardType: 'PLACE' })),
	...QUESTS.filter(c => !c.isBoosterOnly && c.questType === 'PERSONAL').map(c => ({ ...c, cardType: 'QUEST' })),
];

const LIMITS = { MOSJE: 2, PIECIE: 8, SNELLE_PIECIE: 4, PLACE: 2, QUEST: 1 };
const MAX_COPIES = 2; // per individual card (unless deckLimit: 1)

// ── Modal manager (lazy-init, shared for preview) ─────────────────────────────
let _modal = null;
function getModal() {
	if (_modal) return _modal;
	let root = document.querySelector('#modal-root');
	if (!root) {
		root = document.createElement('div');
		root.id = 'modal-root';
		root.className = 'modal-root';
		document.body.appendChild(root);
	}
	_modal = initModalManager(root);
	return _modal;
}

function showCardPreview(card) {
	const modal = getModal();
	modal.showCardPreview({ ...card, type: card.cardType });
}

// ── State ─────────────────────────────────────────────────────────────────────
let deck = { MOSJE: {}, PIECIE: {}, SNELLE_PIECIE: {}, PLACE: {}, QUEST: {} }; // { cardId: count }
let savedDecks = [];            // loaded from Firebase
let _ownedCardIds = new Set();  // card IDs the player owns at least 1 copy of
let activeFilter = 'ALL';
let searchQuery = '';
let editingDeckId = null;  // id of the deck being edited (null = new)

// ── Auth gate ─────────────────────────────────────────────────────────────────
onAuthStateChanged(async user => {
	if (!user) { window.location.href = './account.html'; return; }
	if (user.isAnonymous) {
		window.location.href = './index.html?msg=signin-for-decks';
		return;
	}
	// Show user badge
	const badge = document.getElementById('user-badge');
	const name = document.getElementById('user-badge-name');
	if (badge && name) { name.textContent = user.displayName || user.email; badge.hidden = false; }

	// Ensure wallet + starter collection exist before reading collection
	await initNewAccount(user.uid);

	// Load collection so the grid can grey out unowned cards
	_ownedCardIds = await getOwnedCardIds(user.uid);

	// Load saved decks
	savedDecks = await loadUserDecks(user.uid);
	populateDeckSelect();
	renderGrid();
	if (getLastUserStoreError()) {
		showStatus('Saved decks could not load. Check Firebase Database rules.', 'error');
	}
});

document.getElementById('btn-delete-account')?.addEventListener('click', deleteSignedInAccount);

async function deleteSignedInAccount() {
	const user = getCurrentUser();
	if (!user || user.isAnonymous) return;

	const confirmed = confirm(
		'Delete your MOSJES account permanently?\n\nThis removes your saved decks and account login. This cannot be undone.'
	);
	if (!confirmed) return;

	const providerIds = user.providerData?.map(provider => provider.providerId) || [];
	const password = providerIds.includes('password')
		? prompt('Enter your password to confirm account deletion:')
		: null;
	if (providerIds.includes('password') && !password) return;

	const deleteBtn = document.getElementById('btn-delete-account');
	if (deleteBtn) deleteBtn.disabled = true;

	const reauth = await reauthenticateCurrentUser(password);
	if (!reauth.success) {
		showStatus(reauth.error || 'Could not confirm your account. Please sign in again and try once more.', 'error');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	const dataResult = await deleteUserData(user.uid);
	if (!dataResult.success) {
		showStatus(dataResult.error || 'Could not delete saved account data. Please try again.', 'error');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	const authResult = await deleteCurrentAccount();
	if (!authResult.success) {
		showStatus(authResult.error || 'Could not delete account. Please sign in again and try once more.', 'error');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	window.location.href = './account.html?msg=account-deleted';
}

// ── Deck select ───────────────────────────────────────────────────────────────
function populateDeckSelect() {
	const sel = document.getElementById('deck-load-select');
	sel.innerHTML = '<option value="">— New Deck —</option>';
	for (const d of savedDecks) {
		const opt = document.createElement('option');
		opt.value = d.id;
		opt.textContent = d.name;
		sel.appendChild(opt);
	}
}

document.getElementById('deck-load-select').addEventListener('change', e => {
	const id = e.target.value;
	if (!id) { clearDeck(); return; }
	const found = savedDecks.find(d => d.id === id);
	if (found) loadDeckIntoBuilder(found);
});

function clearDeck() {
	deck = { MOSJE: {}, PIECIE: {}, SNELLE_PIECIE: {}, PLACE: {}, QUEST: {} };
	editingDeckId = null;
	document.getElementById('deck-name-input').value = '';
	document.getElementById('btn-delete-deck').hidden = true;
	updateAll();
}

function loadDeckIntoBuilder(deckDef) {
	deck = { MOSJE: {}, PIECIE: {}, SNELLE_PIECIE: {}, PLACE: {}, QUEST: {} };
	editingDeckId = deckDef.id;
	document.getElementById('deck-name-input').value = deckDef.name;
	document.getElementById('btn-delete-deck').hidden = false;

	const addCards = (ids, type) => {
		for (const id of (ids || [])) {
			deck[type][id] = (deck[type][id] || 0) + 1;
		}
	};
	addCards(deckDef.mosjes, 'MOSJE');
	addCards(deckDef.piecies, 'PIECIE');
	addCards(deckDef.snellePiecies, 'SNELLE_PIECIE');
	addCards(deckDef.places, 'PLACE');
	addCards(deckDef.quests, 'QUEST');
	updateAll();
}

// ── Add / remove cards ────────────────────────────────────────────────────────
function getCount(cardType, cardId) {
	return deck[cardType]?.[cardId] ?? 0;
}

function totalOfType(cardType) {
	return Object.values(deck[cardType] || {}).reduce((s, n) => s + n, 0);
}

function addCard(card) {
	const { id, cardType, deckLimit } = card;
	const maxCopies = deckLimit ?? MAX_COPIES;
	if (getCount(cardType, id) >= maxCopies) return;
	if (totalOfType(cardType) >= LIMITS[cardType]) return;
	deck[cardType][id] = getCount(cardType, id) + 1;
	updateAll();
}

function removeCard(cardType, cardId) {
	const current = getCount(cardType, cardId);
	if (current <= 0) return;
	if (current === 1) delete deck[cardType][cardId];
	else deck[cardType][cardId] = current - 1;
	updateAll();
}

// ── Render card grid ──────────────────────────────────────────────────────────
function renderGrid() {
	const grid = document.getElementById('card-grid');
	const filtered = ALL_CARDS.filter(c => {
		if (activeFilter !== 'ALL' && c.cardType !== activeFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			return c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
		}
		return true;
	});

	grid.innerHTML = '';
	for (const card of filtered) {
		const count     = getCount(card.cardType, card.id);
		const maxCopies = card.deckLimit ?? MAX_COPIES;
		const typeTotal = totalOfType(card.cardType);
		const atMax     = count >= maxCopies || typeTotal >= LIMITS[card.cardType];
		const typeSlug  = card.cardType.toLowerCase().replace(/_/g, '-');

		const owned = _ownedCardIds.has(card.id);
		const tile = document.createElement('div');
		tile.className = [
			'card-tile',
			`card-tile--${typeSlug}`,
			atMax      ? 'card-tile--full'     : '',
			count > 0  ? 'card-tile--selected'  : '',
			!owned     ? 'card-tile--unowned'   : '',
		].filter(Boolean).join(' ');
		tile.dataset.id   = card.id;
		tile.dataset.type = card.cardType;
		tile.innerHTML = buildTileHTML(card, count, atMax, owned);
		grid.appendChild(tile);
	}
}

function cardNameById(id) {
	return ALL_CARDS.find(c => c.id === id)?.name || id;
}

function buildTileHTML(card, count, atMax, owned = true) {
	const { id, cardType, rarity } = card;
	const typeSlug = cardType.toLowerCase().replace(/_/g, '-');

	// Art zone — inline style so URL resolves relative to the HTML document,
	// not the CSS file (CSS custom properties with url() resolve relative to
	// the stylesheet that consumes them, which would break relative paths).
	const hasArt = card.artPath && !card.artPath.includes('placeholder');
	const artStyle = hasArt
		? ` style="background-image: url('${cssUrl(card.artPath)}')"`
		: '';

	// ── Art header: badge top-left, rarity/lock top-right ────────
	const rarityLabel = !owned
		? `<span class="tile-lock">Unowned</span>`
		: (rarity ? `<span class="tile-rarity">${rarity}</span>` : '');
	const subtypeLabel = card.subtype
		? `<span class="tile-subtype">${card.subtype.replace(/-/g, ' ')}</span>`
		: '';

	// ── Type-specific stats ───────────────────────────────────────
	let statsHTML = '';
	if (cardType === 'MOSJE') {
		statsHTML = `<div class="tile-stats">
			<span class="stat stat--mp">Start ${card.startMP ?? 0} MP</span>
			${card.traits ? formatTraits(card.traits) : ''}
		</div>`;
	} else if (cardType === 'PIECIE' || cardType === 'SNELLE_PIECIE') {
		const costStr = card.mpCost === 0 ? 'Free' : `${card.mpCost} MP`;
		const reqStr  = card.requirement && card.requirement !== 'any' ? `Req: ${card.requirement}` : '';
		statsHTML = `<div class="tile-stats">
			<span class="stat stat--mp">${costStr}</span>
			${cardType === 'SNELLE_PIECIE' ? '<span class="stat stat--instant">Interrupt</span>' : ''}
			${reqStr ? `<span class="stat stat--req">${reqStr}</span>` : ''}
		</div>`;
	} else if (cardType === 'PLACE') {
		const triggerStr = card.trigger ? card.trigger.replace(/_/g, ' ') : '';
		const goodFor = (card.goodFor || []).join(', ');
		const badFor  = (card.badFor  || []).join(', ');
		statsHTML = `<div class="tile-stats">
			${triggerStr ? `<span class="stat stat--trigger">${triggerStr}</span>` : ''}
			${goodFor    ? `<span class="stat stat--good">Best: ${goodFor}</span>` : ''}
			${badFor     ? `<span class="stat stat--bad">Avoid: ${badFor}</span>` : ''}
		</div>`;
	} else if (cardType === 'QUEST') {
		const diffClass = { LOW: 'stat--easy', MEDIUM: 'stat--medium', HIGH: 'stat--hard' };
		statsHTML = `<div class="tile-stats">
			${card.difficulty ? `<span class="stat ${diffClass[card.difficulty] || ''}">${card.difficulty}</span>` : ''}
			<span class="stat stat--mp">+${card.successMP ?? 0} / ${card.failMP ?? 0}</span>
			${card.category ? `<span class="stat stat--cat">${card.category}</span>` : ''}
		</div>`;
	}

	const desc        = card.description || card.requirementDescription || '';
	const abilityHTML = card.abilityDescription ? `<p class="tile-ability"><strong>Ability:</strong> ${card.abilityDescription}</p>` : '';
	const flavourHTML = card.flavourText        ? `<p class="tile-flavour">${card.flavourText}</p>` : '';
	const tagsHTML    = card.tags?.length
		? `<div class="tile-tags">${card.tags.map(t => `<span class="tile-tag">${t}</span>`).join('')}</div>`
		: '';

	let synergyHTML = '';
	if (cardType === 'MOSJE') {
		if (Array.isArray(card.synergyWith) && card.synergyWith.length > 0) {
			const names = card.synergyWith.map(cardNameById).join(', ');
			synergyHTML += `<p class="tile-synergy"><strong>Synergy:</strong> ${names}</p>`;
		}
		if (card.petSynergy) {
			synergyHTML += `<p class="tile-synergy tile-synergy--pet"><strong>Pet synergy:</strong> ${cardNameById(card.petSynergy)}</p>`;
		}
	}

	return `
		<div class="tile-art"${artStyle}>
			<div class="tile-art-overlay"></div>
			<div class="tile-art-header">
				<span class="tile-type-badge tile-type-badge--${typeSlug}">${typeBadge(cardType)}</span>
				${rarityLabel}
			</div>
		</div>
		<div class="tile-body">
			<div class="tile-name-wrap">
				<p class="tile-name">${card.name}</p>
				${subtypeLabel}
			</div>
			${statsHTML}
			${desc        ? `<p class="tile-desc">${desc}</p>`     : ''}
			${abilityHTML}
			${synergyHTML}
			${tagsHTML}
			${flavourHTML}
		</div>
		<div class="tile-actions">
			<button class="tile-btn tile-btn--remove" data-id="${id}" data-ctype="${cardType}" title="Remove one copy">−</button>
			<span class="tile-count">${count > 0 ? `×${count}` : ''}</span>
			<button class="tile-btn tile-btn--add" data-id="${id}" data-ctype="${cardType}" title="Add one copy" ${atMax ? 'disabled' : ''}>+</button>
		</div>`;
}

// Encode a file path for use inside a CSS url() string value.
// Encodes spaces and non-ASCII chars; leaves slashes and dots intact.
function cssUrl(path) {
	return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
}

function typeBadge(cardType) {
	const map = { MOSJE: 'Mosje', PIECIE: 'Piecie', SNELLE_PIECIE: 'Snelle', PLACE: 'Place', QUEST: 'Quest' };
	return map[cardType] || cardType;
}

function formatTraits(traits) {
	const ABBR = { physical: 'PHY', mental: 'MEN', social: 'SOC', creative: 'CRE', technical: 'TEC', resilient: 'RES' };
	return Object.entries(traits)
		.map(([k, v]) => `<span class="trait trait--${k}" title="${k}">${ABBR[k] || k.slice(0, 3).toUpperCase()} ${'★'.repeat(v)}</span>`)
		.join('');
}

// ── Render deck list (sidebar) ────────────────────────────────────────────────
function renderDeckList() {
	const ul = document.getElementById('deck-list');
	ul.innerHTML = '';
	for (const [ctype, entries] of Object.entries(deck)) {
		for (const [id, count] of Object.entries(entries)) {
			const card = ALL_CARDS.find(c => c.id === id);
			if (!card) continue;
			const li = document.createElement('li');
			li.className = `deck-list-item deck-list-item--${ctype.toLowerCase().replace('_', '-')}`;
			li.innerHTML = `
				<span class="deck-list-name">${count > 1 ? `×${count} ` : ''}${card.name}</span>
				<button class="tile-btn tile-btn--remove deck-list-remove" data-id="${id}" data-ctype="${ctype}" title="Remove">−</button>
			`;
			ul.appendChild(li);
		}
	}
	if (ul.children.length === 0) {
		ul.innerHTML = '<li class="deck-list-empty">No cards yet</li>';
	}
}

// ── Composition bar ───────────────────────────────────────────────────────────
function updateComposition() {
	const types = { MOSJE: 2, PIECIE: 8, SNELLE_PIECIE: 4, PLACE: 2, QUEST: 1 };
	const idMap = { MOSJE: 'mosje', PIECIE: 'piecie', SNELLE_PIECIE: 'snelle', PLACE: 'place', QUEST: 'quest' };
	let valid = true;
	for (const [ctype, limit] of Object.entries(types)) {
		const total = totalOfType(ctype);
		const key = idMap[ctype];
		document.getElementById(`count-${key}`).textContent = `${total} / ${limit}`;
		const bar = document.getElementById(`bar-${key}`);
		const pct = Math.min(100, (total / limit) * 100);
		bar.style.width = pct + '%';
		bar.classList.toggle('comp-bar--over', total > limit);
		if (ctype !== 'QUEST' && total !== limit) valid = false;
		if (ctype === 'QUEST' && total > limit) valid = false;
	}
	const validEl = document.getElementById('comp-valid');
	if (valid) {
		validEl.textContent = '✓ Deck is valid';
		validEl.className = 'comp-valid comp-valid--ok';
	} else {
		const missing = Object.entries(types)
			.filter(([ct]) => ct !== 'QUEST' && totalOfType(ct) !== types[ct])
			.map(([ct]) => `${idMap[ct]} (${totalOfType(ct)}/${types[ct]})`);
		validEl.textContent = missing.length ? `Fill: ${missing.join(', ')}` : 'Check deck limits';
		validEl.className = 'comp-valid comp-valid--warn';
	}
}

function updateAll() {
	updateComposition();
	renderDeckList();
	renderGrid();
}

// ── Event delegation for card grid + deck list ────────────────────────────────
document.getElementById('card-grid').addEventListener('click', e => {
	const btn = e.target.closest('.tile-btn');
	if (btn) {
		const { id, ctype } = btn.dataset;
		if (btn.classList.contains('tile-btn--add')) {
			const card = ALL_CARDS.find(c => c.id === id);
			if (card) addCard(card);
		} else if (btn.classList.contains('tile-btn--remove')) {
			removeCard(ctype, id);
		}
		return;
	}

	if (_dragMoved) return;
	const tile = e.target.closest('.card-tile');
	if (!tile) return;
	const card = ALL_CARDS.find(c => c.id === tile.dataset.id);
	if (card) showCardPreview(card);
});

document.getElementById('deck-list').addEventListener('click', e => {
	const btn = e.target.closest('.deck-list-remove');
	if (!btn) return;
	removeCard(btn.dataset.ctype, btn.dataset.id);
});

// ── Filter tabs ───────────────────────────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(tab => {
	tab.addEventListener('click', () => {
		document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
		tab.classList.add('active');
		activeFilter = tab.dataset.filter;
		renderGrid();
	});
});

document.getElementById('search-input').addEventListener('input', e => {
	searchQuery = e.target.value.trim();
	renderGrid();
});

// ── Drag-to-scroll on card grid ───────────────────────────────────────────────
// _dragMoved is read by the click handler above to suppress preview on scroll.
let _dragMoved = false;
(function initDragScroll() {
	const grid = document.getElementById('card-grid');
	let isDragging = false;
	let startY = 0;
	let startScrollTop = 0;

	grid.addEventListener('mousedown', e => {
		if (e.target.closest('.tile-btn')) return;
		isDragging = true;
		_dragMoved = false;
		startY = e.clientY;
		startScrollTop = grid.scrollTop;
		grid.classList.add('is-dragging');
		e.preventDefault();
	});

	document.addEventListener('mousemove', e => {
		if (!isDragging) return;
		if (Math.abs(e.clientY - startY) > 5) _dragMoved = true;
		grid.scrollTop = startScrollTop - (e.clientY - startY);
	});

	document.addEventListener('mouseup', () => {
		isDragging = false;
		grid.classList.remove('is-dragging');
		setTimeout(() => { _dragMoved = false; }, 0);
	});
})();

// ── Save deck ─────────────────────────────────────────────────────────────────
document.getElementById('btn-save-deck').addEventListener('click', async () => {
	const user = getCurrentUser();
	if (!user || user.isAnonymous) { showStatus('Sign in to save decks.', 'error'); return; }

	const name = document.getElementById('deck-name-input').value.trim();
	if (!name) { showStatus('Enter a deck name first.', 'error'); return; }

	// Validate required slots
	if (totalOfType('MOSJE') !== 2) { showStatus('Deck needs exactly 2 Mosjes.', 'error'); return; }
	if (totalOfType('PIECIE') !== 8) { showStatus('Deck needs exactly 8 Piecies.', 'error'); return; }
	if (totalOfType('SNELLE_PIECIE') !== 4) { showStatus('Deck needs exactly 4 Snelle Piecies.', 'error'); return; }
	if (totalOfType('PLACE') !== 2) { showStatus('Deck needs exactly 2 Places.', 'error'); return; }

	const deckId = editingDeckId || `custom_${Date.now()}`;
	const deckDef = {
		id: deckId,
		name,
		mosjes: expandDeckType('MOSJE'),
		piecies: expandDeckType('PIECIE'),
		snellePiecies: expandDeckType('SNELLE_PIECIE'),
		places: expandDeckType('PLACE'),
		quests: expandDeckType('QUEST'),
	};

	const btn = document.getElementById('btn-save-deck');
	btn.disabled = true;
	const result = await saveDeck(user.uid, deckDef);
	btn.disabled = false;

	if (result.success) {
		editingDeckId = deckId;
		// Refresh saved list
		savedDecks = await loadUserDecks(user.uid);
		populateDeckSelect();
		document.getElementById('deck-load-select').value = deckId;
		document.getElementById('btn-delete-deck').hidden = false;
		showStatus('Deck saved!', 'ok');
	} else {
		showStatus(result.error || 'Save failed. Try again.', 'error');
	}
});

function expandDeckType(ctype) {
	const result = [];
	for (const [id, count] of Object.entries(deck[ctype] || {})) {
		for (let i = 0; i < count; i++) result.push(id);
	}
	return result;
}

function showStatus(msg, type) {
	const el = document.getElementById('save-status');
	el.textContent = msg;
	el.className = `save-status save-status--${type}`;
	setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3000);
}

// ── Delete deck ───────────────────────────────────────────────────────────────
document.getElementById('btn-delete-deck').addEventListener('click', async () => {
	const user = getCurrentUser();
	if (!user || !editingDeckId) return;
	if (!confirm('Delete this deck? This cannot be undone.')) return;

	const result = await deleteDeck(user.uid, editingDeckId);
	if (!result.success) {
		showStatus(result.error || 'Delete failed. Try again.', 'error');
		return;
	}
	savedDecks = await loadUserDecks(user.uid);
	populateDeckSelect();
	clearDeck();
	showStatus('Deck deleted.', 'ok');
});
