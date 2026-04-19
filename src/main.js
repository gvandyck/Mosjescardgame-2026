// main.js — Entry point for the app.
// Detects the current page and starts the matching UI flow.

import { renderBoard } from './ui/boardRenderer.js';
import { createLogRenderer } from './ui/logRenderer.js';
import { renderHand } from './ui/handRenderer.js';
import { initModalManager } from './ui/modalManager.js';
import { createInitialGameState, getOpponentMosjes, getPlayerMosjes } from './engine/gameState.js';
import { startTurn, endTurn, attemptGeneralQuest, attemptPersonalQuest, playPiecie, playSnellie, playPlace, useMosjeAbility, canPlayerActNow, applyPlaceEffectsOnQuest } from './engine/turnManager.js';
import { resolveQuest, canAttemptGeneralQuest, canAttemptPersonalQuest, getQuestDiceThreshold } from './abilities/questLogic.js';
import { MOSJES } from './data/mosjes.js';
import { PIECIES } from './data/piecies.js';
import { SNELLE_PIECIES } from './data/snellePiecies.js';
import { PLACES } from './data/places.js';
import { QUESTS } from './data/quests.js';
import { createRoom, joinRoom } from './multiplayer/roomManager.js';
import { pushState, listenToState, stopListening } from './multiplayer/syncManager.js';
import { eventBus } from './multiplayer/eventBus.js';

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

	const boardRoot = document.getElementById('board-root');
	const handRoot = document.getElementById('hand-root');
	const logRoot = document.getElementById('log-root');
	const modalRoot = document.getElementById('modal-root');
	const turnLabel = document.getElementById('turn-label');

	if (!boardRoot || !handRoot || !logRoot || !modalRoot) {
		console.log('[UI] Game containers missing — page not fully ready');
		return;
	}

	const urlParams = new URLSearchParams(window.location.search);
	const lobbyData = readLobbyData();
	const log = createLogRenderer(logRoot);
	const modal = initModalManager(modalRoot);

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
		gameState = remoteState;
		renderFromState(gameState);
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
			gameState = initialState;
			renderFromState(gameState);
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

		const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
		const forceReroll = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;
		// Consume the flags before showing the modal
		if (diceBonus) delete gameState._snelleFlags.questDiceBonus;
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

		modal.showDiceRoll(questDef, threshold, (didSucceed) => {
			gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed);
			gameState = applyPlaceEffectsOnQuest(gameState, localPlayerId, questDef, didSucceed);
			gameState.activeQuest = null;
			gameState.sharedGeneralQuestDiscard.push(questRef);
			renderFromState(gameState);
			syncPush();

			const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
			const sign = mpDelta >= 0 ? '+' : '';
			log.add(didSucceed ? 'gain' : 'loss',
				`${questDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`
			);
		}, { diceBonus, forceReroll });
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

		const diceBonus2 = gameState._snelleFlags?.questDiceBonus || 0;
		const forceReroll2 = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;
		if (diceBonus2) delete gameState._snelleFlags.questDiceBonus;
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

		modal.showDiceRoll(questDef, threshold, (didSucceed) => {
			gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed);
			gameState = applyPlaceEffectsOnQuest(gameState, localPlayerId, questDef, didSucceed);
			gameState.activeQuest = null;
			renderFromState(gameState);
			syncPush();

			const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
			const sign = mpDelta >= 0 ? '+' : '';
			log.add(didSucceed ? 'gain' : 'loss',
				`${questDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`
			);
		}, { diceBonus: diceBonus2, forceReroll: forceReroll2 });
	});

	function renderFromState(state) {
		const uiState = toBoardViewModel(state, localPlayerId);

		const isLocalTurn = state.activePlayerId === localPlayerId;
		const alreadyAttempted = state.players[localPlayerId].hasAttemptedQuestThisTurn;
		const gameOver = state.status === 'FINISHED';

		// Regular cards only on local turn; Snelle Piecies always available
		// Pass onPlay always so Snelle Piecies show their interrupt button
		const onPlay = !gameOver ? handlePlayCard : null;
		renderHand(handRoot, toHandViewModel(state.players[localPlayerId].hand), onPlay, isLocalTurn);

		const onUseAbility = (isLocalTurn && !gameOver) ? handleUseAbility : null;
		renderBoard(boardRoot, uiState, onUseAbility);

		const questBtnsEnabled = isLocalTurn && !alreadyAttempted && !gameOver;
		const phaseLabel = gameOver
			? 'Game Over'
			: isLocalTurn
				? (alreadyAttempted ? 'MAIN Phase' : 'MAIN / QUEST Phase')
				: `${uiState.activePlayerName}'s Turn`;

		if (turnLabel) {
			turnLabel.textContent = `${isLocalTurn ? 'You' : uiState.activePlayerName} • ${phaseLabel}`;
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

		const { state: newState, success, error } = useMosjeAbility(gameState, localPlayerId, mosjeId);
		if (!success) {
			modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
			return;
		}
		gameState = newState;

		const slot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
		log.add('gain', `Used ability: ${slot?.name || mosjeId}.`);
		syncPush();

		if (gameState.status === 'FINISHED') {
			stopListening();
			const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
			log.add('win', `${winnerName} won by ${gameState.winReason}.`);
			modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
		}
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
			// Cards that require explicit target selection before dispatch
			if (cardDef.tags?.includes('TARGETING')) {
				await resolveTargetingCard(cardDef, cardRef);
				return;
			}

			let piecieStateForPlay = gameState;
			if (cardDef.effectId === 'effect_kannetje_melk') {
				const ownTargets = getPlayerMosjes(gameState, localPlayerId);
				if (ownTargets.length > 1) {
					const selectedState = await resolveOwnMosjeTarget('Choose your Mosje to receive Kannetje Melk MP:');
					if (!selectedState) return;
					piecieStateForPlay = selectedState;
				}
			}

			const { state: newState, success, error } = playPiecie(piecieStateForPlay, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${cardDef.name}.`);
			if (cardDef.description) log.add('info', cardDef.description);
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

		if (cardType === 'SNELLE_PIECIE') {
			let snelleStateForPlay = gameState;
			if (cardDef.effectId === 'effect_snelle_jensen') {
				const ownTargets = getPlayerMosjes(gameState, localPlayerId);
				if (ownTargets.length > 1) {
					const selectedState = await resolveOwnMosjeTarget('Choose your Mosje to receive Jensen MP:');
					if (!selectedState) return;
					snelleStateForPlay = selectedState;
				}
			}

			const { state: newState, success, error } = playSnellie(snelleStateForPlay, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${cardDef.name} (instant).`);
			syncPush();
			renderFromState(gameState);
			return;
		}

		if (cardType === 'PLACE') {
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

	return {
		activePlayerName: gameState.players[gameState.activePlayerId].name,
		turnPhase: 'DRAW',
		activePlaceName: gameState.activePlace
			? (PLACES.find(p => p.id === gameState.activePlace)?.name || gameState.activePlace)
			: 'None',
		activeQuest: gameState.activeQuest ?? null,
		myPlayerId: localPlayerId,
		players: {
			top: {
				name: opponent.name,
				mosjes: toMosjeCards(opponent.activeSlots),
			},
			bottom: {
				name: localPlayer.name,
				mosjes: toMosjeCards(localPlayer.activeSlots),
			},
		},
	};
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
