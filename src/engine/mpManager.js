// mpManager.js — All MP gain, loss, and level-up calculations.
// Pure logic — no visuals, no Firebase.
// All functions return an updated copy of gameState (never mutate directly).

import { applyGainToSlot } from './mp/applyGainToSlot.js';
import { normalizeSlotMp } from './mp/normalizeSlotMp.js';
import { applyMpLossToSlot } from './mp/applyMpLossToSlot.js';

console.log('[ENGINE] mpManager.js loaded');

function getActivePlaceId(gameState) {
  return gameState?.activePlace || gameState?.sharedPlaceSlot?.cardId || null;
}

// ─────────────────────────────────────────────────────────────
// gainMP
// Gives `amount` MP to a specific Mosje slot for a player.
// Obby 2.0: every gain can level. 100+ MP raises one Level and resets MP to 0
// (no carry-over); a Level 3 Mosje is capped at 95. See applyGainToSlot.
//
// gameState  — full game state object
// playerId   — which player's Mosje gains MP
// slotIndex  — 0 or 1 (which of the 2 Mosje slots)
// amount     — how many MP to gain (must be positive)
//
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function gainMP(gameState, playerId, slotIndex, amount, source = 'GAIN') {
  if (amount <= 0) return gameState;

  const placeId = getActivePlaceId(gameState);
  if (placeId === 'place_the_void') {
    console.log('[MP] The Void active — gainMP blocked');
    return gameState;
  }

  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) {
    console.log('[ENGINE] gainMP: no active Mosje at slot', slotIndex, 'for', playerId);
    return state;
  }

  const { gained } = applyGainToSlot(mosje, amount, { turnNumber: state.turnNumber });
  console.log(`[ENGINE] 💥 ${mosje.name} gains ${gained} MP (${source}) → now Level ${mosje.level} | ${mosje.mp} MP`);
  return state;
}

// ─────────────────────────────────────────────────────────────
// loseMP
// Removes `amount` MP from a Mosje through the loss pipeline. MP never goes
// negative. A real loss (final > 0) leaving 0 MP triggers getemt (applyGetemt):
// Level 2-3 drops a Level at 50 MP, Level 1 turns sideways, sideways -> Welloe pile.
//
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function loseMP(gameState, playerId, slotIndex, amount, source = 'DRAIN', _redirected = false) {
  if (amount <= 0) return gameState;

  // Welloe Force: if the target is the card owner's Mosje, redirect to stored opponent target.
  // _redirected flag prevents infinite loops if the target also has a redirect active.
  if (!_redirected && gameState._welloeForceActive?.ownerId === playerId && gameState._welloeForceActive.targetSlotId) {
    const targetSlotId = gameState._welloeForceActive.targetSlotId;
    const lastSlot = targetSlotId.lastIndexOf('_slot_');
    const tPlayerId = targetSlotId.slice(0, lastSlot);
    const tSlotIndex = parseInt(targetSlotId.slice(lastSlot + 6), 10);
    const tMosje = gameState.players[tPlayerId]?.activeSlots[tSlotIndex];
    if (tMosje && !tMosje.isDefeated) {
      console.log(`[MP] Welloe Force: redirecting ${amount} damage from ${playerId}_slot_${slotIndex} → ${targetSlotId}`);
      return loseMP(gameState, tPlayerId, tSlotIndex, amount, source, true);
    }
  }

  // U8 — Entry Protection: a freshly entered Mosje cannot lose MP to effects
  // inflicted outside its owner's turn (i.e. by opponents) until the owner's
  // next turn starts. Own-turn losses (quest failMP, self-effects) and cost
  // payments (U7 — sources containing 'COST') are never blocked.
  {
    const targetSlot = gameState.players[playerId]?.activeSlots?.[slotIndex];
    if (
      targetSlot?.entryProtected === true
      && gameState.activePlayerId !== playerId
      && !String(source).includes('COST')
    ) {
      console.log(`[MP] 🛡️ Entry protection: ${targetSlot.name} just entered play — ${amount} MP loss (${source}) fizzled`);
      return gameState;
    }
  }

  const placeId = getActivePlaceId(gameState);

  if (placeId === 'place_the_void') {
    console.log('[MP] The Void active — loseMP blocked');
    return gameState;
  }

  if (placeId === 'place_momentum_factory' && source === 'ATTACK') {
    console.log('[MP] Momentum Factory active — ATTACK damage blocked');
    return gameState;
  }

  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) {
    console.log('[ENGINE] loseMP: no active Mosje at slot', slotIndex, 'for', playerId);
    return state;
  }

  // ── Snelle Piecie interception flags ─────────────────────────────────────
  const snelleFlags = state._snelleFlags || {};

  // Counter Strikka: negate next Piecie-sourced MP loss (DRAIN) for this player.
  if (snelleFlags.negateNextPiecie?.[playerId] && source === 'DRAIN') {
    console.log('[MP] Counter Strikka: Piecie/DRAIN damage negated for', playerId);
    delete state._snelleFlags.negateNextPiecie[playerId];
    return state;
  }

  // Perfect Dodge: negate next ATTACK source + gain 15 MP for the defender.
  if (snelleFlags.negateNextAttack?.[playerId] && source === 'ATTACK') {
    console.log('[MP] Perfect Dodge: ATTACK negated for', playerId, '— +15 MP refund');
    mosje.mp += 15;
    delete state._snelleFlags.negateNextAttack[playerId];
    return state;
  }

  // Drain Reversal: reflect incoming DRAIN to the opponent (direct mutation — bypass stack to avoid recursion).
  if (snelleFlags.drainReversal?.[playerId] && source === 'DRAIN') {
    const oppId = Object.keys(state.players).find(id => id !== playerId);
    if (oppId) {
      const opp = state.players[oppId];
      const osi = opp.activeSlots.findIndex(s => s && !s.isDefeated);
      if (osi >= 0) {
        opp.activeSlots[osi].mp = Math.max(0, opp.activeSlots[osi].mp - amount);
        console.log('[MP] Drain Reversal: reflected', amount, 'drain to opponent');
      }
    }
    delete state._snelleFlags.drainReversal[playerId];
    return state;
  }

  // ── End snelle interception ───────────────────────────────────────────────

  // Obby 2.0: pipeline (§2g) -> subtract -> track -> getemt (§2b), all in one slot-level funnel.
  const { final, getemt } = applyMpLossToSlot({ state, playerId, slot: mosje, amount, source });
  if (final <= 0) {
    console.log('[MP] loss reduced to 0 — no loss (§2g)');
    return state;
  }
  console.log(`[ENGINE] 📉 ${mosje.name} loses ${final} (${source}) → L${mosje.level} | ${mosje.mp} MP${getemt ? ' — getemt: ' + getemt : ''}`);

  return state;
}

// ─────────────────────────────────────────────────────────────
// checkLevelUp
// Normalises a Mosje's MP after a direct write: 100+ MP raises one Level and
// resets MP to 0, Level 3 is capped at 95, MP is snapped to the 5-grid.
//
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function checkLevelUp(gameState, playerId, slotIndex) {
  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) return state;
  normalizeSlotMp(mosje, { turnNumber: state.turnNumber });
  return state;
}

// ─────────────────────────────────────────────────────────────
// applyStatusEffectMP
// Applies per-turn MP changes from active status effects
// (e.g. Place effects, "Kleine Taks" recurring damage).
// Call this at the start of the END phase each turn.
//
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function applyStatusEffectMP(gameState, playerId, slotIndex) {
  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) return state;

  for (const effect of mosje.statusEffects) {
    if (effect.value > 0) {
      console.log(`[ENGINE] Status effect: ${mosje.name} gains ${effect.value} MP from ${effect.type}`);
      mosje.mp += effect.value;
    } else {
      console.log(`[ENGINE] Status effect: ${mosje.name} loses ${Math.abs(effect.value)} MP from ${effect.type}`);
      mosje.mp += effect.value; // value is negative
    }
    effect.turnsLeft -= 1;
  }

  // Remove expired effects
  mosje.statusEffects = mosje.statusEffects.filter(e => e.turnsLeft > 0);

  return checkLevelUp(state, playerId, slotIndex);
}

// ─────────────────────────────────────────────────────────────
// getTotalMPForPlayer
// Returns the combined MP of all active (non-defeated) Mosjes.
// Used by the Momentum Domination win condition check.
// ─────────────────────────────────────────────────────────────
export function getTotalMPForPlayer(gameState, playerId) {
  const player = gameState.players[playerId];
  if (!player) return 0;
  return player.activeSlots
    .filter(slot => slot !== null && !slot.isDefeated)
    .reduce((sum, mosje) => sum + Math.max(0, mosje.mp), 0);
  // Math.max(0, mp) so negative MP doesn't reduce the total below 0
}

// ─────────────────────────────────────────────────────────────
// deepCloneState — internal helper
// Makes a deep copy of gameState so we never mutate the original.
// (Keeps game state predictable and Firebase-sync safe.)
// ─────────────────────────────────────────────────────────────
function deepCloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
