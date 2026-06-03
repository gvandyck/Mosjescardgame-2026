// victoryChecker.js — Checks all 4 win conditions after every game action.
// Call checkVictory() after every state change.
// Returns the updated gameState with winnerId set if someone won.

import { getTotalMPForPlayer } from './mpManager.js';
import { getAllPlayerIds } from './gameState.js';

console.log('[ENGINE] victoryChecker.js loaded');

// ─────────────────────────────────────────────────────────────
// WIN CONDITIONS:
//   1. LEVEL_3        — A player's Mosje reaches Level 3
//   2. KNOCKOUT       — All of the opponent's Mosjes are defeated
//   3. QUEST_MASTER   — A player completes 7 total Quests
//   4. MOMENTUM_DOM   — A player has 250+ combined MP at turn start
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// checkVictory
// Runs all 4 checks. Sets gameState.winnerId and gameState.status
// if a win condition is met. Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function checkVictory(gameState) {
  // Don't re-check if game is already over
  if (gameState.status === 'FINISHED') return gameState;

  const playerIds = getAllPlayerIds(gameState);

  for (const playerId of playerIds) {
    const reason = getWinReason(gameState, playerId);
    if (reason) {
      console.log(`[ENGINE] 🏆 Victory! Player ${playerId} wins by: ${reason}`);
      return {
        ...gameState,
        status: 'FINISHED',
        winnerId: playerId,
        winReason: reason,
      };
    }
  }

  return gameState;
}

// ─────────────────────────────────────────────────────────────
// getWinReason
// Returns a win reason string if the player has won, else null.
// ─────────────────────────────────────────────────────────────
function getWinReason(gameState, playerId) {
  // ── 1. LEVEL 3 ──────────────────────────────────────────────
  const player = gameState.players[playerId];
  const hasLevel3 = player.activeSlots.some(
    slot => slot !== null && slot.level >= 3
  );
  if (hasLevel3) return 'LEVEL_3';

  // ── 2. KNOCKOUT ─────────────────────────────────────────────
  // Check if ALL of every opponent's Mosjes are defeated
  const opponentIds = getAllPlayerIds(gameState).filter(id => id !== playerId);
  const allOpponentsKnockedOut = opponentIds.every(opponentId => {
    const opponent = gameState.players[opponentId];
    return opponent.activeSlots.every(
      slot => slot === null || slot.isDefeated
    );
  });
  if (opponentIds.length > 0 && allOpponentsKnockedOut) return 'KNOCKOUT';

  // ── 3. QUEST MASTER ─────────────────────────────────────────
  if (player.questsCompleted >= 7) return 'QUEST_MASTER';

  // ── 4. MOMENTUM DOMINATION ──────────────────────────────────
  // Only checked at TURN START — the turnManager calls checkVictory
  // with a momentumCheckPhase flag to avoid firing mid-turn.
  if (gameState.momentumCheckPhase === true) {
    const totalMP = getTotalMPForPlayer(gameState, playerId);
    if (totalMP >= 250) return 'MOMENTUM_DOMINATION';
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// markMosjeDefeated
// Sends a Mosje to the Welloe pile (out of game).
// Call when a Mosje's MP drops to a defeat threshold or a card
// effect specifically defeats them.
// ─────────────────────────────────────────────────────────────
export function markMosjeDefeated(gameState, playerId, slotIndex) {
  const state = JSON.parse(JSON.stringify(gameState));
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje) return state;

  // WELLOE_SHIELD: pushed by Mosje Shield Piecie. Protects from Welloe pile for turnsLeft turns.
  const shieldEffect = mosje.statusEffects?.find(
    e => e.type === 'WELLOE_SHIELD' && e.turnsLeft > 0
  );
  if (shieldEffect) {
    shieldEffect.turnsLeft -= 1;
    state.players[playerId].activeSlots[slotIndex].mp = 1;
    console.log(`[ENGINE] WELLOE_SHIELD: ${mosje.name} protected — restored to 1 MP`);
    return state;
  }

  // "Not Today!" — negate_elimination flag: stay at 5 MP instead of being sent to Welloe
  const negateFlag = state._snelleFlags?.negateNextElimination;
  if (negateFlag?.[playerId]) {
    delete state._snelleFlags.negateNextElimination[playerId];
    state.players[playerId].activeSlots[slotIndex].mp = 5;
    console.log(`[ENGINE] Not Today! saved ${mosje.name} — restored to 5 MP`);
    return state;
  }

  // Tesla destruction: Coert sent to Welloe while Tesla is active → destroy Tesla.
  if (String(mosje.cardId).includes('coert') && state.activePlace === 'place_tesla') {
    state.activePlace = null;
    state.players[playerId].discard.unshift({ cardId: 'place_tesla' });
    console.log('[ENGINE] Tesla: Coert sent to Welloe — Tesla destroyed, sent to discard');
  }

  console.log(`[ENGINE] ${mosje.name} has been defeated — sent to Welloe pile`);
  mosje.isDefeated = true;
  state.players[playerId].welloe.push({ ...mosje });           // full object for revival mechanics
  if (!Array.isArray(state.players[playerId].discard)) state.players[playerId].discard = [];
  state.players[playerId].discard.unshift({                    // unified graveyard entry
    cardId: mosje.cardId,
    type: 'MOSJE',
    level: mosje.level,
    mp: mosje.mp,
  });
  state.players[playerId].activeSlots[slotIndex] = null;

  // Call of the Welloes: if this Mosje was summoned by the Piecie, clear the anchor link (D-17)
  // so the Piecie can be swept normally on the next turn.
  if (mosje.summonedByPiecie === 'piecie_call_of_welloes') {
    const pSlots = state.players[playerId].piecieSlots;
    if (Array.isArray(pSlots)) {
      const pIdx = pSlots.findIndex(
        p => p?.cardId === 'piecie_call_of_welloes' && p?.linkedMosjeCardId === mosje.cardId
      );
      if (pIdx >= 0) {
        if (!Array.isArray(state.players[playerId].discard)) state.players[playerId].discard = [];
        state.players[playerId].discard.push(pSlots[pIdx].cardId);
        state.players[playerId].piecieSlots[pIdx] = null;
        console.log('[ENGINE] markMosjeDefeated: piecie_call_of_welloes discarded — linked Mosje defeated');
      }
    }
  }

  return checkVictory(state);
}
