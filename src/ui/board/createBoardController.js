// createBoardController.js — the tap-first state machine of the 2.0 board (63-UI-SPEC "Interaction state machine", D-03..D-06).
//   idle -> tap an own card on your turn -> selected (ring + action tray)
//   selected -> Attack -> choose-target -> tap a glowing target -> preview -> Confirm / same target again -> engine (handlers.attack)
//   selected -> Quest  -> choose-quest  -> tap a glowing Quest tile -> handlers.quest (the picker + roll modals take over)
//   selected -> Ability / Activate -> handlers.ability / handlers.activate;  Details -> the tile's detail view
//   Cancel, Esc, empty felt, the end of your turn, or a card that went away -> idle
// getState() -> the engine state; handlers = { attack(slot, targetPlayerId, targetSlot), beginQuest(slot) (may be async),
// quest(slot, stackId), ability(cardId), activate(slotIndex) }; onChange() runs after every redraw (main.js repaints the strip).
// The board is rebuilt on every state change, so afterRender() redraws the current mode on the fresh tiles.
import { getTrayActions } from './getTrayActions.js';
import { getAttackTargets } from './getAttackTargets.js';
import { getQuestTargets } from './getQuestTargets.js';
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { renderActionTray } from './renderActionTray.js';
import { markTargets } from './markTargets.js';
import { clearTargetMarks } from './clearTargetMarks.js';
import { findBoardTile } from './findBoardTile.js';
import { buildStripMode } from './buildStripMode.js';
import { isLiveSelection } from './isLiveSelection.js';
import { bindBoardDismiss } from './bindBoardDismiss.js';
import { getPower } from '../../engine/mp/getPower.js';
import { showToast } from './showToast.js';

const same = (a, b) => !!a && !!b && a.playerId === b.playerId && a.slotIndex === b.slotIndex;

export function createBoardController({ getState, localPlayerId, handlers = {}, getBoard = () => document.querySelector('[data-board]'), onChange = () => {} }) {
	let mode = 'idle';
	let sel = null; // the selected own card { kind, playerId, slotIndex, cardId }
	let target = null; // the previewed attack target { playerId, slotIndex }
	let waiting = false; // beginQuest (the Senor West peek) is open

	const myTurn = () => { const s = getState(); return !!s && s.status !== 'FINISHED' && s.activePlayerId === localPlayerId; };

	// An attack mode only survives while the attacker can still attack and the previewed target is still a legal one.
	function settleMode(state) {
		if (mode === 'idle') return;
		if (!isLiveSelection(state, localPlayerId, sel)) { mode = 'idle'; sel = null; target = null; return; }
		if (mode === 'preview' && !getAttackTargets(state, localPlayerId).some(t => t.valid && same(t, target))) { mode = 'choose-target'; target = null; }
		if (mode === 'choose-target' && !canMosjeTakeAction(state, localPlayerId, sel.slotIndex).ok) { mode = 'idle'; sel = null; target = null; }
		if (mode === 'choose-quest' && !canMosjeTakeAction(state, localPlayerId, sel.slotIndex).ok) { mode = 'idle'; sel = null; target = null; }
	}

	function draw() {
		const board = getBoard();
		const state = getState();
		clearTargetMarks(board);
		settleMode(state);
		const tile = mode === 'idle' ? null : findBoardTile(board, sel);
		if (!tile) { if (mode !== 'idle') { mode = 'idle'; sel = null; target = null; } onChange(); return; }
		tile.classList.add('is-selected');
		if (mode === 'selected') renderActionTray(board, tile, getTrayActions(state, localPlayerId, sel), chooseAction, { below: sel.kind === 'place' });
		if (mode === 'choose-target' || mode === 'preview') markAttackTargets(board, state);
		if (mode === 'choose-quest') markQuestTiles(board, state);
		onChange();
	}

	function markAttackTargets(board, state) {
		const power = getPower(state.players[localPlayerId].activeSlots[sel.slotIndex], state, localPlayerId);
		const entries = getAttackTargets(state, localPlayerId).map(t => ({
			...t,
			el: findBoardTile(board, { kind: 'mosje', playerId: t.playerId, slotIndex: t.slotIndex }),
			chip: mode === 'preview' && same(t, target) ? (power > 0 ? `−${power}` : '0') : '',
		}));
		markTargets(board, mode, entries);
		if (mode === 'preview') entries.find(e => same(e, target))?.el?.setAttribute('data-preview', '');
	}

	function markQuestTiles(board, state) {
		const entries = getQuestTargets(state, localPlayerId, sel.slotIndex).map(t => ({ ...t, el: board.querySelector(`.quest-stack[data-quest-stack="${t.stackId}"]`) }));
		markTargets(board, 'choose-quest', entries);
	}

	function setMode(next) {
		mode = next;
		if (next === 'idle') { sel = null; target = null; }
		draw();
	}

	async function chooseAction(action) {
		if (mode !== 'selected' || !sel || waiting) return;
		const card = sel;
		if (action === 'details') {
			const open = findBoardTile(getBoard(), card)?._boardOpenDetails;
			setMode('idle');
			return open?.();
		}
		if (action === 'attack') return setMode('choose-target');
		if (action === 'quest') {
			waiting = true;
			try { await handlers.beginQuest?.(card.slotIndex); } finally { waiting = false; }
			if (mode === 'selected' && sel === card) setMode('choose-quest');
			return;
		}
		setMode('idle');
		if (action === 'ability') handlers.ability?.(card.cardId);
		else if (action === 'activate') handlers.activate?.(card.slotIndex);
	}

	function tapTarget(info) {
		const hit = getAttackTargets(getState(), localPlayerId).find(t => same(t, info));
		if (!hit) return info.openDetails();
		if (!hit.valid) return showToast(hit.reason);
		if (mode === 'preview' && same(target, hit)) return confirm();
		target = { playerId: hit.playerId, slotIndex: hit.slotIndex };
		mode = 'preview';
		draw();
	}

	function onTileTap(info) {
		if (waiting) return;
		const own = info.owner === 'own';
		if ((mode === 'choose-target' || mode === 'preview') && !own && info.kind === 'mosje') return tapTarget(info);
		if (!own || !myTurn()) return info.openDetails();
		if (mode === 'selected' && sel && sel.kind === info.kind && same(sel, info)) return setMode('idle');
		sel = { kind: info.kind, playerId: info.playerId, slotIndex: info.slotIndex ?? null, cardId: info.cardId };
		target = null;
		mode = 'selected';
		draw();
	}

	// A Quest tile tap: true when the controller used it (the board then skips the Quest detail view).
	function onQuestTap(stackId) {
		if (mode !== 'choose-quest' || !sel) return false;
		const hit = getQuestTargets(getState(), localPlayerId, sel.slotIndex).find(t => t.stackId === stackId);
		if (hit && !hit.valid) { showToast(hit.reason); return true; }
		const slot = sel.slotIndex;
		setMode('idle');
		if (hit) handlers.quest?.(slot, stackId);
		return true;
	}

	function confirm() {
		if (mode !== 'preview' || !sel || !target) return;
		const { slotIndex } = sel;
		const hit = target;
		setMode('idle');
		handlers.attack?.(slotIndex, hit.playerId, hit.slotIndex);
	}

	function cancel() {
		if (mode !== 'idle') setMode('idle');
	}

	bindBoardDismiss(getBoard, cancel);
	if (typeof window !== 'undefined') window.addEventListener('resize', () => { if (mode === 'selected') draw(); });

	return {
		onTileTap,
		onQuestTap,
		afterRender: draw,
		confirm,
		cancel,
		getMode: () => mode,
		getStripMode: () => buildStripMode(getState(), localPlayerId, { mode, sel, target }),
	};
}
