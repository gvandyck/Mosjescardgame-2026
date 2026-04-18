// main.js — Entry point for the app.
// Detects the current page and starts the matching UI flow.

import { renderBoard } from './ui/boardRenderer.js';
import { createLogRenderer } from './ui/logRenderer.js';
import { renderHand } from './ui/handRenderer.js';
import { initModalManager } from './ui/modalManager.js';

console.log('[UI] App bootstrapping...');

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

	const uiState = {
		activePlayerName: lobbyData.name || 'Player 1',
		turnPhase: 'DRAW',
		activePlaceName: 'Quest Haven',
		players: {
			top: {
				name: 'Opponent',
				mosjes: [
					{ name: '[Jeffrey] The Strongman', type: 'MOSJE', mp: 20, level: 1 },
					{ name: '[Michelle] Iron Tuk', type: 'MOSJE', mp: 0, level: 0 },
				],
			},
			bottom: {
				name: lobbyData.name || 'You',
				mosjes: [
					{ name: '[West] Sr.Tactical', type: 'MOSJE', mp: 15, level: 1 },
					{ name: '[Coert] The Tech Savant', type: 'MOSJE', mp: 10, level: 1 },
				],
			},
		},
	};

	const handCards = [
		{ name: 'Kannetje Melk', type: 'PIECIE', description: '+25 MP to active Mosje' },
		{ name: 'Quest Prep', type: 'PIECIE', description: 'Your next quest roll gets +2' },
		{ name: 'Lucky Coin', type: 'SNELLE_PIECIE', description: 'Reroll any die' },
		{
			name: 'Leap of Faith',
			type: 'QUEST',
			questType: 'GENERAL',
			difficulty: 'MEDIUM',
			description: 'Roll 1d6: 1-3 fail, 4-6 success',
		},
	];

	renderBoard(boardRoot, uiState);
	renderHand(handRoot, handCards);

	if (turnLabel) {
		turnLabel.textContent = `${uiState.activePlayerName} • ${uiState.turnPhase} Phase`;
	}

	log.add('quest', `${uiState.activePlayerName} entered the arena.`);
	log.add('gain', 'Board UI rendered successfully.');

	document.getElementById('btn-end-turn')?.addEventListener('click', () => {
		log.add('quest', 'Turn ended. Next player phase started.');
		modal.showInfo('Turn Ended', 'Turn flow and state syncing hooks will be wired in Phase 7.');
	});
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
