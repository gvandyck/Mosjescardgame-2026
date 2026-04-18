// main.js — Entry point for the app.
// Detects the current page and starts the matching UI flow.

import { renderBoard } from './ui/boardRenderer.js';
import { createLogRenderer } from './ui/logRenderer.js';
import { renderHand } from './ui/handRenderer.js';
import { initModalManager } from './ui/modalManager.js';
import { createInitialGameState, getOpponentMosjes, getPlayerMosjes } from './engine/gameState.js';
import { startTurn, endTurn, attemptGeneralQuest, attemptPersonalQuest, playPiecie, playSnellie, useMosjeAbility, canPlayerActNow } from './engine/turnManager.js';
import { resolveQuest, canAttemptGeneralQuest, canAttemptPersonalQuest, getQuestDiceThreshold } from './abilities/questLogic.js';
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

	document.getElementById('btn-general-quest')?.addEventListener('click', () => {
		if (gameState.activePlayerId !== 'player_1') {
			modal.showInfo('Not Your Turn', 'You can only attempt quests on your own turn.');
			return;
		}
		if (gameState.players.player_1.hasAttemptedQuestThisTurn) {
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

		const activeMosje = gameState.players.player_1.activeSlots.find(s => s && !s.isDefeated);
		if (!canAttemptGeneralQuest(questDef, gameState, 'player_1')) {
			log.add('quest', `Cannot attempt ${questDef.name} — active Mosje has negative MP.`);
			gameState.sharedGeneralQuestDiscard.push(questRef);
			renderFromState(gameState);
			return;
		}

		const threshold = getQuestDiceThreshold(questDef, activeMosje);
		log.add('quest', `${localPlayerName} is attempting General Quest: ${questDef.name}`);

		modal.showDiceRoll(questDef, threshold, (didSucceed) => {
			gameState = resolveQuest(gameState, 'player_1', questDef, didSucceed);
			gameState.sharedGeneralQuestDiscard.push(questRef);
			renderFromState(gameState);

			const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
			const sign = mpDelta >= 0 ? '+' : '';
			log.add(didSucceed ? 'gain' : 'loss',
				`${questDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`
			);
		});
	});

	document.getElementById('btn-personal-quest')?.addEventListener('click', () => {
		if (gameState.activePlayerId !== 'player_1') {
			modal.showInfo('Not Your Turn', 'You can only attempt quests on your own turn.');
			return;
		}
		if (gameState.players.player_1.hasAttemptedQuestThisTurn) {
			modal.showInfo('Already Attempted', 'You have already attempted a quest this turn.');
			return;
		}

		const personalQuestsInHand = gameState.players.player_1.hand.filter(
			c => CARD_LOOKUP[c.cardId]?.questType === 'PERSONAL'
		);

		if (personalQuestsInHand.length === 0) {
			modal.showInfo('No Personal Quests', 'You have no Personal Quest cards in your hand.');
			return;
		}

		// Use the first personal quest found (pick UI can be a future enhancement)
		const handCard = personalQuestsInHand[0];
		const questDef = CARD_LOOKUP[handCard.cardId];

		if (!canAttemptPersonalQuest(questDef, gameState, 'player_1')) {
			modal.showInfo(
				'Required Mosje Missing',
				`${questDef.name} requires ${questDef.requiredMosjeId} on the field.`
			);
			return;
		}

		const { state: newState, questCard: playedCard } = attemptPersonalQuest(gameState, handCard.cardId);
		gameState = newState;

		const activeMosje = gameState.players.player_1.activeSlots.find(s => s && !s.isDefeated);
		const threshold = getQuestDiceThreshold(questDef, activeMosje);
		log.add('quest', `${localPlayerName} is attempting Personal Quest: ${questDef.name}`);

		modal.showDiceRoll(questDef, threshold, (didSucceed) => {
			gameState = resolveQuest(gameState, 'player_1', questDef, didSucceed);
			renderFromState(gameState);

			const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
			const sign = mpDelta >= 0 ? '+' : '';
			log.add(didSucceed ? 'gain' : 'loss',
				`${questDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`
			);
		});
	});

	function renderFromState(state) {
		const uiState = toBoardViewModel(state, 'player_1');

		const isLocalTurn = state.activePlayerId === 'player_1';
		const alreadyAttempted = state.players.player_1.hasAttemptedQuestThisTurn;
		const gameOver = state.status === 'FINISHED';

		// Regular cards only on local turn; Snelle Piecies always available
		// Pass onPlay always so Snelle Piecies show their interrupt button
		const onPlay = !gameOver ? handlePlayCard : null;
		renderHand(handRoot, toHandViewModel(state.players.player_1.hand), onPlay, isLocalTurn);

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
		if (gameState.status === 'FINISHED') return;

		const { state: newState, success, error } = useMosjeAbility(gameState, 'player_1', mosjeId);
		if (!success) {
			modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
			return;
		}
		gameState = newState;

		const slot = gameState.players.player_1.activeSlots.find(s => s?.cardId === mosjeId);
		log.add('gain', `Used ability: ${slot?.name || mosjeId}.`);

		if (gameState.status === 'FINISHED') {
			const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
			log.add('win', `${winnerName} won by ${gameState.winReason}.`);
			modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
		}
		renderFromState(gameState);
	}

	async function handlePlayCard(cardId, cardType) {
		if (gameState.status === 'FINISHED') return;

		// Enforce turn ownership — Snelle Piecies always allowed
		if (!canPlayerActNow(gameState, 'player_1', cardType)) {
			modal.showInfo('Not Your Turn', 'You can only play regular cards on your own turn.');
			return;
		}

		// Targeting cards: show selector, then dispatch with resolved targets
		async function resolveTargetingCard(def, ref) {
			const oppTargets = getOpponentMosjes(gameState, 'player_1');
			const ownTargets = getPlayerMosjes(gameState, 'player_1');

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

			const { state: newState, success, error } = playPiecie(stateWithTargets, 'player_1', ref, def);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${def.name}.`);
			if (gameState.status === 'FINISHED') {
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderFromState(gameState);
		}

		const cardRef = gameState.players.player_1.hand.find(c => c.cardId === cardId);
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
			const { state: newState, success, error } = playPiecie(gameState, 'player_1', cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${cardDef.name}.`);
			if (cardDef.description) log.add('info', cardDef.description);
			if (gameState.status === 'FINISHED') {
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderFromState(gameState);
			return;
		}

		if (cardType === 'SNELLE_PIECIE') {
			const { state: newState, success, error } = playSnellie(gameState, 'player_1', cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${cardDef.name} (instant).`);
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
		activePlaceName: gameState.activePlace?.name || 'None',
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
