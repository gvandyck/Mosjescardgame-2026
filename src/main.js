// main.js — Entry point for the app.
// Detects the current page and starts the matching UI flow.

import { renderBoard } from './ui/boardRenderer.js';
import { createLogRenderer } from './ui/logRenderer.js';
import { renderHand } from './ui/handRenderer.js';
import { initModalManager } from './ui/modalManager.js';
import { createInitialGameState } from './engine/gameState.js';
import { startTurn, endTurn } from './engine/turnManager.js';
import { MOSJES } from './data/mosjes.js';
import { PIECIES } from './data/piecies.js';
import { SNELLE_PIECIES } from './data/snellePiecies.js';
import { PLACES } from './data/places.js';
import { QUESTS } from './data/quests.js';

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

	form.addEventListener('submit', event => {
		event.preventDefault();
		const name = String(document.getElementById('player-name')?.value || '').trim();
		const deckId = String(document.getElementById('deck-select')?.value || 'DIGITAL_CONTROL');
		const mode = String(document.querySelector('input[name="lobby-mode"]:checked')?.value || 'create');
		const roomCode = String(document.getElementById('room-code')?.value || '').trim();

		if (!name) {
			window.alert('Please enter your player name.');
			return;
		}

		if (mode === 'join' && roomCode.length !== 4) {
			window.alert('Please enter a 4-digit room code to join.');
			return;
		}

		sessionStorage.setItem(
			'mosjes:lobby',
			JSON.stringify({ name, deckId, mode, roomCode })
		);
		console.log('[UI] Lobby selection saved:', { name, deckId, mode, roomCode });
		window.location.href = './game.html';
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

	const lobbyData = readLobbyData();
	const log = createLogRenderer(logRoot);
	const modal = initModalManager(modalRoot);

	const localPlayerName = lobbyData.name || 'Player 1';
	const localDeckId = lobbyData.deckId || 'DIGITAL_CONTROL';
	const opponentDeckId = pickOpponentDeck(localDeckId);

	let gameState = createInitialGameState(
		[
			{ playerId: 'player_1', name: localPlayerName, deckId: localDeckId },
			{ playerId: 'player_2', name: 'Opponent', deckId: opponentDeckId },
		],
		lobbyData.roomCode || 'LOCAL'
	);

	gameState = startTurn(gameState);
	renderFromState(gameState);

	log.add('quest', `${localPlayerName} entered room ${gameState.roomCode}.`);
	log.add('gain', `Turn ${gameState.turnNumber} started for ${gameState.players[gameState.activePlayerId].name}.`);

	document.getElementById('btn-end-turn')?.addEventListener('click', () => {
		const previousPlayerName = gameState.players[gameState.activePlayerId].name;
		gameState = endTurn(gameState);
		if (gameState.status !== 'FINISHED') {
			gameState = startTurn(gameState);
		}

		renderFromState(gameState);
		log.add('quest', `${previousPlayerName} ended their turn.`);

		if (gameState.status === 'FINISHED') {
			const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
			log.add('win', `${winnerName} won by ${gameState.winReason}.`);
			modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			return;
		}

		const activeName = gameState.players[gameState.activePlayerId].name;
		log.add('gain', `Now active: ${activeName}. Turn ${gameState.turnNumber}.`);
	});

	function renderFromState(state) {
		const uiState = toBoardViewModel(state, 'player_1');
		renderBoard(boardRoot, uiState);
		renderHand(handRoot, toHandViewModel(state.players.player_1.hand));

		if (turnLabel) {
			turnLabel.textContent = `${uiState.activePlayerName} • DRAW Phase`;
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
		activePlaceName: gameState.activePlace?.name || 'None',
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
			name: slot.name,
			type: 'MOSJE',
			mp: slot.mp,
			level: slot.level,
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
