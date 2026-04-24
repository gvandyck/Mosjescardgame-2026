// mpManager.js — All MP gain, loss, and level-up calculations.
// Pure logic — no visuals, no Firebase.
// All functions return an updated copy of gameState (never mutate directly).

console.log('[ENGINE] mpManager.js loaded');

function getActivePlaceId(gameState) {
  return gameState?.activePlace || gameState?.sharedPlaceSlot?.cardId || null;
}

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
export function gainMP(gameState, playerId, slotIndex, amount, source = 'GAIN') {
  if (amount <= 0) return gameState;

  const placeId = getActivePlaceId(gameState);
  if (placeId === 'place_the_void') {
    console.log('[MP] The Void active — gainMP blocked');
    return gameState;
  }

  let gainAmount = amount;
  if (placeId === 'place_drain_zone') {
    gainAmount += 5;
  }

  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) {
    console.log('[ENGINE] gainMP: no active Mosje at slot', slotIndex, 'for', playerId);
    return state;
  }

  mosje.mp += gainAmount;
  console.log(`[ENGINE] 💥 ${mosje.name} gains ${gainAmount} MP (${source}) → now ${mosje.mp} MP`);

  return checkLevelUp(state, playerId, slotIndex);
}

// ─────────────────────────────────────────────────────────────
// loseMP
// Removes `amount` MP from a Mosje. MP is clamped to 0 — it cannot go negative.
// If overflow would push below 0, the Mosje loses one level and carries the
// remainder into 100 MP (level regression). At level 0 excess damage is ignored.
// Defeat occurs only when a level-0 Mosje is sent to the Welloe pile via
// explicit game rules; see victoryChecker.
//
// Returns updated gameState.
// ─────────────────────────────────────────────────────────────
export function loseMP(gameState, playerId, slotIndex, amount, source = 'DRAIN') {
  if (amount <= 0) return gameState;

  const placeId = getActivePlaceId(gameState);

  if (placeId === 'place_the_void') {
    console.log('[MP] The Void active — loseMP blocked');
    return gameState;
  }

  if (placeId === 'place_momentum_factory' && source === 'ATTACK') {
    console.log('[MP] Momentum Factory active — ATTACK damage blocked');
    return gameState;
  }

  let lossAmount = amount;

  if (placeId === 'place_drain_zone' && source === 'DRAIN') {
    lossAmount += 10;
  }

  // Momentum Stabilizer: cap MP loss at 30 per single effect
  if (placeId === 'place_momentum_stabilizer') {
    lossAmount = Math.min(lossAmount, 30);
  }

  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) {
    console.log('[ENGINE] loseMP: no active Mosje at slot', slotIndex, 'for', playerId);
    return state;
  }

  if (placeId === 'place_zo_is_natuur' && (mosje.traits?.resilient || 0) >= 2) {
    lossAmount = Math.min(lossAmount, 25);
  }

  mosje.mp -= lossAmount;

  // Level regression — MP floor is 0.
  // Overflow below 0 costs one level and carries the remainder into 100 MP.
  // At level 0 excess damage is ignored; the effect already fired.
  while (mosje.mp < 0) {
    if (mosje.level === 0) {
      mosje.mp = 0;
      break;
    }
    const overflow = -mosje.mp;
    mosje.level -= 1;
    mosje.mp = 100 - overflow;
    console.log(`[ENGINE] ⬇️ ${mosje.name} level regression → Level ${mosje.level} | MP: ${mosje.mp}`);
  }

  // Track cumulative damage taken for Personal Quest requirements (Iron Will).
  state.players[playerId].totalDamageTaken =
    (state.players[playerId].totalDamageTaken || 0) + lossAmount;

  // Track per-turn damage for abilities that react to it (Alyssa, Parkour West).
  mosje.mpLostThisTurn = (mosje.mpLostThisTurn || 0) + lossAmount;

  console.log(`[ENGINE] 📉 ${mosje.name} loses ${lossAmount} MP (${source}) → now Level ${mosje.level} | ${mosje.mp} MP`);

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
