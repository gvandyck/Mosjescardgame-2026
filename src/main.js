// main.js — Entry point for the app.
// Detects the current page and starts the matching UI flow.

import { renderBoard, showPlaceEffectBanner } from './ui/boardRenderer.js';
import { createLogRenderer } from './ui/logRenderer.js';
import { renderHand } from './ui/handRenderer.js';
import { initModalManager } from './ui/modalManager.js';
import { animateFieldActivation, animateStateDelta, showTurnTransition, setAbilityNameResolver, animateQuestResult, showInstantEffect } from './ui/actionAnimations.js';
import { createInitialGameState, getOpponentMosjes, getPlayerMosjes } from './engine/gameState.js';
import { startTurn, endTurn, attemptGeneralQuest, attemptPersonalQuest, playPiecie, activatePiecie, confirmCallOfWelloes, playSnellie, playPlace, activatePlace, playMosje, useMosjeAbility, canPlayerActNow, playPersonalQuest, activatePersonalQuest } from './engine/turnManager.js';
import { resolveQuest, canAttemptGeneralQuest, canAttemptPersonalQuest, getQuestDiceThreshold } from './abilities/questLogic.js';
import { loseMP, gainMP } from './engine/mpManager.js';
import { MOSJES } from './data/mosjes.js';
import { PIECIES } from './data/piecies.js';
import { SNELLE_PIECIES } from './data/snellePiecies.js';
import { PLACES } from './data/places.js';
import { QUESTS } from './data/quests.js';
import { STARTER_DECKS } from './data/starterDecks.js';
import { createRoom, joinRoom } from './multiplayer/roomManager.js';
import { pushState, listenToState, stopListening, registerDisconnectLoss, cancelDisconnectHooks } from './multiplayer/syncManager.js';
import { eventBus } from './multiplayer/eventBus.js';
import { APP_VERSION } from './version.js';
import {
	onAuthStateChanged,
	signOut,
	getCurrentUser,
	reauthenticateCurrentUser,
	deleteCurrentAccount,
} from './multiplayer/authManager.js';
import { loadUserDecks, getLastUserStoreError, deleteUserData } from './multiplayer/userStore.js';
import { initNewAccount } from './multiplayer/accountSetup.js';
import { claimMatchReward } from './multiplayer/matchRewards.js';
import { showRewardOverlay } from './ui/rewardOverlay.js';
import { driveBotTurn, driveBotTurnSteps } from './bot/botDriver.js';

console.log('[UI] App bootstrapping...');

const CARD_LOOKUP = buildCardLookup();
let _customDecksCache = [];

// Feed the ability-cast chip the real ability name: the part before ":" in the
// description, minus qualifiers like "(comeback)"/"(passive)".
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

	// Auth gate: redirect to account page if not signed in.
	// Also pre-fills name and shows user badge once auth resolves.
	onAuthStateChanged(async user => {
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
		// One-time account setup (wallet + starter collection) for registered users
		if (!user.isAnonymous) {
			initNewAccount(user.uid, user.displayName || '');
		}
		// Load custom decks into deck selector (registered users only)
		if (!user.isAnonymous) {
			const customDecks = await loadUserDecks(user.uid);
			if (getLastUserStoreError()) {
				console.warn('[UI] Custom decks could not load. Check Firebase Database rules.');
			}
			_customDecksCache = customDecks;
			if (customDecks.length > 0) {
				const deckSelect = document.getElementById('deck-select');
				const divider = document.createElement('option');
				divider.disabled = true;
				divider.textContent = '── My Decks ──';
				deckSelect.appendChild(divider);
				for (const d of customDecks) {
					const opt = document.createElement('option');
					opt.value = d.id;
					opt.textContent = d.name;
					deckSelect.appendChild(opt);
				}
			}
		}
	});

	// Sign out button
	document.getElementById('btn-signout')?.addEventListener('click', async () => {
		await signOut();
		window.location.href = './account.html';
	});

	document.getElementById('btn-delete-account')?.addEventListener('click', deleteSignedInAccount);

	form.addEventListener('submit', async event => {
		event.preventDefault();
		const name = String(document.getElementById('player-name')?.value || '').trim();
		const deckId = String(document.getElementById('deck-select')?.value || 'DIGITAL_CONTROL');
		const mode = String(document.querySelector('input[name="lobby-mode"]:checked')?.value || 'create');
		const roomCodeInput = String(document.getElementById('room-code')?.value || '').trim();

		if (!name) {
			window.alert('Please enter your player name.');
			return;
		}

		const isOffline = document.getElementById('play-offline')?.checked === true;
		if (isOffline) {
			// Pick a bot deck different from the human's pick
			// Special case: test decks are paired together
			const candidates = STARTER_DECKS.filter(d => d.id !== deckId);
			const botDeck = candidates.length > 0
				? candidates[Math.floor(Math.random() * candidates.length)]
				: STARTER_DECKS[0];
			const botDeckId = botDeck.id;

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

		// Persist custom deck def to sessionStorage so game page can reconstruct it
		if (deckId.startsWith('custom_')) {
			const customDef = _customDecksCache.find(d => d.id === deckId);
			if (customDef) sessionStorage.setItem(`mosjes:customDeck:${deckId}`, JSON.stringify(customDef));
		}

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
				opponentDeckId: opponentData.deckId || 'PHYSICAL_FORCE',
				opponentUid: opponentData.uid || null,
			}));
			console.log('[UI] Joined room:', roomCodeInput);
			window.location.href = `./game.html?room=${encodeURIComponent(roomCodeInput)}&player=player_2`;
		}
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
	const topbarPlaceLabel = document.getElementById('topbar-place');

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

	const urlParams = new URLSearchParams(window.location.search);
	const lobbyData = readLobbyData();
	const log = createLogRenderer(logRoot);

	const roomCodeBadge = document.getElementById('topbar-room-code');
	const roomCodeValue = document.getElementById('topbar-room-code-value');
	if (roomCodeBadge && roomCodeValue && lobbyData.roomCode) {
		roomCodeValue.textContent = lobbyData.roomCode;
		roomCodeBadge.hidden = false;
	}
	const modal = initModalManager(modalRoot);
	if (logCopyBuffer) log.attachBuffer(logCopyBuffer);

	if (topbarPlaceLabel) {
		topbarPlaceLabel.style.cursor = 'pointer';
		topbarPlaceLabel.title = 'Show active Place details';
		topbarPlaceLabel.addEventListener('click', () => {
			if (!gameState?.activePlace) {
				modal.showInfo('No Active Place', 'There is currently no active Place card.');
				return;
			}
			const placeDef = CARD_LOOKUP[gameState.activePlace] || PLACES.find(p => p.id === gameState.activePlace);
			if (!placeDef) {
				modal.showInfo('Active Place', gameState.activePlace);
				return;
			}
			modal.showPlaceDetailModal(placeDef);
		});
	}

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
	const roomCode = urlParams.get('room') || lobbyData.roomCode || 'LOCAL';
	const isOffline  = urlParams.get('offline')   === 'true';
	const isBotVsBot = urlParams.get('botvsbot') === 'true';

	const localPlayerName = lobbyData.name || 'Player 1';
	const localDeckId = lobbyData.deckId || 'DIGITAL_CONTROL';
	const opponentName = lobbyData.opponentName || 'Opponent';
	const opponentDeckId = lobbyData.opponentDeckId || pickOpponentDeck(localDeckId);
	const opponentUid = lobbyData.opponentUid || null;

	const isOnline = roomCode !== 'LOCAL';

	let gameState = null;

	// Stats accumulator — local player game summary for end-screen
	let gameStats = {
		questsAttempted: 0,
		questsSucceeded: 0,
		peakMP: 0,
		biggestSingleGain: 0,
		mosjesLost: 0,
	};
	let prevActiveSlots = null; // snapshot of local player's active slots after each render

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
			steps = driveBotTurnSteps(gameState, botId);
		} catch (err) {
			console.error('[BOT] driveBotTurnSteps threw:', err);
			return;
		}
		playBotSteps(steps, botName, 0, botStepDelay);
	}

	// Log the +10 MP trickle that startTurn() just applied for the given player.
	function logTurnTrickle(activePlayerId) {
		const player = gameState.players[activePlayerId];
		if (!player) return;
		for (const slot of player.activeSlots) {
			if (slot && !slot.isDefeated) {
				log.add('gain', `Turn trickle: ${slot.name} +10 MP`);
			}
		}
	}

	// Returns info about whether a bot step would damage or eliminate the human Mosje.
	// prevState: state before the step, nextState: state after the step.
	function humanTakesDamageOrElimination(prevState, nextState, humanPlayerId) {
		const noResult = { isDamage: false, isElimination: false, affectedSlotIndex: -1, mpDelta: 0 };
		const prevPlayer = prevState?.players?.[humanPlayerId];
		const nextPlayer = nextState?.players?.[humanPlayerId];
		if (!prevPlayer || !nextPlayer) return noResult;
		for (let i = 0; i < prevPlayer.activeSlots.length; i++) {
			const prevSlot = prevPlayer.activeSlots[i];
			if (!prevSlot || prevSlot.isDefeated) continue;
			const prevMp = prevSlot.mp;
			const nextSlot = nextPlayer.activeSlots[i];
			if (nextSlot === null || nextSlot === undefined || nextSlot.isDefeated === true) {
				return { isDamage: true, isElimination: true, affectedSlotIndex: i, mpDelta: prevMp };
			}
			if (nextSlot.mp < prevMp && (prevMp - nextSlot.mp) >= 30) {
				return { isDamage: true, isElimination: false, affectedSlotIndex: i, mpDelta: prevMp - nextSlot.mp };
			}
		}
		return noResult;
	}

	// Shows a modal that lets the human play a PROTECT-tagged Snelle Piecie before a damaging bot step.
	// Returns true if the human played a card (gameState was mutated to reflect the play), false otherwise.
	async function showDamageInterruptModal(prevState, nextState, humanPlayerId) {
		const damageInfo = humanTakesDamageOrElimination(prevState, nextState, humanPlayerId);
		const humanHand = prevState?.players?.[humanPlayerId]?.hand ?? [];
		// Find PROTECT-tagged Snelle Piecies in hand
		const playableCards = humanHand
			.filter(handCard => {
				const def = SNELLE_PIECIES.find(c => c.id === handCard.id);
				return def && Array.isArray(def.tags) && def.tags.includes('PROTECT');
			})
			.map(handCard => SNELLE_PIECIES.find(c => c.id === handCard.id));
		if (playableCards.length === 0) return false;
		const options = [
			...playableCards.map(def => ({
				id: def.id,
				label: def.name,
				metaLabel: `Cost: ${def.mpCost} MP — ${def.description}`,
			})),
			{ id: '__pass__', label: 'Pass — take the damage' },
		];
		const promptStr = damageInfo.isElimination
			? "The bot's next action would eliminate your Mosje. Play a card to react?"
			: `The bot's next action would deal ${damageInfo.mpDelta} MP damage. Play a card to react?`;
		const choice = await modal.showOptionSelect({
			title: 'Damage Interrupt',
			prompt: promptStr,
			options,
			allowCancel: false,
		});
		if (!choice || choice === '__pass__') return false;
		const handIndex = gameState.players[humanPlayerId].hand.findIndex(c => c.id === choice);
		if (handIndex < 0) return false;
		const cardDef = SNELLE_PIECIES.find(c => c.id === choice);
		if (!cardDef) return false;
		const result = playSnellie(gameState, humanPlayerId, { id: choice, index: handIndex }, cardDef);
		if (result.success) {
			gameState = result.state;
			log.add('gain', `Interrupt: played ${cardDef.name} before bot step.`);
			return true;
		}
		return false;
	}

	// delay: ms between each step. onComplete: called after the final step instead of
	// advancing to the next bot (used by offline single-player to hand back to the human).
	async function playBotSteps(steps, botName, index, delay = 1000, onComplete = null) {
		if (index >= steps.length) { if (onComplete) onComplete(); return; }

		// Wait the animation delay before processing this step
		await new Promise(resolve => setTimeout(resolve, delay));

		const prevState = gameState;
		const { state: nextState, label } = steps[index];

		// Interrupt check: pause before applying a damage/elimination step (offline only)
		if (isOffline) {
			const damageInfo = humanTakesDamageOrElimination(prevState, nextState, localPlayerId);
			if (damageInfo.isDamage) {
				const humanPlayed = await showDamageInterruptModal(prevState, nextState, localPlayerId);
				if (humanPlayed) {
					// Human played a reactive card — gameState now has the flag set.
					// Re-run bot step computation from the updated gameState so the engine
					// consumes the flag correctly (e.g. negateNextElimination).
					let freshSteps;
					try {
						freshSteps = driveBotTurnSteps(gameState, 'player_2');
					} catch (err) {
						console.error('[BOT] re-run driveBotTurnSteps after interrupt threw:', err);
						freshSteps = steps.slice(index); // fallback: use remaining original steps
					}
					// If fresh steps are empty, hand control back
					if (!freshSteps || freshSteps.length === 0) {
						if (onComplete) onComplete();
						return;
					}
					// Continue from the beginning of fresh steps (step 0)
					await playBotSteps(freshSteps, botName, 0, delay, onComplete);
					return;
				}
			}
		}

		// Apply bot step
		gameState = nextState;
		renderFromState(gameState);
		log.add('quest', `${botName} ${label}`);

		if (gameState.status === 'FINISHED') {
			handleGameOver(gameState);
			return;
		}

		if (index === steps.length - 1) {
			if (onComplete) {
				onComplete();
			} else {
				// bot vs bot: start next player's turn and keep the loop going
				gameState = startTurn(gameState);
				renderFromState(gameState);
				logTurnTrickle(gameState.activePlayerId);
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
			steps = driveBotTurnSteps(gameState, 'player_2');
		} catch (err) {
			console.error('[BOT] driveBotTurnSteps threw:', err);
			if (endTurnBtn) endTurnBtn.disabled = false;
			return;
		}

		playBotSteps(steps, botName, 0, 400, () => {
			if (gameState.status === 'FINISHED') return;
			const beforeHumanTurn = snapshotForAnimation();
			gameState = startTurn(gameState);
			renderFromState(gameState);
			animateStateDelta(beforeHumanTurn, gameState, {
				actorId: localPlayerId,
				localPlayerId,
				actionLabel: 'turn-start',
			});
			log.add('gain', `Now active: ${gameState.players[gameState.activePlayerId]?.name}. Turn ${gameState.turnNumber}.`);
			logTurnTrickle(gameState.activePlayerId);
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

	// ── Post-match reward flow ────────────────────────────────────────────
	async function handleGameOver(gs) {
		await cancelDisconnectHooks();
		stopListening();
		const winnerName = gs.players[gs.winnerId]?.name || 'Unknown';
		const opponentName = gs.players[localPlayerId === 'player_1' ? 'player_2' : 'player_1']?.name || 'Opponent';
		const outcome = gs.winnerId === localPlayerId ? 'win' : 'loss';

		log.add('win', `${winnerName} won by ${gs.winReason}.`);

		let muntenAwarded = 0;
		const user = getCurrentUser();
		if ((isOnline || isOffline) && user && !user.isAnonymous) {
			const rewardRoomCode = isOnline ? roomCode : `OFFLINE_${Date.now()}`;
			const result = await claimMatchReward(rewardRoomCode, user.uid, outcome, opponentName);
			muntenAwarded = result.muntenAwarded;
		}

		showRewardOverlay({ outcome, winnerName, winReason: gs.winReason, muntenAwarded, isOnline, stats: gameStats });
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
			String(cardId).startsWith('snelle_') ? 'SNELLE_PIECIE'
			: String(cardId).startsWith('place_') ? 'PLACE'
			: String(cardId).startsWith('quest_') ? 'QUEST'
			: 'PIECIE';
		window.__testHooks = {
			setMosjeMP(playerId, slotIndex, mp) {
				const slot = gameState?.players?.[playerId]?.activeSlots?.[slotIndex];
				if (slot) { slot.mp = mp; renderFromState(gameState); }
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
			setYouriUses(playerId, count) {
				const player = gameState?.players?.[playerId];
				if (player) player.youriAbilityUses = count;
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
			// Place a specific Mosje into a slot with custom MP/level — lets a scenario
			// set up exactly the board it needs (e.g. two Mosjes for Tuk Healer/Tactician,
			// or a specific opponent Mosje for a defeat chain). slotIndex 0 or 1.
			// Pass cardId=null to clear the slot.
			setMosjeOnField(playerId, slotIndex, cardId, { mp = 10, level = 0 } = {}) {
				const player = gameState?.players?.[playerId];
				if (!player) return;
				if (cardId == null) { player.activeSlots[slotIndex] = null; renderFromState(gameState); return; }
				const def = MOSJES.find(m => m.id === cardId);
				if (!def) { console.warn('[TESTHOOK] setMosjeOnField: unknown Mosje', cardId); return; }
				player.activeSlots[slotIndex] = {
					cardId: def.id, name: def.name, subtype: def.subtype || 'UNKNOWN',
					traits: { ...def.traits }, mp, level,
					isDefeated: false, statusEffects: [],
					abilityUsedThisTurn: false, immuneThisTurn: false, mpLostThisTurn: 0,
				};
				renderFromState(gameState);
			},
			injectGraveyardCard(playerId, cardId) {
				const player = gameState?.players?.[playerId];
				if (player) { player.graveyard.unshift({ cardId, name: cardId, type: 'PIECIE', source: 'played' }); }
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
				return { before, after, delta: after - before, turnNumber: snap.turnNumber, canActivateOnTurn: snap.activePlaceCanActivateOnTurn };
			},
			injectQuestToTopOfDeck(questId) {
				// Put a specific quest at the front of the shared general quest deck.
				// Removes any existing copy first to avoid duplicates.
				if (!gameState) return;
				const deck = gameState.sharedGeneralQuestDeck;
				if (!Array.isArray(deck)) return;
				const existing = deck.findIndex(q => (q.cardId ?? q) === questId);
				if (existing >= 0) deck.splice(existing, 1);
				deck.unshift({ cardId: questId });
			},
			getGameState() { return JSON.parse(JSON.stringify(gameState)); },
			getHandSize(playerId) { return gameState?.players?.[playerId]?.hand?.length ?? -1; },
			getGraveyardSize(playerId) { return gameState?.players?.[playerId]?.graveyard?.length ?? -1; },
		};
	}

	function startGame(p1Name, p1Deck, p2Name, p2Deck) {
		const players = [
			{ playerId: 'player_1', name: p1Name, deckId: p1Deck, deckDef: resolveCustomDeckDef(p1Deck) },
			{ playerId: 'player_2', name: p2Name, deckId: p2Deck, deckDef: resolveCustomDeckDef(p2Deck) },
		];
		gameState = createInitialGameState(players, roomCode);
		gameState = startTurn(gameState);
		renderFromState(gameState);
		log.add('quest', `${localPlayerName} entered room ${roomCode}.`);
		log.add('gain', `Turn ${gameState.turnNumber} started for ${gameState.players[gameState.activePlayerId].name}.`);
		logTurnTrickle(gameState.activePlayerId);
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
				const deck1 = paramDeck1 || STARTER_DECKS[Math.floor(Math.random() * STARTER_DECKS.length)].id;
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
			gameState = startTurn(gameState);
		}

		renderAndAnimate(beforeTurnChange, { actionLabel: 'turn-change' });
		syncPush();
		log.add('quest', `${previousPlayerName} ended their turn.`);
		showTurnTransition({ playerName: previousPlayerName, type: 'end' });

		if (gameState.status === 'FINISHED') {
			handleGameOver(gameState);
			return;
		}

		const activeName = gameState.players[gameState.activePlayerId].name;
		log.add('gain', `Now active: ${activeName}. Turn ${gameState.turnNumber}.`);
		logTurnTrickle(gameState.activePlayerId);
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

	document.getElementById('btn-general-quest')?.addEventListener('click', async () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'You can only attempt quests on your own turn.');
			return;
		}
		const maxQGAttempts = gameState.activePlace === 'place_quest_haven' ? 2 : 1;
		if ((gameState.players[localPlayerId].questsAttemptedThisTurn || 0) >= maxQGAttempts) {
			modal.showInfo('Already Attempted', 'You have already attempted a quest this turn.');
			return;
		}

		const { state: newState, questCard: questRef } = attemptGeneralQuest(gameState);
		gameState = newState;


		if (!questRef) {
			log.add('quest', 'General Quest deck is empty!');
			renderAndCheckWin();
			return;
		}

		const questDef = CARD_LOOKUP[questRef.cardId];
		if (!questDef) {
			log.add('quest', `Unknown quest card: ${questRef.cardId}`);
			renderFromState(gameState);
			return;
		}

		const activeMosje = gameState.players[localPlayerId].activeSlots.find(s => s && !s.isDefeated);
		if (!canAttemptGeneralQuest(questDef, gameState, localPlayerId)) {
			const isQuestBlocked = activeMosje?.statusEffects?.some(e => e.type === 'QUEST_BLOCKED');
			const blockReason = isQuestBlocked
				? `quest blocked this turn (Tikker effect — cannot attempt Quests).`
				: `active Mosje has negative MP.`;
			log.add('quest', `Cannot attempt ${questDef.name} — ${blockReason}`);
			gameState.sharedGeneralQuestDiscard.push(questRef);
			renderAndCheckWin();
			return;
		}

		const threshold = getQuestDiceThreshold(questDef, activeMosje);
		// BUG-01 diagnostic: log computed threshold vs requirement description.
		// If the modal ever shows a wrong threshold, compare this log output to the
		// actual roll result. A mismatch means activeMosje here is stale (different
		// object than the one received by the requirement function).
		console.log(`[QUEST-DEBUG] ${questDef.name}: computed threshold=${threshold}, requirementDesc="${questDef.requirementDescription}", mosje=${activeMosje?.name}, mental=${activeMosje?.traits?.mental}`);
		log.add('quest', `${localPlayerName} is attempting General Quest: ${questDef.name}`);
		if (questDef.description) log.add('info', `Effect: ${questDef.description}`);

		const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
		const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
		const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
		const skiffaRerolls = getSkiffaRerolls(gameState, localPlayerId);
		const forceReroll = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;

		// Phase 8 Rule 3: broadcast active quest so opponent can see it
		gameState.activeQuest = {
			questName: questDef.name,
			cardName: questDef.name,
			questType: questDef.questType || 'GENERAL',
			attacker: localPlayerId,
			successMP: questDef.successMP,
			failMP: questDef.failMP,
			currentMp: activeMosje?.mp ?? null,
		};
		// Render BEFORE consuming flags so modifier pills (e.g. +2 Quest Roll) stay visible
		renderFromState(gameState);
		// Consume the flags after rendering so the pill shows during quest prep
		if (diceBonus) delete gameState._snelleFlags.questDiceBonus;
		if (questPrepBonus) gameState.players[localPlayerId].questPrepBonus = 0;
		if (forceReroll) delete gameState._snelleFlags.forceReroll[localPlayerId];
		syncPush();

		// Geen Raad Vraag Aad — no dice; interactive card-type guess against opponent's hand
		if (questDef.id === 'quest_geen_raad_vraag_aad') {
			const opponentPlayer = gameState.players[opponentId];
			const opponentHand = opponentPlayer?.hand ?? [];
			const firstSlotIndex = gameState.players[localPlayerId].activeSlots
				.findIndex(s => s && !s.isDefeated);

			if (opponentHand.length === 0) {
				log.add('quest', 'Geen Raad: opponent hand is empty — quest cannot resolve.');
				gameState.activeQuest = null;
				if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) gameState.sharedGeneralQuestDiscard = [];
				gameState.sharedGeneralQuestDiscard.push(questRef);
				renderAndCheckWin();
				syncPush();
				return;
			}

			const pickedIndex = await modal.showOpponentHandCardSelect({
				title: 'Geen Raad? Vraag Aad! — Pick a card',
				prompt: "Pick one of your opponent's face-down cards.",
				handSize: opponentHand.length,
				allowCancel: true,
			});
			if (pickedIndex === null) {
				gameState.activeQuest = null;
				gameState.sharedGeneralQuestDiscard.push(questRef);
				renderAndCheckWin();
				syncPush();
				return;
			}

			const guess = await modal.showCardTypeSelect({ title: 'Geen Raad: What type is this card?' });
			if (!guess) {
				gameState.activeQuest = null;
				gameState.sharedGeneralQuestDiscard.push(questRef);
				renderAndCheckWin();
				syncPush();
				return;
			}

			const actualCard = opponentHand[pickedIndex];
			const actualCardDef = CARD_LOOKUP[actualCard?.cardId];
			const actualCardType = actualCard?.type || actualCardDef?.type || 'UNKNOWN';
			const actualCardName = actualCardDef?.name || actualCard?.cardId || '???';

			await modal.showRevealedCard('Geen Raad — Card Revealed', actualCardName, actualCardType);

			const didSucceed = guess === actualCardType;
			const beforeResolve = snapshotForAnimation();
			gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed, firstSlotIndex);
			gameState.activeQuest = null;
			if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) gameState.sharedGeneralQuestDiscard = [];
			gameState.sharedGeneralQuestDiscard.push(questRef);

			// Stats: Geen Raad quest outcome
			gameStats.questsAttempted += 1;
			if (didSucceed) {
				gameStats.questsSucceeded += 1;
				const localBefore = beforeResolve.players?.[localPlayerId];
				const localAfter = gameState.players?.[localPlayerId];
				if (localBefore && localAfter) {
					(localAfter.activeSlots || []).forEach((afterSlot, i) => {
						const beforeSlot = (localBefore.activeSlots || [])[i];
						if (!afterSlot || !beforeSlot) return;
						const gain = Number(afterSlot.mp || 0) - Number(beforeSlot.mp || 0);
						if (gain > gameStats.biggestSingleGain) gameStats.biggestSingleGain = gain;
					});
				}
			}

			renderAndAnimate(beforeResolve, { actionLabel: 'quest-resolution' });
			animateQuestResult({ playerId: localPlayerId, slotIndex: firstSlotIndex, success: didSucceed });
			syncPush();

			log.add(didSucceed ? 'gain' : 'loss',
				`Geen Raad: guessed ${guess}, was ${actualCardType} → ${didSucceed ? '+50 MP' : '-25 MP'}`
			);
			logStateOutcome(log, beforeResolve, gameState, localPlayerId, 'Geen Raad? Vraag Aad! resolution');

			// Aad Recovery — each player who lost MP from this quest may discard 1 card to regain 40 MP
			let recoveryHappened = false;
			for (const pid of [localPlayerId, opponentId]) {
				const beforeSlot = beforeResolve.players[pid]?.activeSlots?.find(s => s && !s.isDefeated);
				const afterSlot = gameState.players[pid]?.activeSlots?.find(s => s && !s.isDefeated);
				if (!beforeSlot || !afterSlot || afterSlot.mp >= beforeSlot.mp) continue;

				const hand = gameState.players[pid]?.hand ?? [];
				if (hand.length === 0) continue;

				const pName = gameState.players[pid]?.name ?? pid;
				const mpLost = beforeSlot.mp - afterSlot.mp;
				const wantsRecovery = await modal.showConfirm(
					`${pName} — Aad Recovery`,
					`You lost ${mpLost} MP from Geen Raad. Discard 1 card to regain 40 MP?`
				);
				if (!wantsRecovery) continue;

				const handCards = hand.map(c => ({
					cardId: c.cardId,
					name: CARD_LOOKUP[c.cardId]?.name || c.cardId,
					description: c.type || CARD_LOOKUP[c.cardId]?.type || '',
				}));
				const discarded = await modal.showCardChoice(`${pName} — Pick a card to discard`, handCards);
				if (!discarded) continue;

				const cardIdx = gameState.players[pid].hand.findIndex(c => c.cardId === discarded.cardId);
				if (cardIdx !== -1) {
					const [removed] = gameState.players[pid].hand.splice(cardIdx, 1);
					if (!Array.isArray(gameState.players[pid].graveyard)) gameState.players[pid].graveyard = [];
					gameState.players[pid].graveyard.push({ cardId: removed.cardId ?? removed, name: removed.name ?? CARD_LOOKUP[removed.cardId ?? removed]?.name ?? removed.cardId ?? removed, type: 'HAND_CARD', source: 'discarded' });
				}
				const slotIdx = gameState.players[pid].activeSlots.findIndex(s => s && !s.isDefeated);
				if (slotIdx >= 0) {
					gameState.players[pid].activeSlots[slotIdx].mp += 40;
				}
				log.add('gain', `${pName} — Aad Recovery: discarded ${discarded.name}, regained 40 MP`);
				recoveryHappened = true;
			}
			if (recoveryHappened) {
				renderAndAnimate(beforeResolve, { actionLabel: 'quest-recovery' });
				syncPush();
			}
			return;
		}

		const gqSlots = gameState.players[localPlayerId].activeSlots
			.map((slot, index) => ({ slot, index }))
			.filter(({ slot }) => slot && !slot.isDefeated)
			.map(({ slot, index }) => ({
				slotIndex: index,
				name: slot.name || CARD_LOOKUP[slot.cardId]?.name || slot.cardId || 'Mosje',
				mp: slot.mp,
				traits: slot.traits || CARD_LOOKUP[slot.cardId]?.traits || {},
			}));

		// Check if player wants to pay 20 MP to attempt the quest
		const confirmPayment = await modal.showConfirm(
			`Attempt ${questDef.name}?`,
			'Pay 20 MP to attempt this quest?'
		);
		if (!confirmPayment) {
			// Player declined — return quest to discard and exit
			gameState.activeQuest = null;
			if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) gameState.sharedGeneralQuestDiscard = [];
			gameState.sharedGeneralQuestDiscard.push(questRef);
			renderAndCheckWin();
			syncPush();
			return;
		}

		function runGeneralQuestDiceRoll(targetSlotIndex) {
			// Tweede Kans: consume the granted reroll into this quest's dice roll.
			let tweedeKansReroll = 0;
			if (gameState._rerollGranted) {
				tweedeKansReroll = 1;
				delete gameState._rerollGranted;
			}
			modal.showDiceRoll(questDef, threshold, (didSucceed, rollInfo) => {
				const beforeResolve = snapshotForAnimation();
				gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed, targetSlotIndex);
				gameState.activeQuest = null;
				if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) {
					gameState.sharedGeneralQuestDiscard = [];
				}
				gameState.sharedGeneralQuestDiscard.push(questRef);

				// Stats: general quest outcome
				gameStats.questsAttempted += 1;
				if (didSucceed) {
					gameStats.questsSucceeded += 1;
					const localBefore = beforeResolve.players?.[localPlayerId];
					const localAfter = gameState.players?.[localPlayerId];
					if (localBefore && localAfter) {
						(localAfter.activeSlots || []).forEach((afterSlot, i) => {
							const beforeSlot = (localBefore.activeSlots || [])[i];
							if (!afterSlot || !beforeSlot) return;
							const gain = Number(afterSlot.mp || 0) - Number(beforeSlot.mp || 0);
							if (gain > gameStats.biggestSingleGain) gameStats.biggestSingleGain = gain;
						});
					}
				}

				renderAndAnimate(beforeResolve, { actionLabel: 'quest-resolution' });
				animateQuestResult({ playerId: localPlayerId, slotIndex: targetSlotIndex, success: didSucceed });
				syncPush();

				const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
				const sign = mpDelta >= 0 ? '+' : '';
				const rollLabel = rollInfo ? `rolled ${rollInfo.roll}, needed ${rollInfo.threshold}+ → ` : '';
				log.add(didSucceed ? 'gain' : 'loss',
					`${questDef.name}: ${rollLabel}${didSucceed ? 'Success' : 'Failed'} (${sign}${mpDelta} MP)`
				);
				logStateOutcome(log, beforeResolve, gameState, localPlayerId, `${questDef.name} resolution`);

				// Drain auto-ability log (e.g. Michelle's Tough Gamble)
				if (gameState._autoAbilityLog) {
					const al = gameState._autoAbilityLog;
					log.add(al.adjustment >= 0 ? 'gain' : 'loss', al.label);
					console.log('[ABILITY-AUTO]', al.label, '| roll:', al.roll, '| adjustment:', al.adjustment);
					delete gameState._autoAbilityLog;
				}
			}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus, forceReroll, skiffaRerolls: skiffaRerolls + tweedeKansReroll });
		}

		function showQuestPreviewThenRoll(targetSlotIndex) {
			const targetMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
			if (targetMosje) {
				// Deduct 20 MP quest cost immediately upon selection
				const costState = loseMP(gameState, localPlayerId, targetSlotIndex, 20, 'QUEST_COST');
				gameState = costState;
				log.add('loss', `Quest cost: ${questDef.name} -20 MP`);

				const updatedMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
				const thresholdForMosje = getQuestDiceThreshold(questDef, updatedMosje);
				modal.showQuestAttemptPreview(updatedMosje, questDef, thresholdForMosje, () => {
					runGeneralQuestDiceRoll(targetSlotIndex);
				}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus });
			} else {
				runGeneralQuestDiceRoll(targetSlotIndex);
			}
		}

		if (gqSlots.length > 1) {
			modal.showMosjeSelect(gqSlots, showQuestPreviewThenRoll, questDef);
		} else {
			showQuestPreviewThenRoll(gqSlots[0]?.slotIndex ?? 0);
		}
	});

	document.getElementById('btn-personal-quest')?.addEventListener('click', () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'You can only place quests on your own turn.');
			return;
		}

		const personalQuestsInHand = gameState.players[localPlayerId].hand.filter(
			c => CARD_LOOKUP[c.cardId]?.questType === 'PERSONAL'
		);

		if (personalQuestsInHand.length === 0) {
			modal.showInfo('No Personal Quests', 'You have no Personal Quest cards in your hand.');
			return;
		}

		const handCard = personalQuestsInHand[0];
		const questDef = CARD_LOOKUP[handCard.cardId];

		const beforePlay = snapshotForAnimation();
		const { state: newState, success, error } = playPersonalQuest(gameState, localPlayerId, handCard);
		if (!success) {
			modal.showInfo('Cannot Place', error || 'Cannot place this Quest right now.');
			return;
		}
		gameState = newState;
		log.add('quest', `Placed ${questDef?.name || 'Personal Quest'} face-down. Activate it next turn.`);
		syncPush();
		renderAndAnimate(beforePlay, { actionLabel: 'play-personal-quest', placedCardId: questDef?.id });
	});

	function renderFromState(state) {
		const uiState = toBoardViewModel(state, localPlayerId);

		const isLocalTurn = state.activePlayerId === localPlayerId;
		const maxQuestAttempts = state.activePlace === 'place_quest_haven' ? 2 : 1;
		const alreadyAttempted = (state.players[localPlayerId].questsAttemptedThisTurn || 0) >= maxQuestAttempts;
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

		const onUseAbility = (isLocalTurn && !gameOver) ? handleUseAbility : null;
		const onActivatePiecie = (isLocalTurn && !gameOver) ? handleActivatePiecie : null;
		const onActivatePlace = (isLocalTurn && !gameOver) ? handleActivatePlace : null;
		const onOpenDiscard = handleOpenDiscard;
		const onPlayFromHand = (isLocalTurn && !gameOver) ? handlePlayCard : null;
		renderBoard(boardRoot, uiState, onUseAbility, null, onActivatePiecie, onActivatePlace, onOpenDiscard, onPlayFromHand);
		if (state._lastPlaceEffect?.placeName) {
			showPlaceEffectBanner(state._lastPlaceEffect.placeName, state._lastPlaceEffect.description, state._lastPlaceEffect.phase);
			delete state._lastPlaceEffect;
		}

		const questBtnsEnabled = isLocalTurn && !alreadyAttempted && !gameOver;
		const questsUsed = state.players[localPlayerId].questsAttemptedThisTurn || 0;
		const questHavenActive = state.activePlace === 'place_quest_haven';

		const phaseLabel = gameOver
			? 'Game Over'
			: isLocalTurn
				? (alreadyAttempted
					? 'MAIN Phase'
					: questHavenActive
						? `MAIN / QUEST Phase (${questsUsed}/2 quests used)`
						: 'MAIN / QUEST Phase')
				: `${uiState.activePlayerName}'s Turn`;

		if (turnLabel) {
			turnLabel.textContent = `${isLocalTurn ? 'You' : uiState.activePlayerName} • ${phaseLabel}`;
		}

		const topbarPlace = document.getElementById('topbar-place');
		const topbarPlaceTurns = document.getElementById('topbar-place-turns');
		if (topbarPlace) topbarPlace.textContent = uiState.activePlaceName || 'None';
		if (topbarPlaceTurns) {
			const turns = Number(uiState.activePlaceTurns || 0);
			topbarPlaceTurns.textContent = `${turns} turn${turns === 1 ? '' : 's'} active`;
		}

		// Toggle Place active visual indicator
		const pageBody = document.querySelector('.page--game');
		if (pageBody) {
			if (state.activePlace) {
				pageBody.classList.add('place-active');
			} else {
				pageBody.classList.remove('place-active');
			}
		}

		const btnGeneral = document.getElementById('btn-general-quest');
		const btnPersonal = document.getElementById('btn-personal-quest');
		const btnEndTurn = document.getElementById('btn-end-turn');

		const questBtnLabel = questHavenActive && questsUsed === 1 ? ' (2nd)' : '';
		if (btnGeneral) {
			btnGeneral.disabled = !questBtnsEnabled;
			btnGeneral.textContent = `General Quest 🎯${questBtnLabel}`;
		}
		if (btnPersonal) {
			btnPersonal.disabled = !questBtnsEnabled;
			btnPersonal.textContent = `Personal Quest ⭐${questBtnLabel}`;
		}
		if (btnEndTurn) btnEndTurn.disabled = !isLocalTurn || gameOver;
	}

	const WEST_CALCULATED_GUESS_IDS = new Set(['mosje_martin_senor_west']);
	const BINTI_CUTTING_WORDS_IDS = new Set(['mosje_binti']);
	const GANDOE_ELIMINATION_IDS = new Set(['mosje_gandoe_destroyer']);
	const RONALD_MASTERMIND_IDS = new Set(['mosje_ronald_mastermind']);
	const MING_FUTURE_SIGHT_IDS = new Set(['mosje_ming_predictor']);
	const TUK_PERFECT_PLACEMENT_IDS = new Set(['mosje_tuk_architect']);
	const FPS_WEST_TACTICAL_IDS = new Set(['mosje_fps_west']);
	const RONALD_CHEF_INSIGHT_IDS = new Set(['mosje_ronald_chef']);
	const YOURI_SPEED_ACTIVATE_IDS = new Set(['mosje_youri']);

	async function handleUseAbility(mosjeId) {
		if (!gameState || gameState.status === 'FINISHED') return;

		const beforeAbility = snapshotForAnimation();
		const abilitySlotIndex = gameState.players[localPlayerId]?.activeSlots
			?.findIndex(slot => slot && slot.cardId === mosjeId && !slot.isDefeated);

		// West — Tactical Calculated Guess: pick card type → reveal top of deck → resolve
		if (WEST_CALCULATED_GUESS_IDS.has(mosjeId)) {
			const deck = gameState.players[localPlayerId]?.deck ?? [];
			if (deck.length === 0) {
				modal.showInfo('Cannot Use Ability', 'Your deck is empty — Calculated Guess cannot be used.');
				return;
			}

			const westSlot = gameState.players[localPlayerId].activeSlots
				.find(s => s && s.cardId === mosjeId && !s.isDefeated);
			if (westSlot && westSlot.level === 0 && westSlot.mp === 0) {
				modal.showInfo('Cannot Use Ability', 'Senor West is at Level 0 with 0 MP — Calculated Guess cannot be used.');
				return;
			}

			const guess = await modal.showCardTypeSelect({ title: 'West: Name a card type' });
			if (!guess) return;

			const topCard = deck[0];
			const topCardDef = CARD_LOOKUP[topCard?.cardId];
			const topCardType = topCard?.type || topCardDef?.type || 'UNKNOWN';
			const topCardName = topCardDef?.name || topCard?.cardId || '???';

			await modal.showRevealedCard('Revealed: Top of Your Deck', topCardName, topCardType);

			const stateForAbility = JSON.parse(JSON.stringify(gameState));
			stateForAbility._pendingTargets = {
				...(stateForAbility._pendingTargets || {}),
				west_guess: guess,
				west_top_card_type: topCardType,
			};

			const { state: newState, success, error } = useMosjeAbility(stateForAbility, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			if (abilitySlotIndex >= 0) {
				animateFieldActivation({
					zone: 'mosje',
					playerId: localPlayerId,
					slotIndex: abilitySlotIndex,
					cardId: mosjeId,
				});
			}
			gameState = newState;

			const slot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
			const isCorrect = guess === topCardType;
			log.add(isCorrect ? 'gain' : 'loss',
				`West Calculated Guess: guessed ${guess}, was ${topCardType} → ${isCorrect ? '+10 MP + draw 2' : '-10 MP'}`
			);
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, `${slot?.name || mosjeId} ability`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		// Binti — Cutting Words: discard a card from hand first
		if (BINTI_CUTTING_WORDS_IDS.has(mosjeId)) {
			const hand = gameState.players[localPlayerId].hand;
			if (hand.length === 0) {
				modal.showInfo('Cannot Use Ability', 'Your hand is empty — Binti needs a card to discard.');
				return;
			}
			const handCards = hand.map(c => {
				const id = c.cardId ?? c;
				const def = CARD_LOOKUP[id] || {};
				return { cardId: id, name: def.name || id, description: def.description || '' };
			});
			const chosen = await modal.showCardChoice('Binti — Cutting Words: discard a card', handCards);
			if (!chosen) return;
			const stateWithTarget = JSON.parse(JSON.stringify(gameState));
			stateWithTarget._pendingTargets = {
				...(stateWithTarget._pendingTargets || {}),
				binti_discard: chosen.cardId,
			};
			const { state: newState, success, error } = useMosjeAbility(stateWithTarget, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			if (abilitySlotIndex >= 0) {
				animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex: abilitySlotIndex, cardId: mosjeId });
			}
			gameState = newState;
			const bintiSlot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
			log.add('loss', `Binti Cutting Words: discarded ${chosen.name || chosen.cardId} — opponent loses 10 MP and discards a card.`);
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, `${bintiSlot?.name || mosjeId} ability`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		// Ronald Chef — Strategic Insight: pick an opponent hand card to lock
		if (RONALD_CHEF_INSIGHT_IDS.has(mosjeId)) {
			const oppId = Object.keys(gameState.players).find(id => id !== localPlayerId);
			const oppHand = gameState.players[oppId]?.hand ?? [];
			if (oppHand.length === 0) {
				modal.showInfo('Cannot Use Ability', "Your opponent's hand is empty — nothing to lock.");
				return;
			}
			const pickedIndex = await modal.showOpponentHandCardSelect({
				title: 'Strategic Insight — Lock a card',
				prompt: "Pick one of your opponent's face-down cards to lock until your next turn.",
				handSize: oppHand.length,
				allowCancel: true,
			});
			if (pickedIndex === null) return;
			const lockCard = oppHand[pickedIndex];
			const lockCardId = lockCard?.cardId ?? lockCard;
			const stateWithTarget = JSON.parse(JSON.stringify(gameState));
			stateWithTarget._pendingTargets = {
				...(stateWithTarget._pendingTargets || {}),
				ronaldLockCardId: lockCardId,
			};
			const { state: newState, success, error } = useMosjeAbility(stateWithTarget, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			if (abilitySlotIndex >= 0) {
				animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex: abilitySlotIndex, cardId: mosjeId });
			}
			gameState = newState;
			const lockName = CARD_LOOKUP[lockCardId]?.name || lockCardId;
			log.add('loss', `Ronald Strategic Insight: paid 20 MP and locked ${lockName} in the opponent's hand until your next turn.`);
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, 'Ronald Strategic Insight');
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		// FPS West — Tactical Analysis: guess a card type in the opponent's hand
		if (FPS_WEST_TACTICAL_IDS.has(mosjeId)) {
			const oppId = Object.keys(gameState.players).find(id => id !== localPlayerId);
			const oppHand = gameState.players[oppId]?.hand ?? [];
			if (oppHand.length === 0) {
				modal.showInfo('Cannot Use Ability', "Your opponent's hand is empty — nothing to analyze.");
				return;
			}
			const pickedIndex = await modal.showOpponentHandCardSelect({
				title: 'Tactical Analysis — Pick a card',
				prompt: "Pick one of your opponent's face-down cards.",
				handSize: oppHand.length,
				allowCancel: true,
			});
			if (pickedIndex === null) return;
			const guess = await modal.showCardTypeSelect({ title: 'Tactical Analysis: What type is this card?' });
			if (!guess) return;
			const actualCard = oppHand[pickedIndex];
			const actualId = actualCard?.cardId ?? actualCard;
			const actualDef = CARD_LOOKUP[actualId] || {};
			const actualType = actualCard?.type || actualDef.type || 'UNKNOWN';
			await modal.showRevealedCard('Tactical Analysis — Card Revealed', actualDef.name || actualId, actualType);
			const didSucceed = guess === actualType;
			const stateWithTarget = JSON.parse(JSON.stringify(gameState));
			stateWithTarget._pendingTargets = {
				...(stateWithTarget._pendingTargets || {}),
				fpsWestGuessCorrect: didSucceed,
			};
			const { state: newState, success, error } = useMosjeAbility(stateWithTarget, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			if (abilitySlotIndex >= 0) {
				animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex: abilitySlotIndex, cardId: mosjeId });
			}
			gameState = newState;
			log.add(didSucceed ? 'gain' : 'loss', didSucceed
				? 'FPS West Tactical Analysis: correct guess — +70 MP!'
				: 'FPS West Tactical Analysis: wrong guess — -20 MP.');
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, 'FPS West Tactical Analysis');
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		// Gandoe — Elimination Strike: confirm before firing (once per game, 80 MP cost)
		if (GANDOE_ELIMINATION_IDS.has(mosjeId)) {
			const gandoeSlot = gameState.players[localPlayerId].activeSlots
				.find(s => s && !s.isDefeated && String(s.cardId).includes('gandoe_destroyer'));
			if (gandoeSlot?.eliminationStrikeUsed) {
				modal.showInfo('Already Used', 'Elimination Strike can only be used once per game.');
				return;
			}
			if (!gandoeSlot || gandoeSlot.mp < 80) {
				modal.showInfo('Cannot Use Ability', `Not enough MP — Elimination Strike costs 80 MP (Gandoe has ${gandoeSlot?.mp ?? 0} MP).`);
				return;
			}
			// Find target: opponent's lowest-level Mosje
			const oppId = Object.keys(gameState.players).find(id => id !== localPlayerId);
			const oppSlots = oppId ? gameState.players[oppId].activeSlots : [];
			let targetSlot = null;
			oppSlots.forEach(s => {
				if (!s || s.isDefeated) return;
				if (!targetSlot || s.level < targetSlot.level || (s.level === targetSlot.level && s.mp < targetSlot.mp)) {
					targetSlot = s;
				}
			});
			if (!targetSlot) {
				modal.showInfo('Cannot Use Ability', 'No opponent Mosje on field to target.');
				return;
			}
			const confirmed = await modal.showOptionSelect({
				title: 'Elimination Strike',
				prompt: `Pay 80 MP to send ${targetSlot.name} (Level ${targetSlot.level}, ${targetSlot.mp} MP) to the Welloe pile? This cannot be undone and can only be used once.`,
				options: [
					{ id: 'confirm', label: '💀 Execute — Pay 80 MP' },
					{ id: 'cancel', label: 'Cancel' },
				],
				allowCancel: true,
			});
			if (!confirmed || confirmed === 'cancel') return;
			const { state: newState, success, error } = useMosjeAbility(gameState, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			if (abilitySlotIndex >= 0) {
				animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex: abilitySlotIndex, cardId: mosjeId });
			}
			gameState = newState;
			log.add('loss', `Gandoe Elimination Strike: ${targetSlot.name} sent to the Welloe pile. (-80 MP)`);
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, 'Gandoe Elimination Strike');
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		// Ronald Mastermind — Master Plan: pick a Piecie from your discard to play for free
		if (RONALD_MASTERMIND_IDS.has(mosjeId)) {
			const discard = gameState.players[localPlayerId].graveyard || [];
			const piecieCards = discard
				.map(c => {
					const id = c.cardId ?? c;
					const def = CARD_LOOKUP[id] || {};
					return { cardId: id, type: def.type, name: def.name || id, description: def.description || '' };
				})
				.filter(c => c.type !== 'MOSJE' && c.type !== 'PLACE' && String(c.cardId).startsWith('piecie_'));
			if (piecieCards.length === 0) {
				modal.showInfo('Cannot Use Ability', 'No Piecie in your discard to play with Master Plan.');
				return;
			}
			const chosen = await modal.showCardChoice('Master Plan — play a Piecie from discard', piecieCards);
			if (!chosen) return;
			const stateWithTarget = JSON.parse(JSON.stringify(gameState));
			stateWithTarget._pendingTargets = {
				...(stateWithTarget._pendingTargets || {}),
				masterPlanCardId: chosen.cardId,
			};
			const { state: newState, success, error } = useMosjeAbility(stateWithTarget, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			if (abilitySlotIndex >= 0) {
				animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex: abilitySlotIndex, cardId: mosjeId });
			}
			gameState = newState;
			const ronaldSlot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
			log.add('gain', `Ronald Master Plan: played ${chosen.name || chosen.cardId} for free from discard.`);
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, `${ronaldSlot?.name || mosjeId} ability`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		// Ming Predictor — Future Sight: reveal top General Quest, optionally send it to the bottom
		if (MING_FUTURE_SIGHT_IDS.has(mosjeId)) {
			const questDeck = gameState.sharedGeneralQuestDeck || [];
			const topQuest = questDeck[0];
			if (!topQuest) {
				modal.showInfo('Cannot Use Ability', 'The General Quest deck is empty — nothing to look at.');
				return;
			}
			const topQuestId = topQuest.cardId ?? topQuest;
			const topQuestName = CARD_LOOKUP[topQuestId]?.name || topQuestId || '???';
			await modal.showRevealedCard('Future Sight — Top Quest', topQuestName, 'QUEST');
			const choice = await modal.showOptionSelect({
				title: 'Future Sight',
				prompt: 'Move this quest to the bottom?',
				options: [
					{ id: 'bottom', label: 'Send to bottom' },
					{ id: 'leave', label: 'Leave on top' },
				],
				allowCancel: true,
			});
			if (!choice) return;
			const stateWithTarget = JSON.parse(JSON.stringify(gameState));
			stateWithTarget._pendingTargets = {
				...(stateWithTarget._pendingTargets || {}),
				mingSendToBottom: choice === 'bottom',
			};
			const { state: newState, success, error } = useMosjeAbility(stateWithTarget, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			if (abilitySlotIndex >= 0) {
				animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex: abilitySlotIndex, cardId: mosjeId });
			}
			gameState = newState;
			const mingSlot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
			log.add('loss', `Ming Future Sight: paid 10 MP to look at the top quest${choice === 'bottom' ? ' and sent it to the bottom' : ''}.`);
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, `${mingSlot?.name || mosjeId} ability`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		// Tuk Architect — Perfect Placement: peek top 5, take 2 to hand, bottom the other 3
		if (TUK_PERFECT_PLACEMENT_IDS.has(mosjeId)) {
			const deck = gameState.players[localPlayerId].deck || [];
			if (deck.length === 0) {
				modal.showInfo('Cannot Use Ability', 'Your deck is empty — Perfect Placement cannot be used.');
				return;
			}
			const top5 = deck.slice(0, 5).map(c => {
				const id = c.cardId ?? c;
				const def = CARD_LOOKUP[id] || {};
				return { cardId: id, name: def.name || id, description: def.description || '' };
			});
			// Two sequential single picks (showCardChoice does not support multi-select).
			const first = await modal.showCardChoice('Perfect Placement — take 1st card to hand', top5);
			if (!first) return;
			const remaining = top5.filter(c => c.cardId !== first.cardId);
			const second = remaining.length > 0
				? await modal.showCardChoice('Perfect Placement — take 2nd card to hand', remaining)
				: null;
			if (remaining.length > 0 && !second) return;
			const tukChosenCardIds = second ? [first.cardId, second.cardId] : [first.cardId];
			const stateWithTarget = JSON.parse(JSON.stringify(gameState));
			stateWithTarget._pendingTargets = {
				...(stateWithTarget._pendingTargets || {}),
				tukChosenCardIds,
			};
			const { state: newState, success, error } = useMosjeAbility(stateWithTarget, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			if (abilitySlotIndex >= 0) {
				animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex: abilitySlotIndex, cardId: mosjeId });
			}
			gameState = newState;
			const tukSlot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
			const takenNames = tukChosenCardIds.map(id => CARD_LOOKUP[id]?.name || id).join(', ');
			log.add('loss', `Tuk Perfect Placement: paid 15 MP, took ${takenNames} to hand, bottomed the rest.`);
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, `${tukSlot?.name || mosjeId} ability`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		if (YOURI_SPEED_ACTIVATE_IDS.has(mosjeId)) {
			const { state: abilityState, success, error, pendingYouriActivation } =
				useMosjeAbility(gameState, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'Youri ability cannot be used right now.');
				return;
			}

			let stateAfterAbility = abilityState;

			if (pendingYouriActivation) {
				// Multiple face-down piecies — show slot selector
				const pending = stateAfterAbility._pendingYouriActivation;
				const player = stateAfterAbility.players[localPlayerId];
				const options = pending.faceDownSlots.map(i => {
					const slot = player.piecieSlots[i];
					const def = slot?.cardId ? CARD_LOOKUP[slot.cardId] : null;
					return { id: i, label: `Slot ${i + 1} — ${def?.name || slot?.cardId || 'Unknown'}` };
				});
				const chosen = await modal.showOptionSelect({
					title: 'Youri — Speed Activate',
					prompt: 'Pick a face-down Piecie to activate:',
					options,
					allowCancel: true,
				});
				delete stateAfterAbility._pendingYouriActivation;
				if (chosen === null || chosen === undefined) {
					// Cost already spent — commit partial state and inform player
					modal.showInfo('Ability Used', 'Youri paid 20 MP but no Piecie was selected. The cost is still spent.');
					gameState = stateAfterAbility;
					renderAndCheckWin();
					syncPush();
					return;
				}
				const slotIndex = typeof chosen === 'object' ? chosen.id : chosen;
				// Set canActivateOnTurn so the activatePiecie guard passes
				stateAfterAbility = JSON.parse(JSON.stringify(stateAfterAbility));
				stateAfterAbility.players[localPlayerId].piecieSlots[slotIndex].canActivateOnTurn =
					stateAfterAbility.turnNumber;

				const { state: activatedState, success: actSuccess, error: actError } =
					activatePiecie(stateAfterAbility, localPlayerId, slotIndex);
				if (!actSuccess) {
					modal.showInfo('Activation Failed', actError || 'Could not activate the Piecie.');
					gameState = stateAfterAbility;
					renderAndCheckWin();
					return;
				}
				stateAfterAbility = activatedState;
				// Draw 1 card after activation
				if (stateAfterAbility.players[localPlayerId].deck.length > 0) {
					stateAfterAbility = JSON.parse(JSON.stringify(stateAfterAbility));
					stateAfterAbility.players[localPlayerId].hand.push(
						stateAfterAbility.players[localPlayerId].deck.shift()
					);
				}
			} else {
				// Single-piecie auto-path: engine already set canActivateOnTurn and drew the card
				// Find the unlocked slot (canActivateOnTurn === turnNumber, face-down, not activated)
				const player = stateAfterAbility.players[localPlayerId];
				const autoSlotIndex = player.piecieSlots.findIndex(
					s => s && s.type === 'PIECIE' && s.faceDown && !s.activated &&
						s.canActivateOnTurn === stateAfterAbility.turnNumber
				);
				if (autoSlotIndex >= 0) {
					const { state: activatedState, success: actSuccess } =
						activatePiecie(stateAfterAbility, localPlayerId, autoSlotIndex);
					if (actSuccess) stateAfterAbility = activatedState;
				}
			}

			if (abilitySlotIndex >= 0) {
				animateFieldActivation({ zone: 'mosje', playerId: localPlayerId, slotIndex: abilitySlotIndex, cardId: mosjeId });
			}
			gameState = stateAfterAbility;
			// Log the ability cost against beforeAbility (shows -20 MP on Youri)
			log.add('loss', `Youri Speed Activate: paid 20 MP, activated face-down Piecie, drew 1 card.`);
			logStateOutcome(log, beforeAbility, abilityState, localPlayerId, 'Youri Speed Activate');
			// Log the piecie effect against the post-cost state (shows piecie's full MP gain correctly)
			logStateOutcome(log, abilityState, gameState, localPlayerId, 'Piecie effect');
			syncPush();
			renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
			return;
		}

		const { state: newState, success, error } = useMosjeAbility(gameState, localPlayerId, mosjeId);
		if (!success) {
			modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
			return;
		}
		if (abilitySlotIndex >= 0) {
			animateFieldActivation({
				zone: 'mosje',
				playerId: localPlayerId,
				slotIndex: abilitySlotIndex,
				cardId: mosjeId,
			});
		}
		gameState = newState;

		const slot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
		log.add('gain', `Used ability: ${slot?.name || mosjeId}.`);
		const abilityDef = CARD_LOOKUP[mosjeId];
		if (abilityDef?.abilityDescription) log.add('info', `Effect: ${abilityDef.abilityDescription}`);
		logStateOutcome(log, beforeAbility, gameState, localPlayerId, `${slot?.name || mosjeId} ability`);
		syncPush();

		if (gameState.status === 'FINISHED') {
			stopListening();
			const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
			log.add('win', `${winnerName} won by ${gameState.winReason}.`);
			modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
		}
		renderAndAnimate(beforeAbility, { actionLabel: 'mosje-ability' });
	}

	async function handleActivatePersonalQuestFromField(slotIndex) {
		if (!gameState || gameState.status === 'FINISHED') return;

		const piecieSlot = gameState.players[localPlayerId]?.piecieSlots?.[slotIndex];
		const questDef = piecieSlot?.cardId ? CARD_LOOKUP[piecieSlot.cardId] : null;
		if (!questDef) { modal.showInfo('Error', 'Quest card not found.'); return; }

		if (!canAttemptPersonalQuest(questDef, gameState, localPlayerId)) {
			const player = gameState.players[localPlayerId];
			const activeMosjeForBlock = player?.activeSlots?.find(s => s && !s.isDefeated);
			const isQuestBlockedP = activeMosjeForBlock?.statusEffects?.some(e => e.type === 'QUEST_BLOCKED');
			const pBlockReason = isQuestBlockedP
				? `Quest blocked this turn (Tikker effect — cannot attempt Quests).`
				: `${questDef.name} requires its Mosje to be on the field.`;
			modal.showInfo('Cannot Activate', pBlockReason);
			return;
		}

		// Read-only guard checks (mirrors activatePersonalQuest) before showing any modal.
		const player = gameState.players[localPlayerId];
		const questSlotData = player?.piecieSlots?.[slotIndex];
		const canActivateOnTurn = Number.isFinite(questSlotData?.canActivateOnTurn) ? questSlotData.canActivateOnTurn : 0;
		if (gameState.turnNumber < canActivateOnTurn) {
			modal.showInfo('Cannot Activate', 'This Quest can be activated starting next turn.');
			return;
		}
		const questHavenActive = gameState.activePlace === 'place_quest_haven';
		const maxQuestsThisTurn = questHavenActive ? 2 : 1;
		if ((player.questsAttemptedThisTurn ?? 0) >= maxQuestsThisTurn) {
			modal.showInfo('Cannot Activate', 'You have already attempted a quest this turn.');
			return;
		}

		// Capture bonuses before any state mutation.
		const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
		const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
		const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
		const skiffaRerolls = getSkiffaRerolls(gameState, localPlayerId);
		const forceReroll = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;

		// Build Mosje options from current state (quest card still on field at this point).
		const isKickboxing = questDef.id === 'quest_personal_kickboxing_bootcamp';
		const questSlots = gameState.players[localPlayerId].activeSlots
			.map((slot, index) => ({ slot, index }))
			.filter(({ slot }) => slot && !slot.isDefeated)
			.map(({ slot, index }) => {
				const eligible = !isKickboxing || (String(slot.cardId).includes('gandoe') || slot.cardId === 'mosje_michelle');
				return {
					slotIndex: index,
					name: slot.name || CARD_LOOKUP[slot.cardId]?.name || slot.cardId || 'Mosje',
					mp: slot.mp,
					traits: slot.traits || CARD_LOOKUP[slot.cardId]?.traits || {},
					disabled: !eligible,
				};
			});

		// Fires only after the player confirms a Mosje in the selection modal.
		function onMosjeSelected(targetSlotIndex) {
			animateFieldActivation({
				zone: 'piecie',
				playerId: localPlayerId,
				slotIndex,
				cardId: questDef.id,
			});
			// Commit: remove quest from field, discard, increment attempt counter.
			const { state: activatedState, success, error } = activatePersonalQuest(gameState, localPlayerId, slotIndex);
			if (!success) { modal.showInfo('Cannot Activate', error || 'Quest cannot be activated now.'); return; }
			gameState = activatedState;

			// Deduct 20 MP from the chosen Mosje.
			gameState = loseMP(gameState, localPlayerId, targetSlotIndex, 20, 'QUEST_COST');
			log.add('loss', 'Quest attempt cost: -20 MP');

			const chosenMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
			const perMosjeCfg = questDef.perMosjeConfig?.[chosenMosje?.cardId];
			gameState.activeQuest = {
				questName: questDef.name, cardName: questDef.name,
				questType: questDef.questType || 'PERSONAL', attacker: localPlayerId,
				successMP: perMosjeCfg?.successMP ?? questDef.successMP, failMP: questDef.failMP,
				currentMp: chosenMosje?.mp ?? null,
			};
			renderFromState(gameState);
			if (diceBonus) delete gameState._snelleFlags.questDiceBonus;
			if (questPrepBonus) gameState.players[localPlayerId].questPrepBonus = 0;
			if (forceReroll) delete gameState._snelleFlags.forceReroll[localPlayerId];
			syncPush();

			// Show quest detail preview (modal-card--mosje-detail).
			// "Attempt Quest" → dice roll. "Cancel" → close with no MP refund.
			const updatedMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
			modal.showQuestAttemptPreview(updatedMosje, questDef, getQuestDiceThreshold(questDef, updatedMosje), () => {
				runQuestDiceRoll(targetSlotIndex);
			}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus });
		}

		function runQuestDiceRoll(targetSlotIndex) {
			const liveMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
			const mosjePerCfg = questDef.perMosjeConfig?.[liveMosje?.cardId];
			const threshold = mosjePerCfg ? mosjePerCfg.threshold : getQuestDiceThreshold(questDef, liveMosje);
			// Tweede Kans: consume the granted reroll into this quest's dice roll.
			let tweedeKansReroll = 0;
			if (gameState._rerollGranted) {
				tweedeKansReroll = 1;
				delete gameState._rerollGranted;
			}
			modal.showDiceRoll(questDef, threshold, (didSucceed, rollInfo) => {
				const beforeResolve = snapshotForAnimation();
				// Kickboxing Bootcamp: override successMP per chosen Mosje + synergy bonus.
				let resolveQuestDef = questDef;
				if (isKickboxing && mosjePerCfg) {
					const player = gameState.players[localPlayerId];
					const bothActive = player.activeSlots.some(s => s && !s.isDefeated && String(s.cardId).includes('gandoe'))
						&& player.activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_michelle');
					const finalMP = mosjePerCfg.successMP + (didSucceed && bothActive ? 20 : 0);
					resolveQuestDef = { ...questDef, successMP: finalMP };
				}
				gameState = resolveQuest(gameState, localPlayerId, resolveQuestDef, didSucceed, targetSlotIndex);
				gameState.activeQuest = null;

				// Stats: personal quest outcome
				gameStats.questsAttempted += 1;
				if (didSucceed) {
					gameStats.questsSucceeded += 1;
					const localBefore = beforeResolve.players?.[localPlayerId];
					const localAfter = gameState.players?.[localPlayerId];
					if (localBefore && localAfter) {
						(localAfter.activeSlots || []).forEach((afterSlot, i) => {
							const beforeSlot = (localBefore.activeSlots || [])[i];
							if (!afterSlot || !beforeSlot) return;
							const gain = Number(afterSlot.mp || 0) - Number(beforeSlot.mp || 0);
							if (gain > gameStats.biggestSingleGain) gameStats.biggestSingleGain = gain;
						});
					}
				}

				// Perfect Sync: show opponent hand, then let player pick mosje for +70 MP.
				if (questDef.id === 'quest_personal_perfect_sync' && didSucceed) {
					const opponentId = Object.keys(gameState.players).find(pid => pid !== localPlayerId);
					const opponent = gameState.players[opponentId];
					const handCardIds = (opponent?.hand || []).map(c => c.cardId || c.id || 'Unknown');
					const opponentName = opponent?.name || 'Opponent';
					renderFromState(gameState);
					animateStateDelta(beforeResolve, gameState, {
						actorId: localPlayerId,
						localPlayerId,
						actionLabel: 'quest-resolution',
					});
					syncPush();
					modal.showHandViewerModal(handCardIds, opponentName, CARD_LOOKUP, () => {
						const liveMosjeSlots = gameState.players[localPlayerId].activeSlots
							.map((slot, index) => ({ slot, index }))
							.filter(({ slot }) => slot && !slot.isDefeated)
							.map(({ slot, index }) => ({
								slotIndex: index,
								name: slot.name || CARD_LOOKUP[slot.cardId]?.name || slot.cardId || 'Mosje',
								mp: slot.mp,
								traits: slot.traits || CARD_LOOKUP[slot.cardId]?.traits || {},
							}));
						modal.showMosjeSelect(liveMosjeSlots, (selectedSlotIndex) => {
							const beforePerfectGain = snapshotForAnimation();
							gameState = gainMP(gameState, localPlayerId, selectedSlotIndex, 70);
							renderFromState(gameState);
							animateStateDelta(beforePerfectGain, gameState, {
								actorId: localPlayerId,
								localPlayerId,
								actionLabel: 'quest-resolution',
							});
							syncPush();
							log.add('gain', `Perfect Sync: Success → +70 MP`);
							logStateOutcome(log, beforeResolve, gameState, localPlayerId, 'Perfect Sync resolution');
						}, null, { title: 'Perfect Sync', prompt: 'Select Mosje to receive +70 MP.' });
					});
					return;
				}

				renderFromState(gameState);
				animateStateDelta(beforeResolve, gameState, {
					actorId: localPlayerId,
					localPlayerId,
					actionLabel: 'quest-resolution',
				});
				animateQuestResult({ playerId: localPlayerId, slotIndex: targetSlotIndex, success: didSucceed });
				syncPush();
				const mpDelta = didSucceed ? resolveQuestDef.successMP : resolveQuestDef.failMP;
				const sign = mpDelta >= 0 ? '+' : '';
				const rollLabel = rollInfo ? `rolled ${rollInfo.roll}, needed ${rollInfo.threshold}+ → ` : '';
				log.add(didSucceed ? 'gain' : 'loss', `${questDef.name}: ${rollLabel}${didSucceed ? 'Success' : 'Failed'} (${sign}${mpDelta} MP)`);
				logStateOutcome(log, beforeResolve, gameState, localPlayerId, `${questDef.name} resolution`);
			}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus, forceReroll, skiffaRerolls: skiffaRerolls + tweedeKansReroll });
		}

		log.add('quest', `Activating Personal Quest: ${questDef.name}`);
		modal.showMosjeSelect(questSlots, onMosjeSelected, questDef);
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

		// Route Personal Quest activation to its own handler
		if (piecieSlot?.type === 'QUEST') {
			await handleActivatePersonalQuestFromField(slotIndex);
			return;
		}

		let stateForActivation = gameState;
		if (piecieCardDef?.effectId === 'effect_affoe') {
			const oppTargets = getOpponentMosjes(gameState, localPlayerId);
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);
			if (oppTargets.length === 0) {
				modal.showInfo('No Targets', 'No valid opponent targets.');
				return;
			}
			const drainId = await modal.showTargetSelector(oppTargets, 'Choose an opponent Mosje to drain:');
			if (!drainId) return;
			let gainId = null;
			if (ownTargets.length > 0) {
				gainId = await modal.showTargetSelector(ownTargets, 'Choose your Mosje to receive MP:');
			}
			stateForActivation = JSON.parse(JSON.stringify(gameState));
			stateForActivation._pendingTargets = { affoe_drain: drainId, affoe_gain: gainId };
		} else if (piecieCardDef?.effectId === 'effect_leipe_swap') {
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);
			const oppTargets = getOpponentMosjes(gameState, localPlayerId);
			if (ownTargets.length === 0 || oppTargets.length === 0) {
				modal.showInfo('No Targets', 'Leipe Swap needs one of your Mosjes and an opponent Mosje on the field.');
				return;
			}
			const yourPick = await modal.showTargetSelector(ownTargets, 'Leipe Swap - choose YOUR Mosje to swap MP:');
			if (!yourPick) return;
			const oppPick = await modal.showTargetSelector(oppTargets, 'Leipe Swap - choose the OPPONENT Mosje to swap with:');
			if (!oppPick) return;
			const oppId = String(oppPick).split('_slot_')[0];
			stateForActivation = JSON.parse(JSON.stringify(gameState));
			stateForActivation._pendingTargets = {
				...(stateForActivation._pendingTargets || {}),
				leipeYourSlot: parseInt(String(yourPick).split('_slot_')[1], 10),
				leipeOppId: oppId,
				leipeOppSlot: parseInt(String(oppPick).split('_slot_')[1], 10),
			};
		} else if (piecieCardDef?.effectId === 'effect_kannetje_melk'
				|| piecieCardDef?.effectId === 'effect_dikke_jonko'
				|| piecieCardDef?.effectId === 'effect_tikker') {
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);
			if (ownTargets.length > 1) {
				const selectedId = await modal.showTargetSelector(ownTargets, 'Choose your Mosje to receive MP:');
				if (!selectedId) return;
				const mosjeSlotIndex = parseInt(selectedId.split('_slot_')[1], 10);
				if (!Number.isNaN(mosjeSlotIndex)) {
					stateForActivation = JSON.parse(JSON.stringify(gameState));
					stateForActivation._pendingTargets = { own_slot_index: mosjeSlotIndex };
				}
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
		gameState = newState;

		// ── STUB-11: Bagga of Greed — discard 1 from entire hand ─────────────────
		if (gameState._baggaDiscard) {
			const hand = gameState.players[localPlayerId].hand;
			const allCards = hand.map(c => {
				const def = CARD_LOOKUP[c.cardId] || {};
				return { cardId: c.cardId, name: def.name || c.cardId, description: def.description || '' };
			});
			const cardToDiscard = await modal.showCardChoice('Bagga of Greed — Discard a Card', allCards);
			if (cardToDiscard) {
				const idx = gameState.players[localPlayerId].hand.findIndex(c => c.cardId === cardToDiscard.cardId);
				if (idx >= 0) {
					const [removed] = gameState.players[localPlayerId].hand.splice(idx, 1);
					const _removedId = removed.cardId || removed;
					if (!Array.isArray(gameState.players[localPlayerId].graveyard)) gameState.players[localPlayerId].graveyard = [];
					gameState.players[localPlayerId].graveyard.push({ cardId: _removedId, name: CARD_LOOKUP[_removedId]?.name ?? _removedId, type: CARD_LOOKUP[_removedId]?.type ?? 'HAND_CARD', source: 'discarded' });
				}
			}
			// If null: player keeps both cards (Keep Both Cards ghost button)
			delete gameState._baggaDiscard;
		}

		// ── STUB-14: Welloe Force — pick opponent Mosje as redirect target ────────
		if (gameState._welloeForceActive?.targetSlotId === null) {
			const oppId = Object.keys(gameState.players).find(id => id !== localPlayerId);
			const oppSlots = [];
			if (oppId) {
				gameState.players[oppId].activeSlots.forEach((slot, idx) => {
					if (slot && !slot.isDefeated) {
						oppSlots.push({ id: `${oppId}_slot_${idx}`, label: slot.name, metaLabel: `${slot.mp} MP` });
					}
				});
			}
			if (oppSlots.length === 1) {
				gameState._welloeForceActive.targetSlotId = oppSlots[0].id;
				console.log('[UI] Welloe Force: auto-selected only target', oppSlots[0].id);
			} else if (oppSlots.length > 1) {
				const targetId = await modal.showOptionSelect({
					title: 'Welloe Force — Redirect Damage',
					prompt: 'Choose a Mosje to redirect all incoming damage to (3 turns).',
					options: oppSlots,
					allowCancel: false,
				});
				gameState._welloeForceActive.targetSlotId = targetId;
				console.log('[UI] Welloe Force: redirect target set to', targetId);
			} else {
				// No opponent Mosjes on field — cancel the effect
				delete gameState._welloeForceActive;
				console.log('[UI] Welloe Force: no opponent targets, effect cancelled');
			}
		}

		// ── Call of the Welloes — pick Mosje from Welloe pile to summon ──────────
		if (gameState._callOfWelloesPending) {
			const { welloeOptions } = gameState._callOfWelloesPending;
			const options = (welloeOptions || []).map(w => ({
				id: w.cardId,
				label: w.name,
				// Summon always enters at 50 MP / Level 1 regardless of welloe record (D-05/D-06)
				metaLabel: `50 MP · Lvl 1`,
			}));
			const chosen = await modal.showOptionSelect({
				title: 'Call of the Welloes',
				prompt: 'Choose a Mosje from your Welloe pile to summon.',
				options,
				allowCancel: false,
			});
			delete gameState._callOfWelloesPending;
			if (!chosen) {
				// Player did not pick (modal cancelled or no options). The Piecie was already
				// moved to discard by activatePiecie, so state is consistent — just bail out.
				renderAndCheckWin();
				syncPush();
				return;
			}
			const { state: confirmedState } = confirmCallOfWelloes(gameState, localPlayerId, chosen);
			gameState = confirmedState;
		}
		if (gameState._callOfWelloesCancel) { delete gameState._callOfWelloesCancel; }

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
					{ id: '100', label: '100 MP' },
				],
				allowCancel: false,
			});
			const mpValue = Number(chosen);
			const slot = gameState.players[mpPlayerId].activeSlots[mpSlotIndex];
			const delta = mpValue - slot.mp;
			slot._mpAdjustDelta = delta;
			slot.mp = mpValue;
			delete gameState._mpAdjusterPending;
			console.log('[UI] MP Adjuster: set to', mpValue, 'MP (delta', delta, ', reverts next turn start)');
		}

		// ── Varkenspootjes — pick any active Mosje (own or opponent) ─────────────
		// Guard: if pending belongs to the bot (not local player), the bot should
		// have already resolved it in botDriver.js. Clear stale flag and skip.
		if (gameState._varkenspootjesPending && gameState._varkenspootjesPending.activatingPlayerId !== localPlayerId) {
			console.warn('[UI] Stale _varkenspootjesPending from bot — clearing without resolving');
			delete gameState._varkenspootjesPending;
		}
		if (gameState._varkenspootjesPending) {
			const { activatingPlayerId } = gameState._varkenspootjesPending;
			const allSlots = [];
			for (const [pid, player] of Object.entries(gameState.players)) {
				player.activeSlots.forEach((slot, idx) => {
					if (slot && !slot.isDefeated) {
						const isBinti = String(slot.cardId).startsWith('mosje_binti');
						const owner = pid === localPlayerId ? 'Your' : 'Opponent';
						allSlots.push({
							id: `${pid}_slot_${idx}`,
							label: `${slot.name} (${owner})`,
							metaLabel: isBinti ? '+60 MP 🍖' : '-30 MP',
						});
					}
				});
			}
			if (allSlots.length === 1) {
				const [pid, sidx] = allSlots[0].id.split('_slot_').map((v, i) => i === 1 ? Number(v) : v);
				const slot = gameState.players[pid].activeSlots[sidx];
				if (String(slot.cardId).startsWith('mosje_binti')) {
					slot.mp += 60;
					log.add('gain', `Varkenspootjes: Binti loves it! +60 MP.`);
				} else {
					slot.mp = Math.max(0, slot.mp - 30);
					log.add('loss', `Varkenspootjes: ${slot.name} hates the taste — -30 MP.`);
				}
			} else if (allSlots.length > 1) {
				const chosen = await modal.showOptionSelect({
					title: 'Varkenspootjes',
					prompt: 'Choose a Mosje to serve the dish to.',
					options: allSlots,
					allowCancel: false,
				});
				if (chosen) {
					const parts = chosen.split('_slot_');
					const targetPid = parts[0];
					const targetIdx = Number(parts[1]);
					const slot = gameState.players[targetPid].activeSlots[targetIdx];
					if (slot) {
						if (String(slot.cardId).startsWith('mosje_binti')) {
							slot.mp += 60;
							log.add('gain', `Varkenspootjes: Binti loves it! +60 MP.`);
						} else {
							slot.mp = Math.max(0, slot.mp - 30);
							log.add('loss', `Varkenspootjes: ${slot.name} hates the taste — -30 MP.`);
						}
					}
				}
			}
			delete gameState._varkenspootjesPending;
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
	}

	function handleActivatePlace(slotIndex) {
		if (!gameState || gameState.status === 'FINISHED') return;
		const beforeActivate = snapshotForAnimation();

		const slots = gameState.players[localPlayerId]?.piecieSlots;
		console.log(`[UI] handleActivatePlace: slotIndex=${slotIndex}`);
		console.log(`[UI] piecieSlots at place activation:`, Array.isArray(slots)
			? slots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | ')
			: String(slots));
		const { state: newState, success, error, cardDef } = activatePlace(gameState, localPlayerId, slotIndex);
		if (!success) {
			modal.showInfo('Cannot Activate', error || 'That Place cannot be activated right now.');
			return;
		}
		animateFieldActivation({
			zone: 'piecie',
			playerId: localPlayerId,
			slotIndex,
			cardId: slots?.[slotIndex]?.cardId,
			colorCategory: 'place',   // green — a Place is being activated
		});
		gameState = newState;

		const activatedName = cardDef?.name || 'Place';
		log.add('gain', `Activated ${activatedName}.`);
		if (cardDef?.description) log.add('info', cardDef.description);
		logStateOutcome(log, beforeActivate, gameState, localPlayerId, `${activatedName} activation`);
		syncPush();
		renderAndAnimate(beforeActivate, { actionLabel: 'activate-place' });
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

		// Targeting cards: show selector, then dispatch with resolved targets
		async function resolveTargetingCard(def, ref) {
			const beforePlay = snapshotForAnimation();
			const oppTargets = getOpponentMosjes(gameState, localPlayerId);
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);

			if (oppTargets.length === 0) {
				modal.showInfo('No Targets', 'No valid opponent targets.');
				return;
			}

			const drainId = await modal.showTargetSelector(
				oppTargets,
				'Choose an opponent Mosje to drain:'
			);
			if (!drainId) return;

			let gainId = null;
			if (ownTargets.length > 0) {
				gainId = await modal.showTargetSelector(
					ownTargets,
					'Choose your Mosje to receive MP:'
				);
			}

			// Store targets on state for the effect to read
			const stateWithTargets = JSON.parse(JSON.stringify(gameState));
			stateWithTargets._pendingTargets = {
				affoe_drain: drainId,
				affoe_gain: gainId,
			};

			const { state: newState, success, error } = playPiecie(stateWithTargets, localPlayerId, ref, def);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${def.name}.`);
			if (def.description) log.add('info', `Effect: ${def.description}`);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${def.name} activation`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforePlay, { actionLabel: 'play-piecie', placedCardId: def.id });
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
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
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
			gameState = newState;
			log.add('gain', `Played ${cardDef.name} (instant).`);
			if (resultLog) log.add(resultLog.type, resultLog.msg);
			if (cardDef.description) log.add('info', `Effect: ${cardDef.description}`);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} instant activation`);
			syncPush();
			renderAndAnimate(beforePlay, { actionLabel: 'play-snelle', placedCardId: cardDef.id });
			showInstantEffect('snelle');   // red burst — instant card
			return;
		}

		if (cardType === 'QUEST') {
			if (gameState.activePlayerId !== localPlayerId) {
				modal.showInfo('Not Your Turn', 'You can only place quests on your own turn.');
				return;
			}
			if (cardDef.questType !== 'PERSONAL') {
				modal.showInfo('Cannot Play', 'Only Personal Quests can be placed from your hand.');
				return;
			}

			const beforePlay = snapshotForAnimation();
			const { state: newState, success, error } = playPersonalQuest(gameState, localPlayerId, cardRef);
			if (!success) {
				modal.showInfo('Cannot Place', error || 'Cannot place this Quest right now.');
				return;
			}
			gameState = newState;
			log.add('quest', `Placed ${cardDef.name} face-down. Activate it next turn.`);
			syncPush();
			renderAndAnimate(beforePlay, { actionLabel: 'play-personal-quest', placedCardId: cardDef.id });
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
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderAndAnimate(beforePlay, { actionLabel: 'play-place', placedCardId: cardDef.id });
			// (Green burst fires on ACTIVATION — see handleActivatePlace — since a Place
			//  is played face-down and only renders as active once activated.)
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
		activePlaceTurns: gameState.activePlaceTurnsActive || 0,
		gameState,
		myPlayerId: localPlayerId,
		players: {
			top: {
				id: opponentId,
				name: opponent.name,
				mosjes: toMosjeCards(opponent.activeSlots),
				activeModifiers: buildActiveModifiers(gameState, opponentId, false),
				piecies: toPiecieCards(opponent.piecieSlots, {
					ownerId: opponentId,
					localPlayerId,
					turnNumber: gameState.turnNumber,
					isLocalTurn,
					viewerOwns: false,
				}),
				graveyard: opponent.graveyard || [],
			},
			bottom: {
				id: localPlayerId,
				name: localPlayer.name,
				mosjes: toMosjeCards(localPlayer.activeSlots),
				activeModifiers: buildActiveModifiers(gameState, localPlayerId, true),
				piecies: toPiecieCards(localPlayer.piecieSlots, {
					ownerId: localPlayerId,
					localPlayerId,
					turnNumber: gameState.turnNumber,
					isLocalTurn,
					viewerOwns: true,
				}),
				graveyard: localPlayer.graveyard || [],
			},
		},
	};
}

function buildActiveModifiers(gameState, playerId, isLocalPlayer = false) {
	const flags = gameState._snelleFlags || {};
	const player = gameState.players[playerId];
	const pills = [];

	// Quest dice bonuses — only show on the local player's zone (they're the ones questing)
	if (isLocalPlayer) {
		const questBonus = (flags.questDiceBonus || 0) + (player?.questPrepBonus || 0);
		if (questBonus > 0) pills.push({ label: `+${questBonus} Quest Roll`, color: 'gold' });
	}

	if (flags.forceReroll?.[playerId])         pills.push({ label: '🎲 Reroll Ready', color: 'gold' });
	if (flags.negateNextPiecie?.[playerId])     pills.push({ label: '🛡 Negate Piecie', color: 'blue' });
	if (flags.negateNextAttack?.[playerId])     pills.push({ label: '⚡ Dodge Active', color: 'teal' });
	if (flags.negateNextElimination?.[playerId]) pills.push({ label: '💀 Not Today!', color: 'blue' });
	if (flags.doubleNextPiecie?.[playerId])     pills.push({ label: '×2 Double Trigger', color: 'purple' });
	if (flags.negateNextSearch?.[playerId])     pills.push({ label: '🚫 Anti-Search', color: 'orange' });
	if (flags.drainReversal?.[playerId])        pills.push({ label: '↩ Drain Reflect', color: 'orange' });
	const mpRed = flags.mpLossReduction?.[playerId];
	if (Number.isInteger(mpRed) && mpRed > 0)  pills.push({ label: `🛡 -${mpRed} Damage`, color: 'blue' });

	// Laat me chillen! and Snelle Laat me chillen! store MP_LOSS_REDUCTION in the active Mosje's statusEffects
	if (player) {
		for (const slot of player.activeSlots) {
			if (!slot || slot.isDefeated) continue;
			const se = (slot.statusEffects || []).find(e => e.type === 'MP_LOSS_REDUCTION' && (e.turnsLeft ?? 1) > 0);
			if (se) { pills.push({ label: `🛡 -${se.value} Damage`, color: 'teal' }); break; }
		}
	}
	if (flags.copyLastPiecie?.forPlayer === playerId) pills.push({ label: '📋 Copy Ready', color: 'purple' });

	return pills;
}

function getSkiffaRerolls(gameState, playerId) {
	if (gameState?.activePlace !== 'place_skiffa') return 0;
	const activeMosje = gameState?.players?.[playerId]?.activeSlots?.find(s => s && !s.isDefeated);
	if (!activeMosje) return 0;
	const card = CARD_LOOKUP[activeMosje.cardId];
	if (card?.subtype !== 'ARTISTIC') return 0;
	const creative = Number(activeMosje?.traits?.creative || 0);
	return creative >= 3 ? 2 : 1;
}

function toMosjeCards(activeSlots) {
	return activeSlots
		.map((slot, slotIndex) => ({ slot, slotIndex }))
		.filter(({ slot }) => slot !== null)
		.map(({ slot, slotIndex }) => {
			const mosjeDef = MOSJES.find(m => m.id === slot.cardId);
			const cost = mosjeDef?.abilityCost ?? null;
			return {
				cardId: slot.cardId,
				slotIndex,
				name: slot.name,
				type: 'MOSJE',
				mp: slot.mp,
				level: slot.level,
				isDefeated: slot.isDefeated,
				traits: slot.traits ?? {},
				abilityUsedThisTurn: slot.abilityUsedThisTurn,
				abilityCost: cost,
				cantAffordAbility: cost != null && cost > 0 && slot.mp < cost,
				description: slot.isDefeated ? 'Defeated' : '',
				summonedByPiecie: slot.summonedByPiecie || null,
			};
		});
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
			const canActivateOnTurn = Number.isFinite(slot.canActivateOnTurn)
				? slot.canActivateOnTurn
				: ((Number.isFinite(slot.playedOnTurn) ? slot.playedOnTurn : turnNumber) + 1);
			const canActivateNow = canActivateForViewer && !slot.activated && turnNumber >= canActivateOnTurn;

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
	// Only Digital Control is available in starter selection (Phase 11+)
	return 'DIGITAL_CONTROL';
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

			if ((b.level || 0) !== (a.level || 0)) {
				const beforeLevel = (b.level || 0) + 1;
				const afterLevel = (a.level || 0) + 1;
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
		// with integer keys. Re-hydrate to a proper 4-element array before any engine
		// function touches it, so no cards are silently lost from the field.
		if (player.piecieSlots && !Array.isArray(player.piecieSlots)) {
			player.piecieSlots = Array.from({ length: 4 }, (_, i) => player.piecieSlots[i] ?? null);
		} else if (!player.piecieSlots) {
			player.piecieSlots = [null, null, null, null];
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
		if (!Array.isArray(state.sharedGeneralQuestDiscard)) state.sharedGeneralQuestDiscard = [];
		state.sharedGeneralQuestDiscard.unshift(...movedToSharedDiscard);
		console.log(`[UI] Sanitized ${movedToSharedDiscard.length} legacy GENERAL quest card(s) from player zones`);
	}

	return { state, changed };
}
