// store.js — Booster Pack Store page.
// Auth-required. Anonymous/guest users are redirected to lobby.

import { onAuthStateChanged, getCurrentUser } from './multiplayer/authManager.js';
import { getWallet, spendMunten } from './multiplayer/walletStore.js';
import { getOwnedCardIds, addCardsToCollection } from './multiplayer/collectionStore.js';
import { initNewAccount } from './multiplayer/accountSetup.js';
import { drawPack, PACK } from './data/boosterEngine.js';
import { showPackOpeningOverlay } from './ui/packOpeningOverlay.js';

console.log('[STORE] store.js loaded');

let _uid = null;
let _balance = 0;
let _buying = false;

// ── Auth gate ─────────────────────────────────────────────────────────────────
onAuthStateChanged(async user => {
	if (!user) { window.location.href = './account.html'; return; }
	if (user.isAnonymous) { window.location.href = './index.html'; return; }

	_uid = user.uid;

	await initNewAccount(_uid);
	await refreshBalance();
	renderPack();
});

function formatMunten(n) {
	return Number(n).toLocaleString('nl-NL') + ' Munten';
}

async function refreshBalance() {
	const wallet = await getWallet(_uid);
	_balance = wallet.munten ?? 0;
	const el = document.getElementById('wallet-balance');
	if (el) el.textContent = formatMunten(_balance);
}

// ── Render the single pack ────────────────────────────────────────────────────
function renderPack() {
	const container = document.getElementById('store-pack-grid');
	if (!container) return;

	const canAfford = _balance >= PACK.cost;

	container.innerHTML = `
		<div class="store-pack-card">
			<div class="store-pack-art">
				<div class="store-pack-visual">
					<div class="spv-shine"></div>
					<div class="spv-top-strip"></div>
					<div class="spv-logo">MOSJES</div>
					<div class="spv-subtitle">BOOSTER PACK</div>
					<div class="spv-cards">
						<div class="spv-card spv-card--1"></div>
						<div class="spv-card spv-card--2"></div>
						<div class="spv-card spv-card--3"></div>
					</div>
					<div class="spv-bottom-strip"></div>
				</div>
			</div>
			<div class="store-pack-body">
				<h2 class="store-pack-name">${PACK.name}</h2>
				<p class="store-pack-desc">${PACK.description}</p>
				<p class="store-pack-count">${PACK.cardCount} cards per pack</p>
				<p class="store-pack-cost">${PACK.cost} Munten</p>
				<button
					id="btn-buy-pack"
					class="reward-btn store-pack-btn"
					${!canAfford ? 'disabled' : ''}
				>
					${canAfford ? 'Open Pack' : 'Not enough Munten'}
				</button>
			</div>
		</div>
	`;

	document.getElementById('btn-buy-pack')?.addEventListener('click', onBuyPack);
}

// ── Buy flow ──────────────────────────────────────────────────────────────────
async function onBuyPack() {
	if (_buying || !_uid) return;
	_buying = true;

	const btn = document.getElementById('btn-buy-pack');
	if (btn) { btn.disabled = true; btn.textContent = 'Opening...'; }

	// Read which cards the player owns BEFORE this pack, so overlay can show NEW badges
	const ownedBefore = await getOwnedCardIds(_uid);

	// Deduct Munten first — transaction will reject if insufficient
	const spendResult = await spendMunten(_uid, PACK.cost);
	if (!spendResult.success) {
		showStoreError(spendResult.error || 'Purchase failed. Try again.');
		if (btn) { btn.disabled = false; btn.textContent = 'Open Pack'; }
		_buying = false;
		return;
	}

	// Draw cards and add to collection
	const drawnCards = drawPack(PACK.cardCount);
	await addCardsToCollection(_uid, drawnCards.map(c => c.id));

	// Update local balance
	_balance = spendResult.newBalance;
	const balanceEl = document.getElementById('wallet-balance');
	if (balanceEl) balanceEl.textContent = formatMunten(_balance);

	// Show pack opening overlay
	showPackOpeningOverlay({
		drawnCards,
		ownedBefore,
		newBalance: _balance,
		onClose: () => {
			_buying = false;
			renderPack(); // re-render to update afford state
		},
	});
}

function showStoreError(msg) {
	const el = document.getElementById('store-error');
	if (!el) return;
	el.textContent = msg;
	el.hidden = false;
	setTimeout(() => { el.hidden = true; el.textContent = ''; }, 4000);
}
