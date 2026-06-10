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

  // Defeat-at-0 MP: any Mosje flagged `_pendingDefeat` (reduced below 0 at Level 0
  // by a damaging effect) is sent to the graveyard/Welloe pile before win checks.
  let state = applyPendingDefeats(gameState);
  if (state.status === 'FINISHED') return state;

  // MP ceiling: a Mosje's MP is always 0–100. Quest rewards convert ≥100 into a
  // Level during resolveQuest (checkLevelUp resets mp < 100 first), so this only
  // clamps non-quest overshoots (piecie/place/ability gains that don't level).
  state = clampMosjeMp(state);

  const playerIds = getAllPlayerIds(state);

  for (const playerId of playerIds) {
    const reason = getWinReason(state, playerId);
    if (reason) {
      console.log(`[ENGINE] 🏆 Victory! Player ${playerId} wins by: ${reason}`);
      return {
        ...state,
        status: 'FINISHED',
        winnerId: playerId,
        winReason: reason,
      };
    }
  }

  return state;
}

// ─────────────────────────────────────────────────────────────
// applyPendingDefeats
// Sweeps every player's active slots and defeats any Mosje flagged
// `_pendingDefeat` (set by loseMP/applyDamage when a damaging effect
// would push MP below 0 at Level 0). Routes each through
// markMosjeDefeated, which honors WELLOE_SHIELD + Not Today! and
// re-checks victory. The flag is cleared BEFORE markMosjeDefeated so
// a shield/Not-Today save (which keeps the Mosje on field) does not
// re-trigger the sweep on the same slot. A guard caps iterations.
// ─────────────────────────────────────────────────────────────
export function applyPendingDefeats(gameState) {
  let state = gameState;
  let guard = 0;
  while (guard++ < 10) {
    let acted = false;
    for (const pid of getAllPlayerIds(state)) {
      const slots = state.players[pid]?.activeSlots || [];
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (slot && !slot.isDefeated && slot._pendingDefeat === true) {
          // Clear the flag first (on a fresh clone) so a shielded/Not-Today
          // save can't loop forever on the same flagged slot.
          state = JSON.parse(JSON.stringify(state));
          delete state.players[pid].activeSlots[i]._pendingDefeat;
          state = markMosjeDefeated(state, pid, i);
          acted = true;
          break;
        }
      }
      if (acted) break;
    }
    if (!acted) break;
  }
  return state;
}

// ─────────────────────────────────────────────────────────────
// clampMosjeMp
// Enforces the MP ceiling: every active (non-defeated) Mosje is clamped to a
// maximum of 100 MP. Only Quests permanently level up (resolveQuest →
// checkLevelUp converts ≥100 into a Level and resets MP < 100 BEFORE this runs),
// so this only caps non-quest overshoots from piecies/places/abilities/snelles.
// The floor (0 / defeat) is handled by loseMP + applyPendingDefeats.
// ─────────────────────────────────────────────────────────────
export function clampMosjeMp(gameState) {
  let mutated = false;
  for (const playerId of getAllPlayerIds(gameState)) {
    const slots = gameState.players[playerId]?.activeSlots || [];
    for (const slot of slots) {
      if (slot && !slot.isDefeated && slot.mp > 100) { mutated = true; break; }
    }
    if (mutated) break;
  }
  if (!mutated) return gameState; // common case: nothing above 100

  const state = JSON.parse(JSON.stringify(gameState));
  for (const playerId of getAllPlayerIds(state)) {
    const slots = state.players[playerId]?.activeSlots || [];
    for (const slot of slots) {
      if (slot && !slot.isDefeated && slot.mp > 100) {
        console.log(`[ENGINE] MP clamp: ${slot.name} ${slot.mp} → 100`);
        slot.mp = 100;
      }
    }
  }
  return state;
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

  // Tesla destruction: Coert sent to graveyard while Tesla is active → destroy Tesla.
  if (String(mosje.cardId).includes('coert') && state.activePlace === 'place_tesla') {
    state.activePlace = null;
    if (!Array.isArray(state.players[playerId].graveyard)) state.players[playerId].graveyard = [];
    state.players[playerId].graveyard.push({ cardId: 'place_tesla', name: 'Tesla', type: 'PLACE', source: 'destroyed' });
    console.log('[ENGINE] Tesla: Coert defeated — Tesla destroyed, sent to graveyard');
  }

  console.log(`[ENGINE] ${mosje.name} has been defeated — sent to graveyard`);
  mosje.isDefeated = true;
  if (!Array.isArray(state.players[playerId].graveyard)) state.players[playerId].graveyard = [];
  state.players[playerId].graveyard.push({ ...mosje, type: 'MOSJE', source: 'defeated' });
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
        if (!Array.isArray(state.players[playerId].graveyard)) state.players[playerId].graveyard = [];
        state.players[playerId].graveyard.push({ cardId: pSlots[pIdx].cardId, name: 'Call of the Welloes', type: 'PIECIE', source: 'destroyed' });
        state.players[playerId].piecieSlots[pIdx] = null;
        console.log('[ENGINE] markMosjeDefeated: piecie_call_of_welloes sent to graveyard — linked Mosje defeated');
      }
    }
  }

  return checkVictory(state);
}
