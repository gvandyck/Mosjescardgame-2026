import { isFresh } from './fresh/isFresh.js';
import { isOpponentSourced } from './fresh/isOpponentSourced.js';
// mpManager.js — All MP gain, loss, and level-up calculations.
// Pure logic — no visuals, no Firebase.
// All functions return an updated copy of gameState (never mutate directly).

import { applyGainToSlot } from './mp/applyGainToSlot.js';
import { normalizeSlotMp } from './mp/normalizeSlotMp.js';
import { applyMpLossToSlot } from './mp/applyMpLossToSlot.js';
import { applyMpAmplifier } from './mp/applyMpAmplifier.js';
import { synergyFieldBonus } from './mp/synergyFieldBonus.js';
import { voidBlocksGain } from './mp/voidBlocksGain.js';

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

  if (voidBlocksGain(gameState, playerId, slotIndex, source)) {
    console.log(`[MP] The Void active - ${source} gain blocked`);
    return gameState;
  }

  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) {
    console.log('[ENGINE] gainMP: no active Mosje at slot', slotIndex, 'for', playerId);
    return state;
  }

  // Synergy Field: +10 per staying copy on an ability gain; then MP Amplifier doubles the next gain (max +40 extra).
  let total = amount + (source === 'ABILITY' ? synergyFieldBonus(state, playerId) : 0);
  total = applyMpAmplifier(state, playerId, total);
  const { gained } = applyGainToSlot(mosje, total, { turnNumber: state.turnNumber });
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
export function loseMP(gameState, playerId, slotIndex, amount, source = 'DRAIN', _redirected = false, byPlayerId = null) {
  if (amount <= 0) return gameState;

  // Fresh (2.0): a fresh Mosje cannot lose MP to anything opponent-sourced
  // (by byPlayerId, else inferred from whose turn it is). Own losses always apply;
  // there is no COST bypass (MP is never a cost).
  {
    const targetSlot = gameState.players[playerId]?.activeSlots?.[slotIndex];
    if (isFresh(targetSlot) && isOpponentSourced(gameState, playerId, byPlayerId)) {
      console.log(`[MP] 🛡️ Fresh: ${targetSlot.name} just entered play — ${amount} MP loss (${source}) fizzled`);
      return gameState;
    }
  }

  const placeId = getActivePlaceId(gameState);

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

  // Obby 2.0: pipeline (§2g) -> subtract -> track -> getemt (§2b), all in one slot-level funnel.
  const { final, getemt } = applyMpLossToSlot({ state, playerId, slot: mosje, amount, source, byPlayerId });
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
