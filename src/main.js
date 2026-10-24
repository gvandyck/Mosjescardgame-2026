// main.js — Entry point for the app.
// Detects the current page and starts the matching UI flow.

import { renderBoard, showPlaceEffectBanner } from './ui/boardRenderer.js';
import { getPlaceTint } from './ui/board/getPlaceTint.js';
import { toMosjeTileCards } from './ui/board/toMosjeTileCards.js';
import { pickStatusMessage } from './ui/board/pickStatusMessage.js';
import { renderStatusStrip } from './ui/board/renderStatusStrip.js';
import { createBoardController } from './ui/board/createBoardController.js';
import { offerWestPeek } from './ui/actions/offerWestPeek.js';
import { createLogRenderer } from './ui/logRenderer.js';
import { renderHand } from './ui/handRenderer.js';
import { initModalManager } from './ui/modalManager.js';
import { animateFieldActivation, animateStateDelta, showTurnTransition, setAbilityNameResolver, animateQuestResult, showInstantEffect, showDeckOutBanner, pulseDiscardPile, isSpotlightActive } from './ui/actionAnimations.js';
import { initHoverZoom } from './ui/hoverZoom.js';
import { initCardTierMotion } from './ui/cardTierMotion.js';
import { createInitialGameState, getOpponentMosjes, getPlayerMosjes, setActivePlace } from './engine/gameState.js';
import { startTurn, endTurn, playPiecie, activatePiecie, playSnellie, playPlace, playMosje, useMosjeAbility, canPlayerActNow } from './engine/turnManager.js';
import { PIECIE_TARGETS } from './rules/piecieTargets.js';
import { piecieTargetOptions } from './engine/targets/piecieTargetOptions.js';
import { isPiecieReady } from './engine/table/isPiecieReady.js';
import { attackMosje } from './engine/actions/attackMosje.js';
import { getPower } from './engine/mp/getPower.js';
import { rollQuestAttempt } from './engine/quests/rollQuestAttempt.js';
import { resolveQuestAttempt } from './engine/quests/resolveQuestAttempt.js';
import { chooseQuestChoices } from './bot/strategy/chooseQuestChoices.js';
import { settleReactions } from './ui/actions/settleReactions.js';
import { runAttackFlow } from './ui/actions/runAttackFlow.js';
import { runQuestFlow } from './ui/actions/runQuestFlow.js';
import { isCooldownBlocked } from './engine/turn/isCooldownBlocked.js';
import { getActivePartnerSynergyBonuses } from './abilities/questLogic.js';
import { getMingPeekStack } from './abilities/getMingPeekStack.js';
import { PIECIE_SLOT_COUNT } from './engine/table/tableRules.js';
import { loseMP, gainMP } from './engine/mpManager.js';
import { createMosjeSlot } from './engine/mp/createMosjeSlot.js';
import { checkVictory } from './engine/victoryChecker.js';
import { MOSJES } from './data/mosjes.js';
import { PIECIES } from './data/piecies.js';
import { SNELLE_PIECIES } from './data/snellePiecies.js';
import { PLACES } from './data/places.js';
import { QUESTS } from './data/quests.js';
import { createRoom, joinRoom } from './multiplayer/roomManager.js';
import { pushState, listenToState, stopListening, registerDisconnectLoss, cancelDisconnectHooks } from './multiplayer/syncManager.js';
import { eventBus } from './multiplayer/eventBus.js';
import { APP_VERSION } from './version.js';
import { applyGainToSlot } from './engine/mp/applyGainToSlot.js';
import { applyMpLossToSlot } from './engine/mp/applyMpLossToSlot.js';
import {
	onAuthStateChanged,
	signOut,
	getCurrentUser,
	reauthenticateCurrentUser,
	deleteCurrentAccount,
} from './multiplayer/authManager.js';
import { loadUserDecks, getLastUserStoreError, deleteUserData, getActiveDeckId, setActiveDeckId } from './multiplayer/userStore.js';
import { initNewAccount } from './multiplayer/accountSetup.js';
import { getPlayerFacingDecks } from './data/playerFacingDecks.js';
import { claimStarterDeck } from './multiplayer/claimStarterDeck.js';
import { resolveActiveDeck } from './multiplayer/resolveActiveDeck.js';
import { showOnboardingDeckPicker } from './ui/onboardingDeckPicker.js';
import { renderActiveDeckPanel } from './ui/activeDeckPanel.js';
import { claimMatchReward } from './multiplayer/matchRewards.js';
import { showRewardOverlay } from './ui/rewardOverlay.js';
import { driveBotTurn, driveBotTurnSteps } from './bot/botDriver.js';
import { settleMosjePauses } from './bot/settleMosjePauses.js';
import { runMosjeAbilityFlow } from './ui/actions/runMosjeAbilityFlow.js';
import { settlePendingChoice } from './ui/actions/settlePendingChoice.js';
import { showNewReveals } from './ui/showNewReveals.js';
import { pushTestDice } from './engine/dice/testDiceQueue.js';
import { pickBotDeck } from './bot/pickBotDeck.js';

console.log('[UI] App bootstrapping...');

const CARD_LOOKUP = buildCardLookup();
const revealSeen = new Set(); // reveal entries the local player has already been shown (EFX-07)
let _customDecksCache = [];
// Tracked active deck id for the signed-in (non-anonymous) lobby flow — read
// at form submit instead of the (hidden) #deck-select. Never falls back to
// an original id; see setupActiveDeckPanel / N1.
let signedInDeckId = null;
// Test-only fake signed-in user, set exclusively by the ?testActiveDeck=1 lobby
// stub so form submit exercises the real signed-in branch without Firebase.
let _testStubUser = null;

// Feed the ability-cast chip the real ability name: the part before ":" in the
// description, minus qualifiers like "(comeback)"/"(passive)".
initHoverZoom();
initCardTierMotion();

setAbilityNameResolver((mosjeId) => {
	const desc = CARD_LOOKUP[mosjeId]?.abilityDescription || '';
	return desc.split(':')[0].replace(/\s*\([^)]*\)/g, '').trim();
});

const path = window.location.pathname.toLowerCase();

if (path.endsWith('/index.html') || path.endsWith('/')) {
	initLobbyPage();
}

if (path.endsWith('/game.html') || path.endsWith('/game')) {
	initGamePage();
}

function initLobbyPage() {
	console.log('[UI] Initializing lobby page');
	setVersionLabel();
	const form = document.getElementById('lobby-form');
	if (!form) return;

	// Test hooks — gated behind URL params so they NEVER affect real play
	// (mirroring the game.html ?testMode=true pattern). Each skips the real
	// auth gate and drives the REAL lobby code with a fake user/store so
	// Playwright can assert on-screen behavior without touching Firebase.
	const testParams = new URLSearchParams(window.location.search);
	const isTestOnboarding = testParams.get('testOnboarding') === '1';
	const isTestActiveDeck = testParams.get('testActiveDeck') === '1';
	const isTestGuestDeck = testParams.get('testGuestDeck') === '1';
	if (isTestOnboarding) {
		// Skips the auth gate and runs the real blocking picker against a STUB
		// claim (no Firebase writes) so tests drive the actual modal DOM.
		runStubbedOnboarding();
	} else if (isTestActiveDeck) {
		// Drives the real setupActiveDeckPanel() with an in-memory fake decks
		// list + fake active id (no Firebase) so the panel + Change-deck
		// switcher can be asserted live.
		runStubbedActiveDeck();
	} else if (isTestGuestDeck) {
		// Guest (anonymous) users never trigger Firebase calls inside
		// handleLobbyAuthChange (all storage calls are gated on
		// !user.isAnonymous), so a fake anonymous user object drives the
		// exact real guest branch safely, with no test-only duplicate code.
		handleLobbyAuthChange({ uid: 'test-guest', isAnonymous: true, displayName: null });
	} else {
		// Auth gate: redirect to account page if not signed in.
		// Also pre-fills name and shows user badge once auth resolves.
		onAuthStateChanged(handleLobbyAuthChange);
	}

	// Sign out button
	document.getElementById('btn-signout')?.addEventListener('click', async () => {
		await signOut();
		window.location.href = './account.html';
	});

	document.getElementById('btn-delete-account')?.addEventListener('click', deleteSignedInAccount);

	form.addEventListener('submit', async event => {
		event.preventDefault();
		const name = String(document.getElementById('player-name')?.value || '').trim();
		// Signed-in (non-anonymous) users play with their tracked active deck;
		// guests read the (duo-only) dropdown. Never fall back to an original id.
		const submitUser = _testStubUser || getCurrentUser();
		const deckId = submitUser && !submitUser.isAnonymous
			? (signedInDeckId || getPlayerFacingDecks()[0].id)
			: String(document.getElementById('deck-select')?.value || getPlayerFacingDecks()[0].id);
		const mode = String(document.querySelector('input[name="lobby-mode"]:checked')?.value || 'create');
		const roomCodeInput = String(document.getElementById('room-code')?.value || '').trim();

		if (!name) {
			window.alert('Please enter your player name.');
			return;
		}

		// Persist custom deck def to sessionStorage so game page can reconstruct it.
		// Must happen BEFORE the offline early-return: offline games need it too
		// (a signed-in player's active deck can be a custom_ deck).
		if (deckId.startsWith('custom_')) {
			const customDef = _customDecksCache.find(d => d.id === deckId);
			if (customDef) sessionStorage.setItem(`mosjes:customDeck:${deckId}`, JSON.stringify(customDef));
		}

		const isOffline = document.getElementById('play-offline')?.checked === true;
		if (isOffline) {
			// True-random bot deck from the player-facing duo pool (mirror allowed).
			const botDeckId = pickBotDeck(getPlayerFacingDecks()).id;

			sessionStorage.setItem('mosjes:offline', JSON.stringify({
				name,
				deckId,
				botDeckId,
				playerId: 'player_1',
			}));

			window.location.href = `./game.html?offline=true&player=player_1`;
			return;
		}

		if (mode === 'join' && roomCodeInput.length !== 4) {
			window.alert('Please enter a 4-digit room code to join.');
			return;
		}

		const submitBtn = form.querySelector('button[type="submit"]');
		if (submitBtn) submitBtn.disabled = true;

		const lobbyUser = getCurrentUser();
		const lobbyUid = lobbyUser && !lobbyUser.isAnonymous ? lobbyUser.uid : null;

		if (mode === 'create') {
			const result = await createRoom(name, deckId, lobbyUid);
			if (!result.success) {
				window.alert(result.error || 'Could not create a room. Please try again.');
				if (submitBtn) submitBtn.disabled = false;
				return;
			}
			const code = result.roomCode;
			// Show room code to player so they can share it
			const display = document.getElementById('room-code-display');
			const codeEl = document.getElementById('room-code-value');
			if (display && codeEl) {
				codeEl.textContent = code;
				display.hidden = false;
				form.hidden = true;
			}
			sessionStorage.setItem('mosjes:lobby', JSON.stringify({ name, deckId, mode: 'create', roomCode: code, playerId: 'player_1' }));
			console.log('[UI] Room created:', code);
			setTimeout(() => {
				window.location.href = `./game.html?room=${encodeURIComponent(code)}&player=player_1`;
			}, 2000);
		} else {
			const result = await joinRoom(roomCodeInput, name, deckId, lobbyUid);
			if (!result.success) {
				window.alert(result.error || 'Could not join room. Please check the code and try again.');
				if (submitBtn) submitBtn.disabled = false;
				return;
			}
			// Store opponent (player_1) data if available from room doc
			const opponentData = result.roomDoc?.players?.player_1 || {};
			sessionStorage.setItem('mosjes:lobby', JSON.stringify({
				name,
				deckId,
				mode: 'join',
				roomCode: roomCodeInput,
				playerId: 'player_2',
				opponentName: opponentData.name || 'Opponent',
				opponentDeckId: opponentData.deckId || 'EXAMPLE_TAKSEN',
				opponentUid: opponentData.uid || null,
			}));
			console.log('[UI] Joined room:', roomCodeInput);
			window.location.href = `./game.html?room=${encodeURIComponent(roomCodeInput)}&player=player_2`;
		}
	});
}

// Lobby auth-gate handler: redirect signed-out users, prep the lobby for
// signed-in users, and run the blocking starter-deck onboarding when a
// registered (non-anonymous) user owns 0 saved decks.
async function handleLobbyAuthChange(user) {
	if (!user) {
		window.location.href = './account.html';
		return;
	}
	// Pre-fill player name from account
	const nameInput = document.getElementById('player-name');
	if (nameInput && !nameInput.value && user.displayName) {
		nameInput.value = user.displayName;
	}
	// Show user badge
	const badge = document.getElementById('user-badge');
	const badgeName = document.getElementById('user-badge-name');
	const deleteAccountBtn = document.getElementById('btn-delete-account');
	if (badge && badgeName) {
		badgeName.textContent = user.isAnonymous ? 'Playing as Guest' : user.displayName || user.email;
		badge.hidden = false;
	}
	if (deleteAccountBtn) deleteAccountBtn.hidden = user.isAnonymous;
	// Guests: populate #deck-select with the 5 player-facing duo decks only
	// (no originals) — the same pool the bot picks from and the onboarding
	// picker offers to registered users.
	if (user.isAnonymous) {
		const deckSelect = document.getElementById('deck-select');
		if (deckSelect) {
			for (const deck of getPlayerFacingDecks()) {
				const opt = document.createElement('option');
				opt.value = deck.id;
				opt.textContent = deck.name;
				deckSelect.appendChild(opt);
			}
		}
	}
	// One-time account setup (wallet + starter collection) for registered users
	if (!user.isAnonymous) {
		initNewAccount(user.uid, user.displayName || '');
	}
	// Load custom decks into deck selector (registered users only)
	if (!user.isAnonymous) {
		let customDecks = await loadUserDecks(user.uid);
		if (getLastUserStoreError()) {
			console.warn('[UI] Custom decks could not load. Check Firebase Database rules.');
		}
		// Blocking onboarding: a registered user with 0 saved decks must pick a
		// starter duo deck (save + setActive + exact card grant) before the
		// lobby is usable. Skipped when the deck load errored (a Firebase read
		// failure must not trap an existing account in the picker).
		if (customDecks.length === 0 && !getLastUserStoreError()) {
			const deckId = await promptStarterDeckPick();
			const deck = getPlayerFacingDecks().find(d => d.id === deckId);
			const claimed = await claimStarterDeck(user.uid, deck);
			if (!claimed?.success) {
				console.warn('[UI] Starter deck claim failed:', claimed?.error);
			}
			customDecks = await loadUserDecks(user.uid);
		}
		_customDecksCache = customDecks;
		// Signed-in users get the active-deck panel instead of the dropdown
		// (guests keep #deck-select, populated above).
		await setupActiveDeckPanel(user.uid, customDecks);
	}
}

// Signed-in (non-anonymous) lobby: hide #deck-select, show the active-deck
// panel (name + Mosjes), and wire the Change-deck switcher. Persists a
// migration-safe default (first deck) when activeDeckId was missing.
// `getActive`/`setActive` default to the real userStore accessors; the
// ?testActiveDeck=1 hook (runStubbedActiveDeck) injects in-memory stubs so
// this exact real code path is exercised live with no Firebase calls.
async function setupActiveDeckPanel(uid, decks, { getActive = getActiveDeckId, setActive = setActiveDeckId } = {}) {
	const deckSelect = document.getElementById('deck-select');
	const deckLabel = document.querySelector('label[for="deck-select"]');
	const panel = document.getElementById('active-deck-panel');
	if (deckSelect) deckSelect.hidden = true;
	if (deckLabel) deckLabel.hidden = true;
	if (panel) panel.hidden = false;

	const activeId = await getActive(uid);
	const active = resolveActiveDeck(decks, activeId);
	if (!active) return;
	if (!activeId) {
		await setActive(uid, active.id);
	}
	signedInDeckId = active.id;
	renderActiveDeckPanel(panel, active);

	const changeBtn = document.getElementById('btn-change-deck');
	changeBtn?.addEventListener('click', async () => {
		const modal = initModalManager(document.getElementById('modal-root'));
		const picked = await modal.showOptionSelect({
			title: 'Change active deck',
			options: decks.map(d => ({ id: d.id, label: d.name })),
			allowCancel: true,
		});
		if (!picked) return;
		await setActive(uid, picked);
		signedInDeckId = picked;
		renderActiveDeckPanel(panel, decks.find(d => d.id === picked) || active);
	});
}

// Blocks until a duo deck is picked. allowCancel:false means the picker
// should never resolve null — the loop is defensive so the lobby stays
// locked even if the modal is force-closed some other way.
async function promptStarterDeckPick() {
	const modal = initModalManager(document.getElementById('modal-root'));
	let deckId = null;
	while (!deckId) {
		deckId = await showOnboardingDeckPicker(modal, getPlayerFacingDecks());
	}
	return deckId;
}

// testOnboarding=1 stub path: drives the REAL blocking modal DOM but skips
// the Firebase claim entirely (logs the pick instead). Test-only.
async function runStubbedOnboarding() {
	const deckId = await promptStarterDeckPick();
	console.log('[UI] testOnboarding: picked starter deck', deckId);
}

// testActiveDeck=1 stub path: drives the REAL setupActiveDeckPanel() (panel
// render + Change-deck switcher) against an in-memory fake decks list (>=2
// real duo decks) + a fake active id, with getActiveDeckId/setActiveDeckId
// stubbed to read/update that in-memory state (no Firebase), mirroring the
// testOnboarding hook style. Exposes signedInDeckId so a test can assert
// what game-start would read after a switch. Test-only.
async function runStubbedActiveDeck() {
	const fakeDecks = getPlayerFacingDecks().slice(0, 2);
	// &testCustomActive=1: prepend a deck-builder-style custom deck (custom_ id)
	// and make it the active deck — drives the signed-in offline flow with a
	// custom deck, which cannot resolve from STARTER_DECKS on the game page.
	if (new URLSearchParams(window.location.search).get('testCustomActive') === '1') {
		fakeDecks.unshift({ ...fakeDecks[0], id: 'custom_test_deck', name: 'Custom Test Deck' });
	}
	let fakeActiveId = fakeDecks[0].id;
	_customDecksCache = fakeDecks;
	_testStubUser = { uid: 'test-uid', isAnonymous: false, displayName: 'TestPlayer' };
	window.__testActiveDeckHook = {
		get signedInDeckId() { return signedInDeckId; },
		get seededDeckIds() { return fakeDecks.map(d => d.id); },
	};
	await setupActiveDeckPanel('test-uid', fakeDecks, {
		getActive: async () => fakeActiveId,
		setActive: async (_uid, id) => { fakeActiveId = id; return { success: true }; },
	});
}

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
		alert(reauth.error || 'Could not confirm your account. Please sign in again and try once more.');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	const dataResult = await deleteUserData(user.uid);
	if (!dataResult.success) {
		alert(dataResult.error || 'Could not delete saved account data. Please try again.');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	const authResult = await deleteCurrentAccount();
	if (!authResult.success) {
		alert(authResult.error || 'Could not delete account. Please sign in again and try once more.');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	window.location.href = './account.html?msg=account-deleted';
}

function initGamePage() {
	console.log('[UI] Initializing game page');
	setVersionLabel();

	const boardRoot = document.getElementById('board-root');
	const handRoot = document.getElementById('hand-root');
	const logRoot = document.getElementById('log-root');
	const modalRoot = document.getElementById('modal-root');
	const turnLabel = document.getElementById('turn-label');
	const logToggleBtn = document.getElementById('btn-toggle-log');
	const logPopover = document.getElementById('topbar-log-popover');
	const copyLogBtn = document.getElementById('btn-copy-log');
	const logCopyBuffer = document.getElementById('log-copy-buffer');
	// End Turn moved into the board's middle strip (63-01): keep the node so its one click listener survives every re-render.
	const endTurnButton = document.getElementById('btn-end-turn');

	if (!boardRoot || !handRoot || !logRoot || !modalRoot) {
		console.log('[UI] Game containers missing — page not fully ready');
		return;
	}

	if (logToggleBtn && logPopover) {
		const setLogOpen = (open) => {
			logPopover.classList.toggle('is-visible', open);
			logToggleBtn.setAttribute('aria-expanded', String(open));
			logToggleBtn.classList.toggle('is-open', open);
		};

		setLogOpen(false);

		logToggleBtn.addEventListener('click', () => {
			const isOpen = logPopover.classList.contains('is-visible');
			setLogOpen(!isOpen);
		});

		document.addEventListener('click', (event) => {
			if (!logPopover.classList.contains('is-visible')) return;
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (logPopover.contains(target) || logToggleBtn.contains(target)) return;
			setLogOpen(false);
		});

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && logPopover.classList.contains('is-visible')) setLogOpen(false);
		});
	}

	// ── "How to Win" popover — same toggle pattern as the Battle Log ──────
	const winToggleBtn = document.getElementById('btn-toggle-win');
	const winPopover = document.getElementById('topbar-win-popover');
	if (winToggleBtn && winPopover) {
		const setWinOpen = (open) => {
			winPopover.classList.toggle('is-visible', open);
			winToggleBtn.setAttribute('aria-expanded', String(open));
			winToggleBtn.classList.toggle('is-open', open);
		};

		setWinOpen(false);

		winToggleBtn.addEventListener('click', () => {
			setWinOpen(!winPopover.classList.contains('is-visible'));
		});

		document.addEventListener('click', (event) => {
			if (!winPopover.classList.contains('is-visible')) return;
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (winPopover.contains(target) || winToggleBtn.contains(target)) return;
			setWinOpen(false);
		});

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && winPopover.classList.contains('is-visible')) setWinOpen(false);
		});
	}

	const urlParams = new URLSearchParams(window.location.search);
	const lobbyData = readLobbyData();
	const log = createLogRenderer(logRoot);

	const roomCodeBadge = document.getElementById('topbar-room-code');
	const roomCodeValue = document.getElementById('topbar-room-code-value');
	if (roomCodeBadge && roomCodeValue && lobbyData.roomCode) {
		roomCodeValue.textContent = lobbyData.roomCode;
		roomCodeBadge.hidden = false;
		roomCodeBadge.style.cursor = 'pointer';
		roomCodeBadge.title = 'Click to copy room code';
		roomCodeBadge.addEventListener('click', async () => {
			const code = roomCodeValue.textContent || '';
			if (!code || code === 'Copied!') return;
			try {
				if (navigator?.clipboard?.writeText) {
					await navigator.clipboard.writeText(code);
					roomCodeValue.textContent = 'Copied!';
					window.setTimeout(() => { roomCodeValue.textContent = code; }, 1200);
				}
			} catch {
				// Clipboard blocked (e.g. insecure context) — leave the code visible to copy manually.
			}
		});
	}
	const modal = initModalManager(modalRoot);
	if (logCopyBuffer) log.attachBuffer(logCopyBuffer);

	if (copyLogBtn) {
		copyLogBtn.addEventListener('click', async () => {
			const plain = log.asText();
			if (logCopyBuffer) logCopyBuffer.value = plain;
			try {
				if (navigator?.clipboard?.writeText) {
					await navigator.clipboard.writeText(plain);
					copyLogBtn.textContent = 'Copied';
					window.setTimeout(() => { copyLogBtn.textContent = 'Copy Log'; }, 1200);
					return;
				}
			} catch {
				// Fallback to selectable textarea below.
			}
			if (logCopyBuffer) {
				logCopyBuffer.focus();
				logCopyBuffer.select();
			}
		});
	}

	// Determine which player this client controls
	const localPlayerId = urlParams.get('player') || lobbyData.playerId || 'player_1';
	const opponentId = localPlayerId === 'player_1' ? 'player_2' : 'player_1';
	// De-dupe id for the deck-out recycle notice so re-renders / repeated remote pushes
	// don't re-show the banner. Fires again only on a genuinely new deck-out (new turn).
	let _lastDeckOutShownId = null;
	const roomCode = urlParams.get('room') || lobbyData.roomCode || 'LOCAL';
	const isOffline  = urlParams.get('offline')   === 'true';
	const isBotVsBot = urlParams.get('botvsbot') === 'true';

	const localPlayerName = lobbyData.name || 'Player 1';
	// N1: never default a player-facing deck selection to an original id.
	const localDeckId = lobbyData.deckId || getPlayerFacingDecks()[0].id;
	const opponentName = lobbyData.opponentName || 'Opponent';
	const opponentDeckId = lobbyData.opponentDeckId || pickOpponentDeck(localDeckId);
	const opponentUid = lobbyData.opponentUid || null;

	const isOnline = roomCode !== 'LOCAL';

	let gameState = null;
	let nextDice = []; // testMode setNextDice queue (Quest rolls)

	// 63-05: the tap-first board. The controller owns selection, the action tray, attack targeting and Quest choosing; its handlers
	// feed the SAME flows the old buttons use (runAttackFlow / runQuestFlow with preset arguments, ability, Piecie activation).
	const boardController = createBoardController({
		getState: () => gameState,
		localPlayerId,
		onChange: () => updateStatusStrip(),
		handlers: {
			attack: (slotIndex, targetPlayerId, targetSlotIndex) => runMosjeAction(runAttackFlow, 'attack', { slotIndex, targetPlayerId, targetSlotIndex }),
			beginQuest: () => offerQuestPeek(),
			quest: (slotIndex, stackId) => runMosjeAction(runQuestFlow, 'quest', { slotIndex, stackId }),
			ability: (cardId) => handleUseAbility(cardId),
			activate: (slotIndex) => handleActivatePiecie(slotIndex),
		},
	});

	// Stats accumulator — local player game summary for end-screen
	let gameStats = {
		questsAttempted: 0,
		questsSucceeded: 0,
		peakMP: 0,
		biggestSingleGain: 0,
		mosjesLost: 0,
	};
	let prevActiveSlots = null; // snapshot of local player's active slots after each render
	let gameOverHandled = false; // guard: the win overlay must only ever show once

	// ── Sync helpers ──────────────────────────────────────────────────────
	function syncPush() {
		if (isOnline && gameState) pushState(roomCode, gameState);
	}

	// Tracks peak MP for local player after every render.
	function trackPeakMP() {
		const localPlayer = gameState.players?.[localPlayerId];
		if (!localPlayer) return;
		(localPlayer.activeSlots || []).forEach(slot => {
			if (!slot) return;
			const mp = Number(slot.mp || 0);
			if (mp > gameStats.peakMP) gameStats.peakMP = mp;
		});
	}

	// ── Offline win-check wrapper ──────────────────────────────────────────
	// After any human action, check if the game just ended.
	// Replaces bare renderFromState(gameState) calls in all 7 action handlers.
	function renderAndCheckWin() {
		const localSlots = gameState.players?.[localPlayerId]?.activeSlots || [];

		renderFromState(gameState);

		// Detect mosje defeats since last render
		if (prevActiveSlots) {
			prevActiveSlots.forEach((before, i) => {
				const after = localSlots[i];
				if (before && !before.isDefeated && after && after.isDefeated) {
					gameStats.mosjesLost += 1;
				}
			});
		}
		prevActiveSlots = localSlots.map(s => s ? { isDefeated: s.isDefeated } : null);

		trackPeakMP();
		if (isOffline && gameState && gameState.status === 'FINISHED') {
			handleGameOver(gameState);
		}
	}

	function snapshotForAnimation(state = gameState) {
		if (!state) return null;
		return JSON.parse(JSON.stringify(state));
	}

	function renderAndAnimate(beforeState, options = {}) {
		renderAndCheckWin();
		animateStateDelta(beforeState, gameState, {
			actorId: localPlayerId,
			localPlayerId,
			...options,
		});
	}

	// ── Bot vs Bot loop — drives both players with per-action delays ────
	// Bot-vs-bot step delay: ?fast=true collapses the pause to 30ms (sim speed);
	// ?delay=<ms> sets a custom pace for watching slowly; otherwise 1000ms.
	const botStepDelay = urlParams.get('fast') === 'true'
		? 30
		: (Number(urlParams.get('delay')) || 1000);

	function runBotVsBotLoop() {
		if (!gameState || gameState.status === 'FINISHED') return;
		const botId = gameState.activePlayerId;
		const botName = gameState.players[botId]?.name ?? botId;
		let steps;
		try {
			steps = driveBotTurnSteps(gameState, botId, { humanIds: [localPlayerId] });
		} catch (err) {
			console.error('[BOT] driveBotTurnSteps threw:', err);
			return;
		}
		playBotSteps(steps, botName, 0, botStepDelay);
	}

	// Log the R1 free Mosje that startTurn() just placed for an empty field (one-shot marker).
	function logR1Placement() {
		const ev = gameState._r1Event;
		if (!ev) return;
		delete gameState._r1Event;
		log.add('gain', `R1: ${ev.name} placed free and fresh (empty field)`);
	}

	// Reaction windows (Phase 57): the human is prompted, a bot answers at once. Returns the settled state.
	// Mosje pauses that belong to the bot (offline / bot-vs-bot only) are answered at once so play never stalls.
	function settleBotMosjePauses(state) {
		if (!isOffline && !isBotVsBot) return state;
		return settleMosjePauses(state, isBotVsBot ? [] : [localPlayerId]).state;
	}
	// The local human's own pauses (trigger choice, draw-step abilities): prompt, then render the settled state.
	function settleLocalMosjePauses() {
		if (!gameState || (!gameState.pendingChoice && !gameState.pendingDrawStep)) return;
		const humanIds = isOffline ? [localPlayerId] : Object.keys(gameState.players);
		settlePendingChoice({ state: gameState, localPlayerId, modal, humanIds }).then(async st => {
			// A paused Piecie opens its after-activation reaction window when the last answer comes in.
			if (st.pendingReaction) st = await settleReactions(st, reactionCtx());
			gameState = st;
			syncPush();
			renderFromState(gameState);
		});
	}
	const reactionCtx = () => ({ localPlayerId, isOffline, modal, onLog: msg => log.add('info', msg) });

	// delay: ms between each step. onComplete: called after the final step instead of
	// advancing to the next bot (used by offline single-player to hand back to the human).
	async function playBotSteps(steps, botName, index, delay = 1000, onComplete = null) {
		if (index >= steps.length) { if (onComplete) onComplete(); return; }

		// Wait the animation delay before processing this step
		await new Promise(resolve => setTimeout(resolve, delay));

		const prevState = gameState;
		const { state: nextState, label } = steps[index];

		// Apply bot step
		gameState = nextState;
		renderFromState(gameState);
		animateStateDelta(prevState, gameState, {
			actorId: prevState.activePlayerId,
			localPlayerId,
			actionLabel: 'bot-step',
			isBotStep: true,
		});
		log.add('quest', `${botName} ${label}`);
		// A bot action opened a window for the human: prompt, then resume the bot turn from the new state.
		if (isOffline && gameState.pendingReaction?.responderId === localPlayerId) {
			const botId = gameState.pendingReaction.actorId;
			gameState = await settleReactions(gameState, reactionCtx());
			renderFromState(gameState);
			if (gameState.status === 'FINISHED') { handleGameOver(gameState); return; }
			if (gameState._testNoBotResume) { // test hook botActivatePiecie: the single activation is the whole bot turn
				delete gameState._testNoBotResume;
				gameState.activePlayerId = localPlayerId;
				renderFromState(gameState);
				if (onComplete) onComplete();
				return;
			}
			let freshSteps;
			try { freshSteps = driveBotTurnSteps(gameState, botId, { humanIds: [localPlayerId] }); }
			catch (err) { console.error('[BOT] resume after reaction threw:', err); freshSteps = []; }
			if (!freshSteps || freshSteps.length === 0) { if (onComplete) onComplete(); return; }
			await playBotSteps(freshSteps, botName, 0, delay, onComplete);
			return;
		}
		// Let a spotlighted bot play be read before the next step (rAF: spotlight opens next frame).
		await new Promise(resolve => setTimeout(resolve, 60));
		if (isSpotlightActive()) await new Promise(resolve => setTimeout(resolve, 1500));

		if (gameState.status === 'FINISHED') {
			handleGameOver(gameState);
			return;
		}

		if (index === steps.length - 1) {
			if (onComplete) {
				onComplete();
			} else {
				// bot vs bot: start next player's turn and keep the loop going
				gameState = settleBotMosjePauses(startTurn(gameState));
				renderFromState(gameState);
				if (gameState.status === 'FINISHED') { handleGameOver(gameState); return; }
				logR1Placement();
				runBotVsBotLoop();
			}
			return;
		}

		await playBotSteps(steps, botName, index + 1, delay, onComplete);
	}

	// Offline single-player: drive one bot (player_2) turn, then hand back to the human.
	// If the human's turn was skipped (deck-out penalty bounced control back to the bot),
	// drive another bot turn instead of handing the human a dead turn — otherwise the game
	// freezes with the end-turn button enabled but no player able to act.
	function runOfflineBotTurnThenHuman() {
		if (!isOffline || !gameState || gameState.status === 'FINISHED') return;
		if (gameState.activePlayerId !== 'player_2') return;
		const endTurnBtn = document.getElementById('btn-end-turn');
		if (endTurnBtn) endTurnBtn.disabled = true;

		const botName = gameState.players['player_2']?.name ?? 'Bot';
		let steps;
		try {
			steps = driveBotTurnSteps(gameState, 'player_2', { humanIds: [localPlayerId] });
		} catch (err) {
			console.error('[BOT] driveBotTurnSteps threw:', err);
			if (endTurnBtn) endTurnBtn.disabled = false;
			return;
		}

		playBotSteps(steps, botName, 0, 400, () => {
			if (gameState.status === 'FINISHED') return;
			const beforeHumanTurn = snapshotForAnimation();
			gameState = settleBotMosjePauses(startTurn(gameState));
			renderFromState(gameState);
			settleLocalMosjePauses();
			// 2.0: startTurn can end the game (held Level 3) - show the end screen.
			if (gameState.status === 'FINISHED') { handleGameOver(gameState); return; }
			animateStateDelta(beforeHumanTurn, gameState, {
				actorId: localPlayerId,
				localPlayerId,
				actionLabel: 'turn-start',
			});
			log.add('gain', `Now active: ${gameState.players[gameState.activePlayerId]?.name}. Turn ${gameState.turnNumber}.`);
			logR1Placement();
			showTurnTransition({
				playerName: gameState.players[gameState.activePlayerId]?.name,
				turnNumber: gameState.turnNumber,
				type: 'start',
			});
			// If startTurn skipped the human (deck-out), control is back on the bot — go again.
			if (gameState.activePlayerId === 'player_2' && gameState.status !== 'FINISHED') {
				runOfflineBotTurnThenHuman();
			} else if (endTurnBtn) {
				endTurnBtn.disabled = false;
			}
		}).catch(err => console.error('[BOT] playBotSteps error:', err));
	}

	// Turn the raw win-reason enum into a plain-language sentence the player can
	// actually parse ("KNOCKOUT" → "all of Bot's Mosjes were defeated"), including
	// who/what triggered it. Keeps the win legible even when it fires on the
	// opponent's turn (e.g. the bot KO'ing its own last Mosje on a failed quest).
	function describeWin(gs) {
		const winner = gs.players[gs.winnerId];
		const opponentId = Object.keys(gs.players).find(id => id !== gs.winnerId);
		const opponent = gs.players[opponentId];
		const winnerName = winner?.name || 'Winner';
		const opponentName = opponent?.name || 'Opponent';

		switch (gs.winReason) {
			case 'LEVEL_3': {
				const champ = (winner?.activeSlots || []).find(s => s && s.level >= 3);
				const who = champ?.name || `${winnerName}'s Mosje`;
				return `${who} held Level 3 until their turn — victory!`;
			}
			case 'KNOCKOUT': {
				const lastDefeated = [...(opponent?.welloePile || [])].reverse()
					.find(c => c?.type === 'MOSJE');
				const tail = lastDefeated?.name ? ` (last to fall: ${lastDefeated.name})` : '';
				return `${opponentName} has no Mosje left outside the Welloe pile${tail}.`;
			}
			default:
				return String(gs.winReason || 'Game over');
		}
	}

	// ── Post-match reward flow ────────────────────────────────────────────
	async function handleGameOver(gs) {
		if (gameOverHandled) return; // already shown — never stack a second overlay
		gameOverHandled = true;
		await cancelDisconnectHooks();
		stopListening();
		const winnerName = gs.players[gs.winnerId]?.name || 'Unknown';
		const opponentName = gs.players[localPlayerId === 'player_1' ? 'player_2' : 'player_1']?.name || 'Opponent';
		const outcome = gs.winnerId === localPlayerId ? 'win' : 'loss';
		const winDetail = describeWin(gs);

		log.add('win', `🏆 ${winnerName} wins! ${winDetail}`);

		let muntenAwarded = 0;
		const user = getCurrentUser();
		if ((isOnline || isOffline) && user && !user.isAnonymous) {
			const rewardRoomCode = isOnline ? roomCode : `OFFLINE_${Date.now()}`;
			const result = await claimMatchReward(rewardRoomCode, user.uid, outcome, opponentName);
			muntenAwarded = result.muntenAwarded;
		}

		showRewardOverlay({ outcome, winnerName, winReason: gs.winReason, winDetail, muntenAwarded, isOnline, stats: gameStats, logEntries: log.getEntries() });
	}

	// ── Shared remote-state handler — registered after game init ─────────
	function onRemoteState(remoteState) {
		for (const [pid, p] of Object.entries(remoteState.players || {})) {
			const slots = p.piecieSlots;
			const slotsSummary = Array.isArray(slots)
				? slots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | ')
				: JSON.stringify(slots);
			console.log(`[UI] onRemoteState ${pid} piecieSlots:`, slotsSummary);
		}
		const { state: sanitizedState, changed } = sanitizeQuestCardsInPlayerZones(remoteState);
		gameState = sanitizedState;
		renderFromState(gameState);
		// Persist one-time migration so all clients stop seeing legacy GENERAL quests in player zones.
		if (changed && isOnline && localPlayerId === 'player_1') {
			syncPush();
		}
		const activeName = gameState.players[gameState.activePlayerId]?.name;
		log.add('quest', `Opponent acted — now ${activeName}'s turn.`);
		if (gameState.status === 'FINISHED') {
			handleGameOver(gameState);
		}
	}

	// ── Initialize game ──────────────────────────────────────────────────
	function resolveCustomDeckDef(deckId) {
		if (!deckId.startsWith('custom_')) return undefined;
		return _customDecksCache.find(d => d.id === deckId) || readCustomDeckFromSession(deckId);
	}

	// Test hooks — only active when URL contains ?testMode=true
	if (urlParams.get('testMode') === 'true') {
		const cardTypeFor = (cardId) =>
			String(cardId).startsWith('mosje_') ? 'MOSJE'
			: String(cardId).startsWith('snelle_') ? 'SNELLE_PIECIE'
			: String(cardId).startsWith('place_') ? 'PLACE'
			: String(cardId).startsWith('quest_') ? 'QUEST'
			: 'PIECIE';
		window.__testHooks = {
			setMosjeMP(playerId, slotIndex, mp) {
				const slot = gameState?.players?.[playerId]?.activeSlots?.[slotIndex];
				if (slot) { slot.mp = mp; renderFromState(gameState); } // mp-direct-ok: test hook, absolute set
			},
			// Make every face-down piecie/place immediately activatable THIS turn so a
			// card test can place + activate without ending the turn (avoids the bot's
			// turn entirely — important now that defeat-at-0 lets the bot KO a lone Mosje).
			unlockPiecies(playerId) {
				const player = gameState?.players?.[playerId];
				if (!player || !Array.isArray(player.piecieSlots)) return;
				for (const slot of player.piecieSlots) {
					if (slot && !slot.activated && slot.faceDown) {
						slot.canActivateOnTurn = gameState.turnNumber;
					}
				}
				renderFromState(gameState);
			},
			setMpLostThisTurn(playerId, slotIndex, amount) {
				const slot = gameState?.players?.[playerId]?.activeSlots?.[slotIndex];
				if (slot) slot.mpLostThisTurn = amount;
			},
			setPieciesPlayedThisTurn(playerId, count) {
				const player = gameState?.players?.[playerId];
				if (player) player.pieciesPlayedThisTurn = count;
			},
			setLastCardPlayedType(playerId, type) {
				const player = gameState?.players?.[playerId];
				if (player) { player.lastCardPlayedType = type; }
			},
			setPendingTargets(targets) {
				if (gameState) { gameState._pendingTargets = targets; }
			},
			injectHandCard(playerId, cardId) {
				const player = gameState?.players?.[playerId];
				if (!player) return;
				player.hand.unshift({ cardId, type: cardTypeFor(cardId) });
				renderFromState(gameState);
			},
			// Replace the hand with exactly the given cards. Keeps the hand small so a
			// card's play button is never pushed off-screen by a bloated hand.
			setHand(playerId, cardIds) {
				const player = gameState?.players?.[playerId];
				if (!player || !Array.isArray(cardIds)) return;
				player.hand = cardIds.map(cardId => ({ cardId, type: cardTypeFor(cardId) }));
				renderFromState(gameState);
			},
			// Obby 2.0 — set a player's Energy pool (clamped 0..6).
			setEnergy(playerId, n) {
				const player = gameState?.players?.[playerId];
				if (!player) return;
				player.energy = Math.max(0, Math.min(6, Math.trunc(Number(n) || 0)));
				renderFromState(gameState);
			},
			getEnergy(playerId) {
				return gameState?.players?.[playerId]?.energy;
			},
			// Place a specific Mosje into a slot with custom MP/level — lets a scenario
			// set up exactly the board it needs (e.g. two Mosjes for Tuk Healer/Tactician,
			// or a specific opponent Mosje for a defeat chain). slotIndex 0 or 1.
			// Pass cardId=null to clear the slot.
			setMosjeOnField(playerId, slotIndex, cardId, { mp = 10, level = 1, entryProtected = false, levelUpProtected = false, sideways = false, powerBoost = 0, pendingWelloe = false } = {}) {
				const player = gameState?.players?.[playerId];
				if (!player) return;
				if (cardId == null) { player.activeSlots[slotIndex] = null; renderFromState(gameState); return; }
				const def = MOSJES.find(m => m.id === cardId);
				if (!def) { console.warn('[TESTHOOK] setMosjeOnField: unknown Mosje', cardId); return; }
				const seeded = createMosjeSlot(def, { level, mp });
				// U8 — seeded test Mosjes are UNPROTECTED by default (card tests
				// model an established board); pass entryProtected:true to test U8.
				if (!entryProtected) delete seeded.entryProtected;
				if (levelUpProtected) seeded.levelUpProtected = true; // 63-04: the "levelled up this turn" shield (Protected badge)
				if (sideways) seeded.sideways = true;
				if (pendingWelloe) seeded._pendingWelloe = true; // 61.1: seeds the lingering getemt-while-sideways flag (Perfect Dodge repro)
				if (powerBoost) seeded.powerBoost = powerBoost; // card tests: a Power-40 attacker (Momentum Stabilizer)
				player.activeSlots[slotIndex] = seeded;
				renderFromState(gameState);
			},
			// Put a Piecie in one of a player's 4 Piecie slots (visual checks, card layout tests).
			// Face-up and activated by default; { faceDown: true } sets it face-down. cardId=null clears the slot.
			setPiecieOnField(playerId, slotIndex, cardId, { faceDown = false, stays } = {}) {
				const player = gameState?.players?.[playerId];
				if (!player) return;
				player.piecieSlots[slotIndex] = cardId == null ? null : { cardId, type: 'PIECIE', faceDown, activated: !faceDown, ...(stays ? { stays: true, staysEnd: stays, activatedRound: gameState.turnNumber } : {}) };
				renderFromState(gameState);
			},
			// U8 — strip entry protection from every Mosje on the board. Card tests
			// call this once after seeding so turn-1 attack effects test the CARD,
			// not the protection rule (which has its own spec).
			clearEntryProtection() {
				if (!gameState) return;
				for (const pid of Object.keys(gameState.players)) {
					for (const slot of gameState.players[pid].activeSlots || []) {
						if (slot) delete slot.entryProtected;
					}
				}
				renderFromState(gameState);
			},
			// 59-08: put a defeated Mosje into the Welloe pile (Mosje Reborn / Call of the Welloes card tests).
			injectWelloeMosje(playerId, mosjeId) {
				const player = gameState?.players?.[playerId];
				if (!player) return;
				Object.assign(player, { welloePile: [...(player.welloePile || []), { cardId: mosjeId, name: mosjeId, type: 'MOSJE', source: 'welloe', isDefeated: true }] });
			},
			injectGraveyardCard(playerId, cardId) {
				const player = gameState?.players?.[playerId];
				if (player) { player.graveyard.unshift({ cardId, name: cardId, type: cardTypeFor(cardId), source: 'played' }); }
			},
			// 58-12: put exactly these cards on top of a player's deck (in order), so a card test can fix what Lucky Draw /
			// Calculated Guess / Time Control will see. Cards already in the deck are kept below them.
			setDeckTop(playerId, cardIds) {
				const player = gameState?.players?.[playerId];
				if (!player || !Array.isArray(cardIds)) return;
				player.deck = [...cardIds.map(cardId => ({ cardId, type: cardTypeFor(cardId) })), ...player.deck];
			},
			// Force a board re-render after hooks that mutate state without rendering
			// (e.g. injectGraveyardCard) so UI tests can interact with the result.
			rerender() {
				if (gameState) renderFromState(gameState);
			},
			// Empty a player's draw deck to force the deck-out penalty (D-06) on their next
			// draw phase — used to reproduce the deck-out turn-skip path.
			emptyDeck(playerId) {
				const player = gameState?.players?.[playerId];
				if (player) { player.deck = []; }
			},
			/** Call endTurn engine function directly and return Michelle MP before/after. */
			simulateEndPhaseForMichelle(playerId) {
				if (!gameState) return null;
				const snap = JSON.parse(JSON.stringify(gameState));
				const before = snap.players?.[playerId]?.activeSlots?.[0]?.mp ?? -1;
				const after_state = endTurn(snap);
				const after = after_state.players?.[playerId]?.activeSlots?.[0]?.mp ?? -1;
				return { before, after, delta: after - before, turnNumber: snap.turnNumber };
			},
			// 56-06: put a specific Quest face-up on its stack (testMode only).
			setQuestFaceUp(stackId, questId) {
				const stack = gameState?.questStacks?.[stackId];
				if (!stack) return;
				stack.deck = stack.deck.filter(id => id !== questId);
				stack.discard = stack.discard.filter(id => id !== questId);
				if (stack.faceUp && stack.faceUp !== questId) stack.deck.unshift(stack.faceUp);
				stack.faceUp = questId;
				stack.tokens = 0;
				renderFromState(gameState);
			},
			// 56-06: the next Quest dice come from this list (6 = max); falls back to Math.random once empty.
			// 58-03: scripted d6 results for Mosje abilities / triggers (engine test dice queue).
			setNextAbilityDice(values) { pushTestDice(Array.isArray(values) ? values : []); },
			// 58-11: run ONE turn boundary for a player (kind 'start' = startTurn, 'end' = endTurn) with no bot steps,
			// then give the turn back to player_1. Lets a card test fire start/end-of-turn triggers on the real engine.
			runTurnBoundary(kind, playerId = localPlayerId) {
				if (!gameState) return;
				gameState.activePlayerId = playerId;
				if (kind === 'start') {
					gameState = settleBotMosjePauses(startTurn(gameState));
				} else {
					gameState = endTurn(gameState);
				}
				if (gameState.status !== 'FINISHED') gameState.activePlayerId = localPlayerId;
				renderFromState(gameState);
				settleLocalMosjePauses();
			},
			setNextDice(values) { nextDice = Array.isArray(values) ? [...values] : []; },
			// Phase 57 (U6): the bot attacks through the real playBotSteps path, so the human reaction window is shown.
			botAttack(attackerSlotIndex = 0, targetSlotIndex = 0) {
				gameState.activePlayerId = 'player_2';
				const res = attackMosje(gameState, 'player_2', { attackerSlotIndex, targetPlayerId: localPlayerId, targetSlotIndex });
				if (!res.ok) return res.error;
				playBotSteps([{ state: res.state, label: 'attacks (test)' }], 'Bot', 0, 0, () => {});
				return 'ok';
			},
			// 58-11: the bot places a Piecie from hand (engine playPiecie), so "opponent plays a card" triggers
			// (FPS West's Tactical Analysis) can be proven without the bot's own turn logic.
			botPlayPiecie(cardId) {
				const def = PIECIES.find(p => p.id === cardId);
				if (!gameState || !def) return 'unknown piecie';
				gameState.players.player_2.hand.push({ cardId, type: 'PIECIE' });
				gameState.activePlayerId = 'player_2';
				const res = playPiecie(gameState, 'player_2', { cardId, type: 'PIECIE' }, def);
				if (res.success) gameState = res.state;
				gameState.activePlayerId = localPlayerId;
				renderFromState(gameState);
				return res.success ? 'ok' : res.error;
			},
			// 60-03: the bot ACTIVATES a ready Piecie on its field (targets = state._pendingTargets, e.g. { opp_slot_index: 0 }),
			// so the human reaction windows (Jensen!, Counter Strikka, Jammertje, Gevalletje ...) open on the real path.
			botActivatePiecie(cardId, targets = {}) {
				const def = PIECIES.find(p => p.id === cardId);
				if (!gameState || !def) return 'unknown piecie';
				gameState.players.player_2.piecieSlots[0] = { cardId, type: 'PIECIE', faceDown: true, activated: false, canActivateOnTurn: 0 };
				gameState.activePlayerId = 'player_2';
				gameState._pendingTargets = { ...targets };
				gameState._testNoBotResume = true;
				const res = activatePiecie(gameState, 'player_2', 0);
				if (!res.success) { gameState.activePlayerId = localPlayerId; return res.error; }
				playBotSteps([{ state: res.state, label: `activates ${def.name} (test)` }], 'Bot', 0, 0, () => settleLocalMosjePauses()); // a Piecie that pauses for the human (Those Eyelashes) prompts them
				return 'ok';
			},
			// 60-07: the bot uses a Mosje ability on its field (targets = state._pendingTargets), so hidden-info reveals to the
			// BOT (Ronald's Strategic Insight) can be proven: the human must see nothing of their own hand being revealed.
			botUseAbility(mosjeId, targets = {}) {
				if (!gameState) return 'no game';
				gameState.activePlayerId = 'player_2';
				gameState._pendingTargets = { ...targets };
				const res = useMosjeAbility(gameState, 'player_2', mosjeId);
				gameState.activePlayerId = localPlayerId;
				if (!res.success) return res.error;
				gameState = res.state;
				gameState.activePlayerId = localPlayerId;
				renderFromState(gameState);
				return 'ok';
			},
			// 60-01: the bot plays a Snelle from hand (reaction windows open for the human), or attempts a Quest, so the
			// reaction Snelle (Je Weet Niet, Jammertje ...) can be proven without the bot's own turn logic.
			botPlaySnelle(cardId) {
				const def = SNELLE_PIECIES.find(s => s.id === cardId);
				if (!gameState || !def) return 'unknown snelle';
				gameState.players.player_2.hand.push({ cardId, type: 'SNELLE_PIECIE' });
				const res = playSnellie(gameState, 'player_2', { cardId, type: 'SNELLE_PIECIE' }, def);
				if (!res.success) return res.error;
				playBotSteps([{ state: res.state, label: `plays ${def.name} (test)` }], 'Bot', 0, 0, () => {});
				return 'ok';
			},
			botQuest(slotIndex = 0, stackId) {
				if (!gameState) return 'no game';
				gameState.activePlayerId = 'player_2';
				const roll = rollQuestAttempt(gameState, 'player_2', { slotIndex, stackId });
				if (!roll.ok) return roll.error;
				let next = roll.state;
				if (!roll.reactionPending) {
					const done = resolveQuestAttempt(roll.state, roll.pending, chooseQuestChoices(roll.state, 'player_2', roll.pending));
					if (!done.ok) return done.error;
					next = done.state;
				}
				playBotSteps([{ state: next, label: 'attempts a Quest (test)' }], 'Bot', 0, 0, () => {});
				return 'ok';
			},
			getGameState() { return JSON.parse(JSON.stringify(gameState)); },
			// Obby 2.0 (60-04): a Mosje's effective Power (level row + boosts + active Place), read-only.
			getMosjePower(playerId, slotIndex) { return getPower(gameState?.players?.[playerId]?.activeSlots?.[slotIndex], gameState, playerId); },
			getHandSize(playerId) { return gameState?.players?.[playerId]?.hand?.length ?? -1; },
			getGraveyardSize(playerId) { return gameState?.players?.[playerId]?.graveyard?.length ?? -1; },
			// Force a specific Place active without needing to draw/play it — for
			// scenario setup (e.g. Synergy Chamber checkpoint verification).
			setActivePlace(cardId, playedByPlayerId = localPlayerId) {
				if (!gameState) return;
				gameState = setActivePlace(gameState, cardId, playedByPlayerId);
				renderFromState(gameState);
			},
			// Bump the turn counter directly during scenario setup.
			setTurnNumber(n) {
				if (!gameState) return;
				gameState.turnNumber = n;
				renderFromState(gameState);
			},
		};
	}

	function startGame(p1Name, p1Deck, p2Name, p2Deck) {
		const players = [
			{ playerId: 'player_1', name: p1Name, deckId: p1Deck, deckDef: resolveCustomDeckDef(p1Deck) },
			{ playerId: 'player_2', name: p2Name, deckId: p2Deck, deckDef: resolveCustomDeckDef(p2Deck) },
		];
		// T-55-01: the firstPlayer override is only honoured in testMode.
		const setupOptions = urlParams.get('testMode') === 'true'
			? { firstPlayerId: urlParams.get('firstPlayer') || 'player_1' }
			: {};
		gameState = createInitialGameState(players, roomCode, setupOptions);
		gameState = settleBotMosjePauses(startTurn(gameState));
		renderFromState(gameState);
		settleLocalMosjePauses();
		log.add('quest', `${localPlayerName} entered room ${roomCode}.`);
		log.add('gain', `Turn ${gameState.turnNumber} started for ${gameState.players[gameState.activePlayerId].name}.`);
		if ((gameState.openingRolls || []).length) {
			const rollText = gameState.openingRolls.map(r => `${gameState.players[r.playerId].name} rolls ${r.value}`).join(', ');
			log.add('quest', `${rollText} - ${gameState.players[gameState.firstPlayerId].name} goes first.`);
		}
		logR1Placement();
		// Register ongoing remote handler for when opponent acts
		eventBus.on('mp:remote-state', onRemoteState);
		if (isOnline && localPlayerId === 'player_1') syncPush();
	}

	if (localPlayerId === 'player_1') {
		if (isOnline) {
			// Wait for player_2 to join, then start game
			if (turnLabel) turnLabel.textContent = 'Waiting for opponent to join...';
			log.add('quest', `Room code: ${roomCode}`);
			listenToState(roomCode, localPlayerId);
			eventBus.once('mp:player2-joined', p2Data => {
				console.log('[UI] mp:player2-joined received, p2Data:', p2Data);
				log.add('gain', `${p2Data.name} joined the room!`);
				const user = getCurrentUser();
				const uid = user && !user.isAnonymous ? user.uid : null;
				registerDisconnectLoss(roomCode, uid, p2Data.uid || null);
				try {
					startGame(localPlayerName, localDeckId, p2Data.name, p2Data.deckId || pickOpponentDeck(localDeckId));
				} catch (err) {
					console.error('[UI] startGame failed:', err);
					if (turnLabel) turnLabel.textContent = `Error starting game: ${err.message}`;
				}
			});
		} else {
			// Bot vs Bot, Offline vs Bot, or LOCAL dev mode
			if (isBotVsBot) {
				// Optional deck1/deck2 URL params let a simulation control the matchup.
				// Falls back to random decks when not provided.
				const paramDeck1 = urlParams.get('deck1');
				const paramDeck2 = urlParams.get('deck2');
				const deck1 = paramDeck1 || pickBotDeck(getPlayerFacingDecks()).id;
				const deck2 = paramDeck2 || pickOpponentDeck(deck1);
				startGame('Bot A', deck1, 'Bot B', deck2);
				log.add('quest', 'Bot vs Bot mode — no human input needed. Sit back and watch!');
				runBotVsBotLoop();
			} else if (isOffline) {
				const offlineData = readOfflineData();
				const humanName  = offlineData.name    || localPlayerName || 'Player';
				const humanDeck  = offlineData.deckId  || localDeckId;
				const botDeck    = offlineData.botDeckId || pickOpponentDeck(humanDeck);
				startGame(humanName, humanDeck, 'Bot', botDeck);
				log.add('quest', 'Offline mode — playing vs Bot. No Firebase used.');
			} else {
				startGame(localPlayerName, localDeckId, opponentName, opponentDeckId);
			}
		}
	} else {
		// player_2: wait for player_1 to push initial state via onSnapshot
		if (turnLabel) turnLabel.textContent = 'Connecting to game...';
		log.add('quest', `Joining room ${roomCode} as ${localPlayerName}...`);
		listenToState(roomCode, localPlayerId);
		// First remote state initialises the game for player_2, then ongoing handler takes over
		eventBus.once('mp:remote-state', initialState => {
			console.log('[UI] mp:remote-state received (initial) for player_2');
			const user = getCurrentUser();
			const uid = user && !user.isAnonymous ? user.uid : null;
			registerDisconnectLoss(roomCode, uid, opponentUid);
			try {
				const { state: sanitizedState, changed } = sanitizeQuestCardsInPlayerZones(initialState);
				gameState = sanitizedState;
				renderFromState(gameState);
				if (changed && isOnline && localPlayerId === 'player_1') {
					syncPush();
				}
				log.add('gain', `Game started! Waiting for opponent's first turn.`);
				eventBus.on('mp:remote-state', onRemoteState);
			} catch (err) {
				console.error('[UI] renderFromState failed (player_2 init):', err);
				if (turnLabel) turnLabel.textContent = `Error loading game: ${err.message}`;
			}
		});
		// For LOCAL testing as player_2, fall back to starting immediately
		if (!isOnline) {
			startGame(opponentName, opponentDeckId, localPlayerName, localDeckId);
		}
	}

	// When opponent disconnects mid-game, auto-end the game and award a win
	if (isOnline) {
		eventBus.once('mp:opponent-abandoned', () => {
			if (!gameState || gameState.status === 'FINISHED') return;
			handleGameOver({
				...gameState,
				status: 'FINISHED',
				winnerId: localPlayerId,
				winReason: 'opponent disconnected',
			});
		});
	}

	// Stop Firestore listener on page unload
	window.addEventListener('beforeunload', stopListening);

	document.getElementById('btn-end-turn')?.addEventListener('click', () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'Wait for your opponent to end their turn.');
			return;
		}
		const beforeTurnChange = snapshotForAnimation();
		const previousPlayerName = gameState.players[gameState.activePlayerId].name;
		gameState = endTurn(gameState);
		if (gameState.status !== 'FINISHED') {
			gameState = settleBotMosjePauses(startTurn(gameState));
		}

		renderAndAnimate(beforeTurnChange, { actionLabel: 'turn-change' });
		settleLocalMosjePauses();
		syncPush();
		log.add('quest', `${previousPlayerName} ended their turn.`);
		showTurnTransition({ playerName: previousPlayerName, type: 'end' });

		if (gameState.status === 'FINISHED') {
			handleGameOver(gameState);
			return;
		}

		const activeName = gameState.players[gameState.activePlayerId].name;
		log.add('gain', `Now active: ${activeName}. Turn ${gameState.turnNumber}.`);
		logR1Placement();
		showTurnTransition({ playerName: activeName, turnNumber: gameState.turnNumber, type: 'start' });

		// Bot vs Bot mode: current player was already advanced by endTurn/startTurn above — kick off next bot
		if (isBotVsBot && gameState.status !== 'FINISHED') {
			runBotVsBotLoop();
		}

		// Offline bot turn: animate each bot action with log entries at 400ms per step.
		// (If startTurn above skipped the bot via deck-out, activePlayerId is the human
		// again and this is a no-op — the human simply keeps control.)
		if (isOffline && gameState.activePlayerId === 'player_2' && gameState.status !== 'FINISHED') {
			runOfflineBotTurnThenHuman();
		}
	});

	// 56-06: Attack / Quest buttons — the flows own all picking; main.js only assigns state, logs, syncs and renders.
	async function runMosjeAction(flow, actionLabel, presets = {}) {
		if (!gameState || gameState.status === 'FINISHED') return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'You can only act on your own turn.');
			return;
		}
		const before = snapshotForAnimation();
		const rng = () => (nextDice.length ? (nextDice.shift() - 1) / 6 + 0.001 : Math.random());
		const out = await flow({ state: gameState, playerId: localPlayerId, modal, rng, settle: st => settleReactions(st, reactionCtx()), ...presets });
		if (out.state === gameState) return;
		gameState = out.state;
		out.log.forEach(line => log.add('quest', line));
		syncPush();
		renderAndAnimate(before, { actionLabel });
	}
	document.getElementById('btn-attack')?.addEventListener('click', () => runMosjeAction(runAttackFlow, 'attack'));
	document.getElementById('btn-quest')?.addEventListener('click', () => runMosjeAction(runQuestFlow, 'quest'));

	// Senor West's optional look at a Quest stack (once per turn): the Quest tray chip offers it before the Quest tiles light up.
	async function offerQuestPeek() {
		if (!gameState || gameState.status === 'FINISHED' || gameState.activePlayerId !== localPlayerId) return;
		const peeked = await offerWestPeek({ state: gameState, playerId: localPlayerId, modal });
		if (peeked === gameState) return;
		gameState = peeked;
		syncPush();
	}

	// The status strip: an action mode of the board controller (choose-target / preview / choose-quest) wins over the passive
	// messages; Confirm and Cancel in the strip call the controller.
	function updateStatusStrip(state = gameState) {
		if (!state) return;
		renderStatusStrip(document.getElementById('status-strip'), pickStatusMessage(state, localPlayerId, boardController.getStripMode()), {
			onConfirm: () => boardController.confirm(),
			onCancel: () => boardController.cancel(),
		});
	}

	// Deck-out recycle notice: when the engine stamps _deckOutEvent (D-06 reshuffle), show a
	// banner + battle-log line + discard-pile pulse. Runs on both the local action path and
	// onRemoteState (via renderFromState), so BOTH players see it; de-duped per event.
	function maybeAnnounceDeckOut(state) {
		const evt = state?._deckOutEvent;
		if (!evt) return;
		const id = `${evt.playerId}#${evt.turnNumber}`;
		if (id === _lastDeckOutShownId) return;   // already shown on THIS client
		_lastDeckOutShownId = id;

		const name = state.players?.[evt.playerId]?.name || 'A player';
		log.add('quest', `♻ ${name}'s deck ran out — discard reshuffled into deck. Cooldown turn: only face-down Piecies.`);
		showDeckOutBanner({
			playerName: name,
			onPileHighlight: () => pulseDiscardPile(evt.playerId, localPlayerId),
		});
	}

	function renderFromState(state) {
		const uiState = toBoardViewModel(state, localPlayerId);

		const isLocalTurn = state.activePlayerId === localPlayerId;
		const gameOver = state.status === 'FINISHED';

		// Regular cards only on local turn; Snelle Piecies always available
		// Pass onPlay always so Snelle Piecies show their interrupt button
		const onPlay = !gameOver ? handlePlayCard : null;
		renderHand(
			handRoot,
			toHandViewModel(state.players[localPlayerId].hand),
			onPlay,
			isLocalTurn,
			state.activeQuest,
			localPlayerId,
			state
		);

		const onUseAbility = !gameOver ? handleUseAbility : null; // the board disables buttons that are not usable now
		const onActivatePiecie = (isLocalTurn && !gameOver) ? handleActivatePiecie : null;
		const onOpenDiscard = handleOpenDiscard;
		const onPlayFromHand = (isLocalTurn && !gameOver) ? handlePlayCard : null;
		renderBoard(boardRoot, uiState, onUseAbility, null, onActivatePiecie, onOpenDiscard, onPlayFromHand, { endTurnButton, onTileTap: boardController.onTileTap, onQuestTap: boardController.onQuestTap });
		boardController.afterRender(); // redraw the selection / tray / target marks on the fresh tiles
		showNewReveals(state, localPlayerId, modal, CARD_LOOKUP, revealSeen); // reveal modal: local viewer's entries only
		if (state._lastPlaceEffect?.placeName) {
			showPlaceEffectBanner(state._lastPlaceEffect.placeName, state._lastPlaceEffect.description, state._lastPlaceEffect.phase);
			delete state._lastPlaceEffect;
		}
		// Board is rendered (discard containers now exist) — announce any deck-out recycle.
		maybeAnnounceDeckOut(state);

		const actionBtnsEnabled = isLocalTurn && !gameOver && !isCooldownBlocked(state, localPlayerId);

		const phaseLabel = gameOver
			? 'Game Over'
			: isLocalTurn
				? 'MAIN Phase'
				: `${uiState.activePlayerName}'s Turn`;

		if (turnLabel) {
			turnLabel.textContent = `${isLocalTurn ? 'You' : uiState.activePlayerName} • ${phaseLabel}`;
		}

		// Toggle the Place active visual indicator: the felt wash takes the Place's colour (D-10). The tint is left in place
		// when the Place goes, so the 0.6 s fade-out keeps its colour.
		const pageBody = document.querySelector('.page--game');
		if (pageBody) {
			if (state.activePlace) {
				pageBody.style.setProperty('--place-tint', getPlaceTint(uiState.activePlace));
				pageBody.classList.add('place-active');
			} else {
				pageBody.classList.remove('place-active');
			}
		}

		// Status strip (D-19): one message by priority; the board controller's action mode (D-04) comes first.
		updateStatusStrip(state);

		const btnAttack = document.getElementById('btn-attack');
		const btnQuest = document.getElementById('btn-quest');
		const btnEndTurn = document.getElementById('btn-end-turn');
		if (btnAttack) btnAttack.disabled = !actionBtnsEnabled;
		if (btnQuest) btnQuest.disabled = !actionBtnsEnabled;
		if (btnEndTurn) btnEndTurn.disabled = !isLocalTurn || gameOver;
	}

	// Redbull / Double Trigger: the engine allows a second paid use (slot.extraAbilityUses), so a use is just one activation.
	async function handleUseAbility(mosjeId) {
		await runAbilityActivation(mosjeId);
	}

	async function runAbilityActivation(mosjeId) {
		if (!gameState || gameState.status === 'FINISHED') return;
		const before = snapshotForAnimation();
		const slotIndex = gameState.players[localPlayerId]?.activeSlots
			?.findIndex(slot => slot && slot.cardId === mosjeId && !slot.isDefeated);
		const out = await runMosjeAbilityFlow({
			state: gameState, playerId: localPlayerId, mosjeId, modal,
			settle: st => settleReactions(st, reactionCtx()),
			settlePauses: st => settlePendingChoice({ state: st, localPlayerId, modal, humanIds: isOffline ? [localPlayerId] : Object.keys(st.players) }),
		});
		if (out.cancelled) return;
		if (!out.ok) {
			modal.showInfo('Cannot Use Ability', out.error || 'This ability cannot be used right now.');
			return;
		}
		if (slotIndex >= 0) animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex, cardId: mosjeId });
		gameState = out.state;
		log.add('gain', `Used ability: ${out.name}.`);
		const abilityDef = CARD_LOOKUP[mosjeId];
		if (abilityDef?.abilityDescription) log.add('info', `Effect: ${abilityDef.abilityDescription}`);
		logStateOutcome(log, before, gameState, localPlayerId, `${out.name} ability`);
		syncPush();
		if (gameState.status === 'FINISHED') handleGameOver(gameState);
		renderAndAnimate(before, { actionLabel: 'mosje-ability' });
	}

	async function handleActivatePiecie(slotIndex) {
		if (!gameState || gameState.status === 'FINISHED') return;
		const beforeActivate = snapshotForAnimation();

		const slots = gameState.players[localPlayerId]?.piecieSlots;
		console.log(`[UI] handleActivatePiecie: slotIndex=${slotIndex}`);
		console.log(`[UI] piecieSlots at activation:`, Array.isArray(slots)
			? slots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | ')
			: String(slots));
		const piecieSlot = slots?.[slotIndex];
		const piecieCardDef = piecieSlot?.cardId ? CARD_LOOKUP[piecieSlot.cardId] : null;


		let stateForActivation = gameState;
		if (PIECIE_TARGETS[piecieCardDef?.id]?.length) {
			// One generic picker over the Piecie target table (own / opp / any + eligibility rule).
			const specs = piecieTargetOptions(gameState, localPlayerId, piecieCardDef.id);
			for (const spec of specs) {
				if (spec.options.length < 2) continue; // 0 = effect fizzles, 1 = the only choice is taken automatically
				const picked = await modal.showOptionSelect({
					title: piecieCardDef.name,
					prompt: spec.who === 'opp' ? 'Choose an opponent Mosje:' : spec.who === 'own' ? 'Choose which of your Mosjes:' : 'Choose a Mosje:',
					options: spec.options.map((o, i) => ({
						id: String(i),
						label: spec.who === 'any' ? `${o.label} (${o.playerId === localPlayerId ? 'yours' : 'opponent'})` : o.label,
						metaLabel: `${gameState.players[o.playerId].activeSlots[o.slotIndex].mp} MP`,
					})),
					allowCancel: true,
				});
				if (picked === null || picked === undefined) return;
				const chosen = spec.options[Number(picked)];
				if (stateForActivation === gameState) stateForActivation = JSON.parse(JSON.stringify(gameState));
				stateForActivation._pendingTargets = {
					...(stateForActivation._pendingTargets || {}),
					[spec.key]: spec.key === 'any_target' ? { playerId: chosen.playerId, slotIndex: chosen.slotIndex } : chosen.slotIndex,
				};
			}
		}

		const { state: newState, success, error, cardDef, negated } = activatePiecie(stateForActivation, localPlayerId, slotIndex);
		if (!success) {
			modal.showInfo('Cannot Activate', error || 'That Piecie cannot be activated right now.');
			return;
		}
		animateFieldActivation({
			zone: 'piecie',
			playerId: localPlayerId,
			slotIndex,
			cardId: piecieCardDef?.id || piecieSlot?.cardId,
		});
		gameState = newState.pendingReaction ? await settleReactions(newState, reactionCtx()) : newState;


		// ── STUB-15: MP Adjuster — choose exact MP value (temporary until next turn) ──
		if (gameState._mpAdjusterPending) {
			const { playerId: mpPlayerId, slotIndex: mpSlotIndex } = gameState._mpAdjusterPending;
			const chosen = await modal.showOptionSelect({
				title: 'MP Adjuster',
				prompt: 'Choose the MP value to set (reverts at start of your next turn).',
				options: [
					{ id: '20', label: '20 MP' },
					{ id: '40', label: '40 MP' },
					{ id: '60', label: '60 MP' },
					{ id: '80', label: '80 MP' },
					{ id: '95', label: '95 MP' },
				],
				allowCancel: false,
			});
			const mpValue = Number(chosen);
			const slot = gameState.players[mpPlayerId].activeSlots[mpSlotIndex];
			const delta = mpValue - slot.mp;
			slot._mpAdjustDelta = delta;
			slot.mp = mpValue; // mp-direct-ok: MP Adjuster absolute set (on-grid options, < 100), reverted next turn start
			delete gameState._mpAdjusterPending;
			console.log('[UI] MP Adjuster: set to', mpValue, 'MP (delta', delta, ', reverts next turn start)');
		}

		const activatedName = cardDef?.name || 'Piecie';
		if (negated) {
			log.add('loss', `Activated ${activatedName}, but it was negated.`);
		} else {
			log.add('gain', `Activated ${activatedName}.`);
			if (cardDef?.description) log.add('info', cardDef.description);
		}
		logStateOutcome(log, beforeActivate, gameState, localPlayerId, `${activatedName} activation`);
		syncPush();
		renderAndAnimate(beforeActivate, { actionLabel: 'activate-piecie' });
		// A chain Mosje (Jisca, DDR Chris, Cless the Teacher) may have paused for the owner's pick: ask for it now.
		settleLocalMosjePauses();
	}

	function handleOpenDiscard(playerId, isOwned) {
		try {
			console.log('[UI] handleOpenDiscard called for player:', playerId, 'isOwned:', isOwned);
			console.log('[UI] gameState exists?', !!gameState, 'gameState.players?', !!gameState?.players);
			if (!gameState) {
				console.error('[UI] No gameState available');
				return;
			}
			console.log('[UI] About to find player in gameState.players');
			console.log('[UI] gameState.players is array?', Array.isArray(gameState.players), 'length:', gameState.players?.length);
			// gameState.players is an object, not an array
			const player = gameState.players[playerId];
			console.log('[UI] Found player?', !!player, 'player:', player?.name || playerId);
			if (!player) {
				console.error('[UI] Player not found:', playerId, 'available players:', gameState.players.map(p => p.id));
				return;
			}
			console.log('[UI] Opening graveyard modal for player:', player.name || playerId, 'with', player.graveyard?.length || 0, 'cards');
			console.log('[UI] modal exists?', !!modal, 'modal.showGraveyardModal?', !!modal?.showGraveyardModal);
			modal.showGraveyardModal(player, isOwned);
			console.log('[UI] Modal should be open now');
		} catch (error) {
			console.error('[UI] Error in handleOpenDiscard:', error.message, error);
		}
	}

	async function handlePlayCard(cardId, cardType) {
		if (!gameState || gameState.status === 'FINISHED') return;

		// Enforce turn ownership — Snelle Piecies always allowed
		if (!canPlayerActNow(gameState, localPlayerId, cardType)) {
			modal.showInfo('Not Your Turn', 'You can only play regular cards on your own turn.');
			return;
		}

		// Some cards target one of your own active Mosjes (e.g. Kannetje Melk, Jensen)
		async function resolveOwnMosjeTarget(promptText) {
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);
			if (ownTargets.length === 0) {
				modal.showInfo('No Active Mosje', 'You need at least one active Mosje for this card.');
				return null;
			}
			const selectedId = await modal.showTargetSelector(ownTargets, promptText);
			if (!selectedId) return null;

			const selectedParts = selectedId.split('_slot_');
			const selectedSlotIndex = parseInt(selectedParts[1], 10);
			if (Number.isNaN(selectedSlotIndex)) return null;

			const stateWithTargets = JSON.parse(JSON.stringify(gameState));
			stateWithTargets._pendingTargets = {
				...(stateWithTargets._pendingTargets || {}),
				own_slot_index: selectedSlotIndex,
			};
			return stateWithTargets;
		}

		const cardRef = gameState.players[localPlayerId].hand.find(c => c.cardId === cardId);
		const cardDef = CARD_LOOKUP[cardId];
		if (!cardRef || !cardDef) {
			console.warn('[UI] Unknown card played:', cardId);
			return;
		}

		if (cardType === 'PIECIE') {
			const beforePlay = snapshotForAnimation();
			const { state: newState, success, error } = playPiecie(gameState, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Placed ${cardDef.name} face-down.`);
			log.add('info', 'It can be activated from the field on a later turn.');
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} placement`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				handleGameOver(gameState);
			}
			renderAndAnimate(beforePlay, { actionLabel: 'play-piecie', placedCardId: cardDef.id });
			return;
		}

		if (cardType === 'MOSJE') {
			const beforePlay = snapshotForAnimation();
			const { state: newState, success, error } = playMosje(gameState, localPlayerId, cardRef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That Mosje cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played Mosje: ${cardDef.name}.`);
			if (cardDef.abilityDescription) log.add('info', `Ability: ${cardDef.abilityDescription}`);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} deployment`);
			syncPush();
			renderAndAnimate(beforePlay, { actionLabel: 'play-mosje', placedCardId: cardDef.id });
			return;
		}

		if (cardType === 'SNELLE_PIECIE') {
			const beforePlay = snapshotForAnimation();
			let snelleStateForPlay = gameState;
			let resultLog = null; // set inside effect-specific branches to log outcome details
			if (cardDef.effectId === 'effect_snelle_jensen') {
				const ownTargets = getPlayerMosjes(gameState, localPlayerId);
				snelleStateForPlay = JSON.parse(JSON.stringify(gameState));
				if (!snelleStateForPlay._pendingTargets) snelleStateForPlay._pendingTargets = {};
				if (ownTargets.length > 1) {
					const selectedId = await modal.showTargetSelector(ownTargets, 'Choose your Mosje to receive Jensen MP:');
					if (!selectedId) return;
					const parts = selectedId.split('_slot_');
					const idx = parseInt(parts[1], 10);
					if (!Number.isNaN(idx)) snelleStateForPlay._pendingTargets.jensen_slot_index = idx;
				} else if (ownTargets.length === 1) {
					snelleStateForPlay._pendingTargets.jensen_slot_index = ownTargets[0].slotIndex;
				}
			} else if (cardDef.effectId === 'effect_snelle_lucky_coin') {
				// BUG-04 fix: check slot availability BEFORE flipping the coin.
				// playSnellie() also checks this, but the flip must not happen first.
				const filledSlots = gameState.players[localPlayerId].piecieSlots.filter(s => s !== null).length;
				const activePlaceCount = gameState.activePlace ? 1 : 0;
				if (filledSlots + activePlaceCount >= 4) {
					modal.showInfo('Cannot Play', 'Cannot play Lucky Coin — all Piecie/Place slots are full.');
					return;
				}
				const isHeads = Math.random() < 0.5;
				snelleStateForPlay = JSON.parse(JSON.stringify(gameState));
				if (!snelleStateForPlay._pendingTargets) snelleStateForPlay._pendingTargets = {};
				if (isHeads) {
					snelleStateForPlay._pendingTargets.lucky_coin_result = 'heads';
					resultLog = { type: 'info', msg: 'Lucky Coin: Heads — reroll token granted!' };
				} else {
					const ownTargets = getPlayerMosjes(gameState, localPlayerId);
					if (ownTargets.length > 0) {
						const selectedId = await modal.showTargetSelector(ownTargets, 'Lucky Coin — Tails! Choose your Mosje to take 10 MP damage:');
						if (!selectedId) return;
						const slotIndex = parseInt(selectedId.split('_slot_')[1], 10);
						snelleStateForPlay._pendingTargets.lucky_coin_result = 'tails';
						if (!Number.isNaN(slotIndex)) snelleStateForPlay._pendingTargets.lucky_coin_tails_slot = slotIndex;
					} else {
						snelleStateForPlay._pendingTargets.lucky_coin_result = 'tails';
					}
					resultLog = { type: 'loss', msg: 'Lucky Coin: Tails — −10 MP to your Mosje.' };
				}
			}

			const { state: newState, success, error } = playSnellie(snelleStateForPlay, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = (newState.pendingReaction || newState.pendingChoice?.hook === 'snelle') ? await settleReactions(newState, reactionCtx()) : newState;
			log.add('gain', `Played ${cardDef.name} (instant).`);
			if (resultLog) log.add(resultLog.type, resultLog.msg);
			if (cardDef.description) log.add('info', `Effect: ${cardDef.description}`);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} instant activation`);
			syncPush();
			renderAndAnimate(beforePlay, {
				actionLabel: 'play-snelle',
				placedCardId: cardDef.id,
				extraEffects: cardDef.id === 'snelle_lucky_coin' && resultLog
					? [{ text: resultLog.type === 'loss' ? '🪙 Tails' : '🪙 Heads', kind: resultLog.type === 'loss' ? 'loss' : 'info', sub: resultLog.msg.replace('Lucky Coin: ', '') }]
					: [],
			});
			showInstantEffect('snelle');   // red burst — instant card
			return;
		}

		if (cardType === 'QUEST') {
			// Obby 2.0: Quests live in the 3 stacks on the table; they are never played from hand.
			modal.showInfo('Cannot Play', 'Quests are attempted from the Quest stacks, not played from hand.');
			return;
		}

		if (cardType === 'PLACE') {
			// Tesla activation guard (DECK-12): Coert must be active to play Tesla.
			if (cardDef.id === 'place_tesla') {
				const coertOnField = gameState.players[localPlayerId].activeSlots.some(
					s => s && !s.isDefeated && String(s.cardId).includes('coert')
				);
				if (!coertOnField) {
					modal.showInfo('Cannot Activate', 'Coert must be active to drive the Tesla.');
					return;
				}
			}
			const beforePlay = snapshotForAnimation();
			const { state: newState, success, error } = playPlace(gameState, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played Place: ${cardDef.name}.`);
			if (cardDef.description) log.add('info', cardDef.description);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} placement`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				handleGameOver(gameState);
			}
			renderAndAnimate(beforePlay, { actionLabel: 'play-place', placedCardId: cardDef.id });
			// A Place works at once when played from hand (E24); 'play-place' is an activation label.
		}
	}
}

function readLobbyData() {
	try {
		const raw = sessionStorage.getItem('mosjes:lobby');
		if (!raw) return {};
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

function readOfflineData() {
	try {
		return JSON.parse(sessionStorage.getItem('mosjes:offline') || '{}');
	} catch {
		return {};
	}
}

function readCustomDeckFromSession(deckId) {
	try {
		const raw = sessionStorage.getItem(`mosjes:customDeck:${deckId}`);
		if (!raw) return undefined;
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

function buildCardLookup() {
	const allCards = [...MOSJES, ...PIECIES, ...SNELLE_PIECIES, ...PLACES, ...QUESTS];
	const map = {};
	for (const card of allCards) map[card.id] = card;
	return map;
}

function toBoardViewModel(gameState, localPlayerId) {
	const localPlayer = gameState.players[localPlayerId];
	const opponentId = Object.keys(gameState.players).find(id => id !== localPlayerId);
	const opponent = gameState.players[opponentId];
	const isLocalTurn = gameState.activePlayerId === localPlayerId;

	const activePlaceCard = gameState.activePlace ? PLACES.find(p => p.id === gameState.activePlace) : null;

	return {
		activePlayerName: gameState.players[gameState.activePlayerId].name,
		turnPhase: 'DRAW',
		activePlaceName: activePlaceCard?.name || 'None',
		activePlace: activePlaceCard,
		activePlacePlayedBy: gameState.activePlacePlayedBy || null,
		activeQuest: gameState.activeQuest ?? null,
		questStacks: gameState.questStacks ?? null,
		activePlaceTurns: gameState.activePlaceTurnsActive || 0,
		gameState,
		myPlayerId: localPlayerId,
		players: {
			top: {
				id: opponentId,
				name: opponent.name,
				energy: opponent.energy,
				mosjes: toMosjeTileCards(gameState, opponentId),
				activeModifiers: buildActiveModifiers(gameState, opponentId, false),
				piecies: toPiecieCards(opponent.piecieSlots, {
					ownerId: opponentId,
					localPlayerId,
					turnNumber: gameState.turnNumber,
					isLocalTurn,
					viewerOwns: false,
				}),
				deck: opponent.deck || [],
				graveyard: opponent.graveyard || [],
				welloePile: opponent.welloePile || [],
			},
			bottom: {
				id: localPlayerId,
				name: localPlayer.name,
				energy: localPlayer.energy,
				mosjes: toMosjeTileCards(gameState, localPlayerId),
				activeModifiers: buildActiveModifiers(gameState, localPlayerId, true),
				piecies: toPiecieCards(localPlayer.piecieSlots, {
					ownerId: localPlayerId,
					localPlayerId,
					turnNumber: gameState.turnNumber,
					isLocalTurn,
					viewerOwns: true,
				}),
				deck: localPlayer.deck || [],
				graveyard: localPlayer.graveyard || [],
				welloePile: localPlayer.welloePile || [],
			},
		},
	};
}

function buildActiveModifiers(gameState, playerId, isLocalPlayer = false) {
	const player = gameState.players[playerId];
	const pills = [];

	// Quest dice bonuses — only show on the local player's zone (they're the ones questing)
	if (isLocalPlayer) {
		const questBonus = (player?.questExtraDice || 0);
		if (questBonus > 0) pills.push({ label: `+${questBonus} Quest Roll`, color: 'gold' });
	}


	// Laat me chillen! and Snelle Laat me chillen! store MP_LOSS_REDUCTION in the active Mosje's statusEffects
	if (player) {
		for (const slot of player.activeSlots) {
			if (!slot || slot.isDefeated) continue;
			const se = (slot.statusEffects || []).find(e => e.type === 'MP_LOSS_REDUCTION' && (e.turnsLeft ?? 1) > 0);
			if (se) { pills.push({ label: `🛡 -${se.value} Damage`, color: 'teal' }); break; }
		}
	}

	// Synergy bonuses currently live for this player (real partner present, or
	// waived via Synergy Chamber) — shown proactively so a synergy's effect is
	// visible before it's exercised, not just inferable from an MP delta after.
	for (const bonus of getActivePartnerSynergyBonuses(gameState, playerId)) {
		pills.push({ label: `+${bonus.bonus} ${bonus.category} Quest (Synergy)`, color: 'gold' });
	}

	return pills;
}

function toPiecieCards(piecieSlots, options = {}) {
	if (!Array.isArray(piecieSlots)) {
		console.log('[UI] toPiecieCards: piecieSlots is not an array:', typeof piecieSlots, JSON.stringify(piecieSlots));
		return [];
	}
	const {
		ownerId = null,
		localPlayerId = null,
		turnNumber = 1,
		isLocalTurn = false,
		viewerOwns = false,
	} = options;
	const canActivateForViewer = viewerOwns && ownerId === localPlayerId && isLocalTurn;

	const result = piecieSlots
		.map((slot, slotIndex) => ({ slot, slotIndex }))
		.filter(({ slot }) => slot !== null)
		.map(({ slot, slotIndex }) => {
			const isPlacedFaceDown = slot.faceDown !== false;
			const canActivateNow = canActivateForViewer && isPiecieReady(slot, turnNumber);

			if (!viewerOwns && isPlacedFaceDown) {
				return {
					cardId: slot.cardId,
					name: 'Face-down Piecie',
					type: 'PIECIE',
					description: '',
					faceDown: true,
					slotIndex,
					canActivate: false,
				};
			}

			const def = CARD_LOOKUP[slot.cardId] || { id: slot.cardId, name: slot.cardId, type: 'PIECIE' };
			return {
				cardId: slot.cardId,
				name: def.name,
				type: def.type || 'PIECIE',
				subtype: def.subtype,
				description: def.description || '',
				faceDown: viewerOwns ? false : slot.faceDown === true,
				slotIndex,
				canActivate: canActivateNow,
				linkedMosjeCardId: slot.linkedMosjeCardId || null,
			};
		});
	console.log('[UI] toPiecieCards result (owner=%s):', ownerId,
		result.map(c => `[${c.slotIndex}] ${c.cardId} (${c.type}) canActivate=${c.canActivate}`).join(' | ') || '(empty)');
	return result;
}

function toHandViewModel(hand) {
	return hand.map(cardRef => {
		const def = CARD_LOOKUP[cardRef.cardId];
		if (!def) {
			return {
				name: cardRef.cardId,
				type: cardRef.type || 'UNKNOWN',
				description: 'Unknown card definition',
			};
		}

		return {
			cardId: cardRef.cardId,
			name: def.name,
			type: def.type,
			description: def.description || def.requirementDescription || def.flavourText || '',
			questType: def.questType,
			requiredMosjeId: def.requiredMosjeId,
			difficulty: def.difficulty,
		};
	});
}

function pickOpponentDeck(localDeckId) {
	// True-random duo deck from the player-facing pool (mirror allowed).
	return pickBotDeck(getPlayerFacingDecks()).id;
}

function logStateOutcome(log, beforeState, afterState, actorId, label = 'Action') {
	const lines = summarizeStateOutcome(beforeState, afterState, actorId);
	if (!lines.length) {
		log.add('info', `${label}: no visible stat changes.`);
		return;
	}
	log.add('info', `${label}:`);
	for (const line of lines.slice(0, 6)) {
		// Level-up lines from summarizeStateOutcome contain "level N -> N"
		const isLevelUp = /level \d+ -> \d+/i.test(line);
		log.add(isLevelUp ? 'level' : 'info', `- ${line}`);
	}
}

function summarizeStateOutcome(beforeState, afterState, actorId) {
	if (!beforeState || !afterState) return [];
	const lines = [];

	const beforePlace = beforeState.activePlace || 'None';
	const afterPlace = afterState.activePlace || 'None';
	if (beforePlace !== afterPlace) {
		const beforeName = beforePlace === 'None' ? 'None' : (CARD_LOOKUP[beforePlace]?.name || beforePlace);
		const afterName = afterPlace === 'None' ? 'None' : (CARD_LOOKUP[afterPlace]?.name || afterPlace);
		lines.push(`Place changed: ${beforeName} -> ${afterName}`);
	}

	for (const pid of Object.keys(afterState.players || {})) {
		const beforePlayer = beforeState.players?.[pid];
		const afterPlayer = afterState.players?.[pid];
		if (!afterPlayer) continue;
		const prefix = pid === actorId ? 'You' : (afterPlayer.name || pid);

		for (let i = 0; i < 2; i++) {
			const b = beforePlayer?.activeSlots?.[i] || null;
			const a = afterPlayer?.activeSlots?.[i] || null;
			if (!a && !b) continue;

			if (!b && a) {
				lines.push(`${prefix} fielded ${a.name || a.cardId} (MP ${a.mp ?? 0}).`);
				continue;
			}
			if (b && !a) {
				lines.push(`${prefix} lost ${b.name || b.cardId} from field.`);
				continue;
			}
			if (!a || !b) continue;

			const beforeMp = Number(b.mp || 0);
			const afterMp = Number(a.mp || 0);
			const delta = afterMp - beforeMp;
			if (delta !== 0) {
				const sign = delta > 0 ? '+' : '';
				lines.push(`${prefix} ${a.name || a.cardId}: ${sign}${delta} MP (now ${afterMp}).`);
			}

			if ((b.level || 1) !== (a.level || 1)) {
				const beforeLevel = b.level || 1;
				const afterLevel = a.level || 1;
				lines.push(`${prefix} ${a.name || a.cardId}: level ${beforeLevel} -> ${afterLevel}.`);
			}
			if (!b.isDefeated && a.isDefeated) {
				lines.push(`${prefix} ${a.name || a.cardId} was defeated.`);
			}
		}

		const zones = [
			['hand', 'cards in hand'],
			['deck', 'cards in deck'],
			['discard', 'cards in discard'],
			['welloe', 'cards in welloe'],
		];
		for (const [zoneKey, labelText] of zones) {
			const beforeCount = Array.isArray(beforePlayer?.[zoneKey]) ? beforePlayer[zoneKey].length : 0;
			const afterCount = Array.isArray(afterPlayer?.[zoneKey]) ? afterPlayer[zoneKey].length : 0;
			const zoneDelta = afterCount - beforeCount;
			if (zoneDelta !== 0) {
				const sign = zoneDelta > 0 ? '+' : '';
				lines.push(`${prefix}: ${labelText} ${sign}${zoneDelta} (now ${afterCount}).`);
			}
		}
	}

	return lines;
}

function setVersionLabel() {
	const label = document.getElementById('app-version');
	if (!label) return;
	label.textContent = `Version ${APP_VERSION}`;
}

function sanitizeQuestCardsInPlayerZones(rawState) {
	const state = JSON.parse(JSON.stringify(rawState));
	const generalQuestIds = new Set(
		QUESTS.filter(q => q.questType === 'GENERAL').map(q => q.id)
	);

	let changed = false;
	const movedToSharedDiscard = [];

	for (const player of Object.values(state.players || {})) {
		// Firebase RTDB strips null array values, converting piecieSlots to an object
		// with integer keys. Re-hydrate to a proper 3-element array before any engine
		// function touches it, so no cards are silently lost from the field.
		if (player.piecieSlots && !Array.isArray(player.piecieSlots)) {
			player.piecieSlots = Array.from({ length: PIECIE_SLOT_COUNT }, (_, i) => player.piecieSlots[i] ?? null);
		} else if (!player.piecieSlots) {
			player.piecieSlots = Array(PIECIE_SLOT_COUNT).fill(null);
		}

		for (const zoneName of ['hand', 'deck', 'discard']) {
			const zone = Array.isArray(player[zoneName]) ? player[zoneName] : [];
			const kept = [];

			for (const cardRef of zone) {
				const cardId = cardRef?.cardId;
				const isQuest = cardRef?.type === 'QUEST';
				if (isQuest && cardId && generalQuestIds.has(cardId)) {
					movedToSharedDiscard.push({ cardId, type: 'QUEST' });
					changed = true;
					continue;
				}
				kept.push(cardRef);
			}

			player[zoneName] = kept;
		}
	}

	if (movedToSharedDiscard.length > 0) {
		// Legacy V4 saves only: stray Quest cards are dropped from player zones (2.0 has no shared Quest discard).
		console.log(`[UI] Sanitized ${movedToSharedDiscard.length} legacy GENERAL quest card(s) from player zones`);
	}

	return { state, changed };
}
