// victoryChecker.js — Checks all 4 win conditions after every game action.
// Call checkVictory() after every state change.
// Returns the updated gameState with winnerId set if someone won.

import { takeReactionMod } from './reactions/takeReactionMod.js';
import { discardBoundStays } from './table/discardBoundStays.js';
import { checkLoss } from './winLose/checkLoss.js';
import { getAllPlayerIds } from './gameState.js';
import { normalizeSlotMp } from './mp/normalizeSlotMp.js';

console.log('[ENGINE] victoryChecker.js loaded');

// ─────────────────────────────────────────────────────────────
// WIN / LOSE (Obby 2.0):
//   KNOCKOUT — an opponent has no Mosje left on field, in hand or in deck.
//   LEVEL_3 is decided at turn start by winLose/checkWin.js (hold Level 3).
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// checkVictory
// Runs the KNOCKOUT check. Sets gameState.winnerId and gameState.status
// if a win condition is met. Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function checkVictory(gameState) {
  // Don't re-check if game is already over
  if (gameState.status === 'FINISHED') return gameState;

  // Getemt-while-sideways: any Mosje flagged `_pendingWelloe` is sent to the Welloe pile before win checks.
  let state = applyPendingDefeats(gameState);
  if (state.status === 'FINISHED') return state;

  // 2.0 MP normaliser: levels any >=100 Mosje, caps L3 at 95, snaps to the 5-grid.
  state = normalizeMosjeMp(state);

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
// `_pendingWelloe` (getemt while sideways, set by applyGetemt). Routes each through
// markMosjeDefeated, which honors Mosje Shield + Not Today! and
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
        if (slot && !slot.isDefeated && slot._pendingWelloe === true) {
          // Clear the flag first (on a fresh clone) so a shielded/Not-Today
          // save can't loop forever on the same flagged slot.
          state = JSON.parse(JSON.stringify(state));
          delete state.players[pid].activeSlots[i]._pendingWelloe;
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
// normalizeMosjeMp
// 2.0 safety net behind the per-effect gains: every live Mosje with MP >= 100
// is levelled (MP 0), Level 3 is capped at 95, MP is snapped to the 5-grid and
// floored at 0. Clones only when something needs changing.
// ─────────────────────────────────────────────────────────────
export function normalizeMosjeMp(gameState) {
  const needsWork = (slot) => slot && !slot.isDefeated
    && (!Number.isFinite(slot.mp) || slot.mp >= 100 || slot.mp % 5 !== 0 || slot.mp < 0
      || (slot.level === 3 && slot.mp > 95));
  let mutated = false;
  for (const playerId of getAllPlayerIds(gameState)) {
    const slots = gameState.players[playerId]?.activeSlots || [];
    if (slots.some(needsWork)) { mutated = true; break; }
  }
  if (!mutated) return gameState;

  const state = JSON.parse(JSON.stringify(gameState));
  for (const playerId of getAllPlayerIds(state)) {
    for (const slot of state.players[playerId]?.activeSlots || []) {
      if (slot && !slot.isDefeated) normalizeSlotMp(slot, { turnNumber: state.turnNumber });
    }
  }
  return state;
}

// ─────────────────────────────────────────────────────────────
// getWinReason
// Obby 2.0: the only instant end is KNOCKOUT (an opponent has no Mosje left on
// field, in hand or in deck). The Level 3 win is checked at turn start (checkWin).
// ─────────────────────────────────────────────────────────────
function getWinReason(gameState, playerId) {
  const opponentIds = getAllPlayerIds(gameState).filter(id => id !== playerId);
  if (opponentIds.length > 0 && opponentIds.every(id => checkLoss(gameState.players[id]))) {
    return 'KNOCKOUT';
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

  // Mosje Shield: a staying piecie_mosje_shield bound to this Mosje keeps it out of the Welloe pile.
  // It survives at 5 MP (the minimum), like "Not Today!"; the card stays until its own end.
  const shielded = (state.players[playerId].piecieSlots || []).some(
    e => e?.stays === true && e.cardId === 'piecie_mosje_shield'
      && (e.boundTo || []).some(b => b.playerId === playerId && b.slotIndex === slotIndex && b.cardId === mosje.cardId)
  );
  if (shielded) {
    mosje.mp = 5;
    console.log(`[ENGINE] Mosje Shield: ${mosje.name} protected - restored to 5 MP`);
    return state;
  }

  // Not Today! (Snelle): a one-shot 'save' reaction entry keeps the Mosje where it is (sideways stays), at 5 MP minimum.
  if (takeReactionMod(state, 'save', playerId, slotIndex)) {
    mosje.mp = Math.max(mosje.mp, 5); // mp-direct-ok: Not Today! 5 MP floor
    delete mosje._pendingWelloe;
    console.log(`[ENGINE] Not Today! saved ${mosje.name} - stays on the field at ${mosje.mp} MP`);
    return state;
  }

  // Tesla destruction: Coert sent to graveyard while Tesla is active → destroy Tesla.
  if (String(mosje.cardId).includes('coert') && state.activePlace === 'place_tesla') {
    state.activePlace = null;
    if (!Array.isArray(state.players[playerId].graveyard)) state.players[playerId].graveyard = [];
    state.players[playerId].graveyard.push({ cardId: 'place_tesla', name: 'Tesla', type: 'PLACE', source: 'destroyed' });
    console.log('[ENGINE] Tesla: Coert defeated — Tesla destroyed, sent to graveyard');
  }

  // Obby 2.0: a defeated Mosje goes to the separate Welloe pile (never the discard pile,
  // never shuffled back). Decision 6: battle-log line only until the Phase 63 pile UI.
  console.log(`[ENGINE] ${mosje.name} getemt while sideways -> Welloe pile`);
  mosje.isDefeated = true;
  if (!Array.isArray(state.players[playerId].welloePile)) state.players[playerId].welloePile = [];
  state.players[playerId].welloePile.push({ ...mosje, type: 'MOSJE', source: 'welloe' });
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

  return checkVictory(discardBoundStays(state)); // a Stays Piecie bound to this Mosje ends with it
}
