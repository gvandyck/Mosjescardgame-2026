// main.js — Entry point for the app.
// Detects the current page and starts the matching UI flow.

import { renderBoard, showPlaceEffectBanner } from './ui/boardRenderer.js';
import { createLogRenderer } from './ui/logRenderer.js';
import { renderHand } from './ui/handRenderer.js';
import { initModalManager } from './ui/modalManager.js';
import { createInitialGameState, getOpponentMosjes, getPlayerMosjes } from './engine/gameState.js';
import { startTurn, endTurn, attemptGeneralQuest, attemptPersonalQuest, playPiecie, activatePiecie, playSnellie, playPlace, playMosje, useMosjeAbility, canPlayerActNow } from './engine/turnManager.js';
import { resolveQuest, canAttemptGeneralQuest, canAttemptPersonalQuest, getQuestDiceThreshold } from './abilities/questLogic.js';
import { MOSJES } from './data/mosjes.js';
import { PIECIES } from './data/piecies.js';
import { SNELLE_PIECIES } from './data/snellePiecies.js';
import { PLACES } from './data/places.js';
import { QUESTS } from './data/quests.js';
import { createRoom, joinRoom } from './multiplayer/roomManager.js';
import { pushState, listenToState, stopListening } from './multiplayer/syncManager.js';
import { eventBus } from './multiplayer/eventBus.js';
import { APP_VERSION } from './version.js';

console.log('[UI] App bootstrapping...');

const CARD_LOOKUP = buildCardLookup();

const path = window.location.pathname.toLowerCase();

if (path.endsWith('/index.html') || path.endsWith('/')) {
	initLobbyPage();
}

if (path.endsWith('/game.html')) {
	initGamePage();
}

function initLobbyPage() {
	console.log('[UI] Initializing lobby page');
	setVersionLabel();
	const form = document.getElementById('lobby-form');
	if (!form) return;

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

		if (mode === 'join' && roomCodeInput.length !== 4) {
			window.alert('Please enter a 4-digit room code to join.');
			return;
		}

		const submitBtn = form.querySelector('button[type="submit"]');
		if (submitBtn) submitBtn.disabled = true;

		if (mode === 'create') {
			const result = await createRoom(name, deckId);
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
			const result = await joinRoom(roomCodeInput, name, deckId);
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
			}));
			console.log('[UI] Joined room:', roomCodeInput);
			window.location.href = `./game.html?room=${encodeURIComponent(roomCodeInput)}&player=player_2`;
		}
	});
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
			logPopover.hidden = !open;
			logToggleBtn.setAttribute('aria-expanded', String(open));
			logToggleBtn.classList.toggle('is-open', open);
		};

		setLogOpen(false);

		logToggleBtn.addEventListener('click', () => {
			const isOpen = !logPopover.hidden;
			setLogOpen(!isOpen);
		});

		document.addEventListener('click', (event) => {
			if (logPopover.hidden) return;
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (logPopover.contains(target) || logToggleBtn.contains(target)) return;
			setLogOpen(false);
		});

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && !logPopover.hidden) setLogOpen(false);
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

	const localPlayerName = lobbyData.name || 'Player 1';
	const localDeckId = lobbyData.deckId || 'DIGITAL_CONTROL';
	const opponentName = lobbyData.opponentName || 'Opponent';
	const opponentDeckId = lobbyData.opponentDeckId || pickOpponentDeck(localDeckId);

	const isOnline = roomCode !== 'LOCAL';

	let gameState = null;

	// ── Sync helpers ──────────────────────────────────────────────────────
	function syncPush() {
		if (isOnline && gameState) pushState(roomCode, gameState);
	}

	// ── Shared remote-state handler — registered after game init ─────────
	function onRemoteState(remoteState) {
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
			stopListening();
			const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
			log.add('win', `${winnerName} won by ${gameState.winReason}.`);
			modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
		}
	}

	// ── Initialize game ──────────────────────────────────────────────────
	function startGame(p1Name, p1Deck, p2Name, p2Deck) {
		const players = [
			{ playerId: 'player_1', name: p1Name, deckId: p1Deck },
			{ playerId: 'player_2', name: p2Name, deckId: p2Deck },
		];
		gameState = createInitialGameState(players, roomCode);
		gameState = startTurn(gameState);
		renderFromState(gameState);
		log.add('quest', `${localPlayerName} entered room ${roomCode}.`);
		log.add('gain', `Turn ${gameState.turnNumber} started for ${gameState.players[gameState.activePlayerId].name}.`);
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
				log.add('gain', `${p2Data.name} joined the room!`);
				startGame(localPlayerName, localDeckId, p2Data.name, p2Data.deckId || pickOpponentDeck(localDeckId));
			});
		} else {
			// LOCAL mode — start immediately
			startGame(localPlayerName, localDeckId, opponentName, opponentDeckId);
		}
	} else {
		// player_2: wait for player_1 to push initial state via onSnapshot
		if (turnLabel) turnLabel.textContent = 'Connecting to game...';
		log.add('quest', `Joining room ${roomCode} as ${localPlayerName}...`);
		listenToState(roomCode, localPlayerId);
		// First remote state initialises the game for player_2, then ongoing handler takes over
		eventBus.once('mp:remote-state', initialState => {
			const { state: sanitizedState, changed } = sanitizeQuestCardsInPlayerZones(initialState);
			gameState = sanitizedState;
			renderFromState(gameState);
			if (changed && isOnline && localPlayerId === 'player_1') {
				syncPush();
			}
			log.add('gain', `Game started! Waiting for opponent's first turn.`);
			eventBus.on('mp:remote-state', onRemoteState);
		});
		// For LOCAL testing as player_2, fall back to starting immediately
		if (!isOnline) {
			startGame(opponentName, opponentDeckId, localPlayerName, localDeckId);
		}
	}

	// Stop Firestore listener on page unload
	window.addEventListener('beforeunload', stopListening);

	document.getElementById('btn-end-turn')?.addEventListener('click', () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'Wait for your opponent to end their turn.');
			return;
		}
		const previousPlayerName = gameState.players[gameState.activePlayerId].name;
		gameState = endTurn(gameState);
		if (gameState.status !== 'FINISHED') {
			gameState = startTurn(gameState);
		}

		renderFromState(gameState);
		syncPush();
		log.add('quest', `${previousPlayerName} ended their turn.`);

		if (gameState.status === 'FINISHED') {
			stopListening();
			const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
			log.add('win', `${winnerName} won by ${gameState.winReason}.`);
			modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			return;
		}

		const activeName = gameState.players[gameState.activePlayerId].name;
		log.add('gain', `Now active: ${activeName}. Turn ${gameState.turnNumber}.`);
	});

	document.getElementById('btn-general-quest')?.addEventListener('click', () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'You can only attempt quests on your own turn.');
			return;
		}
		if (gameState.players[localPlayerId].hasAttemptedQuestThisTurn) {
			modal.showInfo('Already Attempted', 'You have already attempted a quest this turn.');
			return;
		}

		const { state: newState, questCard: questRef } = attemptGeneralQuest(gameState);
		gameState = newState;


		if (!questRef) {
			log.add('quest', 'General Quest deck is empty!');
			renderFromState(gameState);
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
			log.add('quest', `Cannot attempt ${questDef.name} — active Mosje has negative MP.`);
			gameState.sharedGeneralQuestDiscard.push(questRef);
			renderFromState(gameState);
			return;
		}

		const threshold = getQuestDiceThreshold(questDef, activeMosje);
		log.add('quest', `${localPlayerName} is attempting General Quest: ${questDef.name}`);
		if (questDef.description) log.add('info', `Effect: ${questDef.description}`);

		const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
		const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
		const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
		const skiffaRerolls = getSkiffaRerolls(gameState, localPlayerId);
		const forceReroll = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;
		// Consume the flags before showing the modal
		if (diceBonus) delete gameState._snelleFlags.questDiceBonus;
		if (questPrepBonus) gameState.players[localPlayerId].questPrepBonus = 0;
		if (forceReroll) delete gameState._snelleFlags.forceReroll[localPlayerId];

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
		renderFromState(gameState);
		syncPush();

		const gqSlots = gameState.players[localPlayerId].activeSlots
			.map((slot, index) => ({ slot, index }))
			.filter(({ slot }) => slot && !slot.isDefeated)
			.map(({ slot, index }) => ({ slotIndex: index, name: slot.cardId || 'Mosje', mp: slot.mp }));

		function runGeneralQuestDiceRoll(targetSlotIndex) {
			modal.showDiceRoll(questDef, threshold, (didSucceed) => {
				const beforeResolve = gameState;
				gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed, targetSlotIndex);
				gameState.activeQuest = null;
				if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) {
					gameState.sharedGeneralQuestDiscard = [];
				}
				gameState.sharedGeneralQuestDiscard.push(questRef);
				renderFromState(gameState);
				syncPush();

				const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
				const sign = mpDelta >= 0 ? '+' : '';
				log.add(didSucceed ? 'gain' : 'loss',
					`${questDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`
				);
				logStateOutcome(log, beforeResolve, gameState, localPlayerId, `${questDef.name} resolution`);
			}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus, forceReroll, skiffaRerolls });
		}

		if (gqSlots.length > 1) {
			modal.showMosjeSelect(gqSlots, runGeneralQuestDiceRoll);
		} else {
			runGeneralQuestDiceRoll(gqSlots[0]?.slotIndex ?? 0);
		}
	});

	document.getElementById('btn-personal-quest')?.addEventListener('click', () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'You can only attempt quests on your own turn.');
			return;
		}
		if (gameState.players[localPlayerId].hasAttemptedQuestThisTurn) {
			modal.showInfo('Already Attempted', 'You have already attempted a quest this turn.');
			return;
		}

		const personalQuestsInHand = gameState.players[localPlayerId].hand.filter(
			c => CARD_LOOKUP[c.cardId]?.questType === 'PERSONAL'
		);

		if (personalQuestsInHand.length === 0) {
			modal.showInfo('No Personal Quests', 'You have no Personal Quest cards in your hand.');
			return;
		}

		// Use the first personal quest found (pick UI can be a future enhancement)
		const handCard = personalQuestsInHand[0];
		const questDef = CARD_LOOKUP[handCard.cardId];

		if (!canAttemptPersonalQuest(questDef, gameState, localPlayerId)) {
			modal.showInfo(
				'Required Mosje Missing',
				`${questDef.name} requires ${questDef.requiredMosjeId} on the field.`
			);
			return;
		}

		const { state: newState, questCard: playedCard } = attemptPersonalQuest(gameState, handCard.cardId);
		gameState = newState;

		const activeMosje = gameState.players[localPlayerId].activeSlots.find(s => s && !s.isDefeated);
		const threshold = getQuestDiceThreshold(questDef, activeMosje);
		log.add('quest', `${localPlayerName} is attempting Personal Quest: ${questDef.name}`);
		if (questDef.description) log.add('info', `Effect: ${questDef.description}`);

		const diceBonus2 = gameState._snelleFlags?.questDiceBonus || 0;
		const questPrepBonus2 = gameState.players[localPlayerId]?.questPrepBonus || 0;
		const placeDiceBonus2 = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
		const skiffaRerolls2 = getSkiffaRerolls(gameState, localPlayerId);
		const forceReroll2 = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;
		if (diceBonus2) delete gameState._snelleFlags.questDiceBonus;
		if (questPrepBonus2) gameState.players[localPlayerId].questPrepBonus = 0;
		if (forceReroll2) delete gameState._snelleFlags.forceReroll[localPlayerId];

		// Phase 8 Rule 3: broadcast active quest so opponent can see it
		gameState.activeQuest = {
			questName: questDef.name,
			cardName: questDef.name,
			questType: questDef.questType || 'PERSONAL',
			attacker: localPlayerId,
			successMP: questDef.successMP,
			failMP: questDef.failMP,
			currentMp: activeMosje?.mp ?? null,
		};
		renderFromState(gameState);
		syncPush();

		const pqSlots = gameState.players[localPlayerId].activeSlots
			.map((slot, index) => ({ slot, index }))
			.filter(({ slot }) => slot && !slot.isDefeated)
			.map(({ slot, index }) => ({ slotIndex: index, name: slot.cardId || 'Mosje', mp: slot.mp }));

		function runPersonalQuestDiceRoll(targetSlotIndex) {
			modal.showDiceRoll(questDef, threshold, (didSucceed) => {
				const beforeResolve = gameState;
				gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed, targetSlotIndex);
				gameState.activeQuest = null;
				renderFromState(gameState);
				syncPush();

				const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
				const sign = mpDelta >= 0 ? '+' : '';
				log.add(didSucceed ? 'gain' : 'loss',
					`${questDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`
				);
				logStateOutcome(log, beforeResolve, gameState, localPlayerId, `${questDef.name} resolution`);
			}, { diceBonus: diceBonus2 + questPrepBonus2 + placeDiceBonus2, forceReroll: forceReroll2, skiffaRerolls: skiffaRerolls2 });
		}

		if (pqSlots.length > 1) {
			modal.showMosjeSelect(pqSlots, runPersonalQuestDiceRoll);
		} else {
			runPersonalQuestDiceRoll(pqSlots[0]?.slotIndex ?? 0);
		}
	});

	function renderFromState(state) {
		const uiState = toBoardViewModel(state, localPlayerId);

		const isLocalTurn = state.activePlayerId === localPlayerId;
		const alreadyAttempted = state.players[localPlayerId].hasAttemptedQuestThisTurn;
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
		renderBoard(boardRoot, uiState, onUseAbility, null, onActivatePiecie);
		if (state._lastPlaceEffect?.placeName) {
			showPlaceEffectBanner(state._lastPlaceEffect.placeName, state._lastPlaceEffect.description, state._lastPlaceEffect.phase);
			delete state._lastPlaceEffect;
		}

		const questBtnsEnabled = isLocalTurn && !alreadyAttempted && !gameOver;
		const phaseLabel = gameOver
			? 'Game Over'
			: isLocalTurn
				? (alreadyAttempted ? 'MAIN Phase' : 'MAIN / QUEST Phase')
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

		const btnGeneral = document.getElementById('btn-general-quest');
		const btnPersonal = document.getElementById('btn-personal-quest');
		const btnEndTurn = document.getElementById('btn-end-turn');

		if (btnGeneral) btnGeneral.disabled = !questBtnsEnabled;
		if (btnPersonal) btnPersonal.disabled = !questBtnsEnabled;
		if (btnEndTurn) btnEndTurn.disabled = !isLocalTurn || gameOver;
	}

	function handleUseAbility(mosjeId) {
		if (!gameState || gameState.status === 'FINISHED') return;

		const beforeAbility = gameState;
		const { state: newState, success, error } = useMosjeAbility(gameState, localPlayerId, mosjeId);
		if (!success) {
			modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
			return;
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
		renderFromState(gameState);
	}

	async function handleActivatePiecie(slotIndex) {
		if (!gameState || gameState.status === 'FINISHED') return;
		const beforeActivate = gameState;

		const piecieSlot = gameState.players[localPlayerId]?.piecieSlots?.[slotIndex];
		const piecieCardDef = piecieSlot?.cardId ? CARD_LOOKUP[piecieSlot.cardId] : null;

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
		}

		const { state: newState, success, error, cardDef, negated } = activatePiecie(stateForActivation, localPlayerId, slotIndex);
		if (!success) {
			modal.showInfo('Cannot Activate', error || 'That Piecie cannot be activated right now.');
			return;
		}
		gameState = newState;

		const activatedName = cardDef?.name || 'Piecie';
		if (negated) {
			log.add('loss', `Activated ${activatedName}, but it was negated.`);
		} else {
			log.add('gain', `Activated ${activatedName}.`);
			if (cardDef?.description) log.add('info', cardDef.description);
		}
		logStateOutcome(log, beforeActivate, gameState, localPlayerId, `${activatedName} activation`);
		syncPush();
		renderFromState(gameState);
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
			const beforePlay = gameState;
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
			renderFromState(gameState);
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
			const beforePlay = gameState;
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
			renderFromState(gameState);
			return;
		}

		if (cardType === 'MOSJE') {
			const beforePlay = gameState;
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
			renderFromState(gameState);
			return;
		}

		if (cardType === 'SNELLE_PIECIE') {
			const beforePlay = gameState;
			let snelleStateForPlay = gameState;
			if (cardDef.effectId === 'effect_snelle_jensen') {
				const ownTargets = getPlayerMosjes(gameState, localPlayerId);
				if (ownTargets.length > 1) {
					const selectedState = await resolveOwnMosjeTarget('Choose your Mosje to receive Jensen MP:');
					if (!selectedState) return;
					snelleStateForPlay = selectedState;
				}
			} else if (cardDef.effectId === 'effect_snelle_lucky_coin') {
				const isHeads = Math.random() < 0.5;
				snelleStateForPlay = JSON.parse(JSON.stringify(gameState));
				if (!snelleStateForPlay._pendingTargets) snelleStateForPlay._pendingTargets = {};
				if (isHeads) {
					snelleStateForPlay._pendingTargets.lucky_coin_result = 'heads';
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
				}
			}

			const { state: newState, success, error } = playSnellie(snelleStateForPlay, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${cardDef.name} (instant).`);
			if (cardDef.description) log.add('info', `Effect: ${cardDef.description}`);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} instant activation`);
			syncPush();
			renderFromState(gameState);
			return;
		}

		if (cardType === 'QUEST') {
			if (gameState.activePlayerId !== localPlayerId) {
				modal.showInfo('Not Your Turn', 'You can only attempt quests on your own turn.');
				return;
			}
			if (gameState.players[localPlayerId].hasAttemptedQuestThisTurn) {
				modal.showInfo('Already Attempted', 'You have already attempted a quest this turn.');
				return;
			}
			if (cardDef.questType !== 'PERSONAL') {
				modal.showInfo('Cannot Play', 'Only Personal Quests can be played from your hand.');
				return;
			}
			if (!canAttemptPersonalQuest(cardDef, gameState, localPlayerId)) {
				modal.showInfo(
					'Required Mosje Missing',
					`${cardDef.name} requirements are not met right now.`
				);
				return;
			}

			const { state: newState, questCard: playedCard } = attemptPersonalQuest(gameState, cardRef.cardId);
			gameState = newState;

			const activeMosje = gameState.players[localPlayerId].activeSlots.find(s => s && !s.isDefeated);
			const threshold = getQuestDiceThreshold(cardDef, activeMosje);
			log.add('quest', `${localPlayerName} is attempting Personal Quest: ${cardDef.name}`);

			const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
			const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
			const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
			const skiffaRerolls = getSkiffaRerolls(gameState, localPlayerId);
			const forceReroll = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;
			if (diceBonus) delete gameState._snelleFlags.questDiceBonus;
			if (questPrepBonus) gameState.players[localPlayerId].questPrepBonus = 0;
			if (forceReroll) delete gameState._snelleFlags.forceReroll[localPlayerId];

			gameState.activeQuest = {
				questName: cardDef.name,
				cardName: cardDef.name,
				questType: cardDef.questType || 'PERSONAL',
				attacker: localPlayerId,
				successMP: cardDef.successMP,
				failMP: cardDef.failMP,
				currentMp: activeMosje?.mp ?? null,
			};
			renderFromState(gameState);
			syncPush();

			const handQuestSlots = gameState.players[localPlayerId].activeSlots
				.map((slot, index) => ({ slot, index }))
				.filter(({ slot }) => slot && !slot.isDefeated)
				.map(({ slot, index }) => ({ slotIndex: index, name: slot.cardId || 'Mosje', mp: slot.mp }));

			function runHandQuestDiceRoll(targetSlotIndex) {
				modal.showDiceRoll(cardDef, threshold, (didSucceed) => {
					gameState = resolveQuest(gameState, localPlayerId, cardDef, didSucceed, targetSlotIndex);
					gameState.activeQuest = null;
					renderFromState(gameState);
					syncPush();

					const mpDelta = didSucceed ? cardDef.successMP : cardDef.failMP;
					const sign = mpDelta >= 0 ? '+' : '';
					log.add(didSucceed ? 'gain' : 'loss',
						`${cardDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`
					);
				}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus, forceReroll, skiffaRerolls });
			}

			if (handQuestSlots.length > 1) {
				modal.showMosjeSelect(handQuestSlots, runHandQuestDiceRoll);
			} else {
				runHandQuestDiceRoll(handQuestSlots[0]?.slotIndex ?? 0);
			}
			return;
		}

		if (cardType === 'PLACE') {
			const beforePlay = gameState;
			const currentPlaceName = gameState.activePlace
				? (PLACES.find(p => p.id === gameState.activePlace)?.name || gameState.activePlace)
				: null;
			const replaceWarning = currentPlaceName ? ` This will replace "${currentPlaceName}".` : '';
			const confirmed = await modal.showConfirm(
				'Play Place Card',
				`Play "${cardDef.name}" as the active Place?${replaceWarning}`
			);
			if (!confirmed) return;

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
			renderFromState(gameState);
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

	return {
		activePlayerName: gameState.players[gameState.activePlayerId].name,
		turnPhase: 'DRAW',
		activePlaceName: gameState.activePlace
			? (PLACES.find(p => p.id === gameState.activePlace)?.name || gameState.activePlace)
			: 'None',
		activeQuest: gameState.activeQuest ?? null,
		activePlaceTurns: gameState.activePlaceTurnsActive || 0,
		gameState,
		myPlayerId: localPlayerId,
		players: {
			top: {
				name: opponent.name,
				mosjes: toMosjeCards(opponent.activeSlots),
				piecies: toPiecieCards(opponent.piecieSlots, {
					ownerId: opponentId,
					localPlayerId,
					turnNumber: gameState.turnNumber,
					isLocalTurn,
					viewerOwns: false,
				}),
			},
			bottom: {
				name: localPlayer.name,
				mosjes: toMosjeCards(localPlayer.activeSlots),
				piecies: toPiecieCards(localPlayer.piecieSlots, {
					ownerId: localPlayerId,
					localPlayerId,
					turnNumber: gameState.turnNumber,
					isLocalTurn,
					viewerOwns: true,
				}),
			},
		},
	};
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
		.filter(slot => slot !== null)
		.map(slot => ({
			cardId: slot.cardId,
			name: slot.name,
			type: 'MOSJE',
			mp: slot.mp,
			level: slot.level,
			isDefeated: slot.isDefeated,
			abilityUsedThisTurn: slot.abilityUsedThisTurn,
			description: slot.isDefeated ? 'Defeated' : 'Active on field',
		}));
}

function toPiecieCards(piecieSlots, options = {}) {
	if (!Array.isArray(piecieSlots)) return [];
	const {
		ownerId = null,
		localPlayerId = null,
		turnNumber = 1,
		isLocalTurn = false,
		viewerOwns = false,
	} = options;
	const canActivateForViewer = viewerOwns && ownerId === localPlayerId && isLocalTurn;

	return piecieSlots
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
			};
		});
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
	if (localDeckId === 'PHYSICAL_FORCE') return 'ARTISTIC_RHYTHM';
	if (localDeckId === 'ARTISTIC_RHYTHM') return 'DIGITAL_CONTROL';
	return 'PHYSICAL_FORCE';
}

function logStateOutcome(log, beforeState, afterState, actorId, label = 'Action') {
	const lines = summarizeStateOutcome(beforeState, afterState, actorId);
	if (!lines.length) {
		log.add('info', `${label}: no visible stat changes.`);
		return;
	}
	log.add('info', `${label}:`);
	for (const line of lines.slice(0, 6)) {
		log.add('info', `- ${line}`);
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
