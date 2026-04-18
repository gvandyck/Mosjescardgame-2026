// mpManager.js — All MP gain, loss, and level-up calculations.
// Pure logic — no visuals, no Firebase.
// All functions return an updated copy of gameState (never mutate directly).

console.log('[ENGINE] mpManager.js loaded');

// ─────────────────────────────────────────────────────────────
// gainMP
// Gives `amount` MP to a specific Mosje slot for a player.
// Automatically calls checkLevelUp after gaining MP.
//
// gameState  — full game state object
// playerId   — which player's Mosje gains MP
// slotIndex  — 0 or 1 (which of the 2 Mosje slots)
// amount     — how many MP to gain (must be positive)
//
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function gainMP(gameState, playerId, slotIndex, amount) {
  if (amount <= 0) return gameState;

  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) {
    console.log('[ENGINE] gainMP: no active Mosje at slot', slotIndex, 'for', playerId);
    return state;
  }

  mosje.mp += amount;
  console.log(`[ENGINE] 💥 ${mosje.name} gains ${amount} MP → now ${mosje.mp} MP`);

  return checkLevelUp(state, playerId, slotIndex);
}

// ─────────────────────────────────────────────────────────────
// loseMP
// Removes `amount` MP from a Mosje. MP can go negative —
// a negative Mosje cannot attempt Quests until back at 0+.
// Checks for defeat (MP going below -100 while at level 0 is not defeat —
// only explicit defeat via the welloe rule applies here; see victoryChecker).
//
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function loseMP(gameState, playerId, slotIndex, amount) {
  if (amount <= 0) return gameState;

  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) {
    console.log('[ENGINE] loseMP: no active Mosje at slot', slotIndex, 'for', playerId);
    return state;
  }

  mosje.mp -= amount;
  console.log(`[ENGINE] 📉 ${mosje.name} loses ${amount} MP → now ${mosje.mp} MP`);

  return state;
}

// ─────────────────────────────────────────────────────────────
// checkLevelUp
// Called automatically after every gainMP.
// If a Mosje reaches 100+ MP: level increases by 1, MP resets to 0.
// Logs a ⬆️ level-up event.
//
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function checkLevelUp(gameState, playerId, slotIndex) {
  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) return state;

  while (mosje.mp >= 100) {
    mosje.mp -= 100;
    mosje.level += 1;
    console.log(`[ENGINE] ⬆️ ${mosje.name} levelled up! Now Level ${mosje.level} | MP reset to ${mosje.mp}`);

    if (mosje.level >= 3) {
      console.log(`[ENGINE] 🏆 ${mosje.name} reached Level 3 — victory condition met!`);
      // victoryChecker.js will detect and finalise the win
      break;
    }
  }

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
