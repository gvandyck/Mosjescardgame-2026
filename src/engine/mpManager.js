// mpManager.js — All MP gain, loss, and level-up calculations.
// Pure logic — no visuals, no Firebase.
// All functions return an updated copy of gameState (never mutate directly).

import { roundToFive } from './roundToFive.js';

console.log('[ENGINE] mpManager.js loaded');

function getActivePlaceId(gameState) {
  return gameState?.activePlace || gameState?.sharedPlaceSlot?.cardId || null;
}

function isCoertMosje(mosje) {
  return String(mosje?.cardId || mosje?.mosjeId || '').toLowerCase().includes('coert');
}

function isQuestDamageSource(source) {
  const label = String(source || '');
  return label.startsWith('QUEST') && !label.includes('COST');
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
// `allowLevelUp` — only Quest rewards permanently level a Mosje. Non-quest gains
// (turn trickle, ability/piecie rewards) pass allowLevelUp:false → MP is capped at
// 100 with NO level-up. Quest callers omit it (defaults true) to keep leveling.
export function gainMP(gameState, playerId, slotIndex, amount, source = 'GAIN', { allowLevelUp = true } = {}) {
  if (amount <= 0) return gameState;

  const placeId = getActivePlaceId(gameState);
  if (placeId === 'place_the_void') {
    console.log('[MP] The Void active — gainMP blocked');
    return gameState;
  }

  const gainAmount = amount;

  const state = deepCloneState(gameState);
  const mosje = state.players[playerId].activeSlots[slotIndex];
  if (!mosje || mosje.isDefeated) {
    console.log('[ENGINE] gainMP: no active Mosje at slot', slotIndex, 'for', playerId);
    return state;
  }

  if (allowLevelUp) {
    // Quest path: add then convert ≥100 into Level(s) (mp resets < 100).
    mosje.mp += gainAmount;
    console.log(`[ENGINE] 💥 ${mosje.name} gains ${gainAmount} MP (${source}) → now ${mosje.mp} MP`);
    return checkLevelUp(state, playerId, slotIndex);
  }
  // Non-quest path: cap at 100, never level up.
  mosje.mp = Math.min(100, mosje.mp + gainAmount);
  console.log(`[ENGINE] 💥 ${mosje.name} gains ${gainAmount} MP (${source}, capped) → now ${mosje.mp} MP`);
  return state;
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

  if (placeId === 'place_coerts_caravan' && isCoertMosje(mosje) && isQuestDamageSource(source)) {
    const currentTurn = state.turnNumber ?? 0;
    const shield = mosje._coertsCaravanQuestShield || { turnNumber: currentTurn, used: 0 };
    const usedThisTurn = shield.turnNumber === currentTurn ? shield.used || 0 : 0;
    const remainingShield = Math.max(0, 40 - usedThisTurn);
    const prevented = Math.min(lossAmount, remainingShield);
    if (prevented > 0) {
      lossAmount = Math.max(0, lossAmount - prevented);
      mosje._coertsCaravanQuestShield = {
        turnNumber: currentTurn,
        used: usedThisTurn + prevented,
      };
      console.log(`[MP] Coert's Caravan: prevented ${prevented} Quest damage for ${mosje.name} (${40 - (usedThisTurn + prevented)} shield left this turn)`);
    }
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
        opp.activeSlots[osi].mp = Math.max(0, opp.activeSlots[osi].mp - lossAmount);
        console.log('[MP] Drain Reversal: reflected', lossAmount, 'drain to opponent');
      }
    }
    delete state._snelleFlags.drainReversal[playerId];
    return state;
  }

  // MP_LOSS_HALVED: statusEffect pushed by Bowie & Stormey, Tony, Gekke Vogels, KatjeGang, ViannaPoes
  const halvingEffect = mosje.statusEffects?.find(
    e => e.type === 'MP_LOSS_HALVED' && e.turnsLeft > 0
  );
  if (halvingEffect) {
    lossAmount = roundToFive(lossAmount / 2);  // game rule: MP stays on the 5-grid
    halvingEffect.turnsLeft -= 1;
    console.log('[MP] MP_LOSS_HALVED: loss halved to', lossAmount);
  }

  // MP_LOSS_REDUCTION: pushed by Laat me chillen (value:20), FF Haaltje Nemen (value:20/30)
  const reductionEffect = mosje.statusEffects?.find(
    e => e.type === 'MP_LOSS_REDUCTION' && e.turnsLeft > 0
  );
  if (reductionEffect) {
    lossAmount = Math.max(0, lossAmount - reductionEffect.value);
    reductionEffect.turnsLeft -= 1;
    console.log('[MP] MP_LOSS_REDUCTION: loss reduced by', reductionEffect.value, '→', lossAmount);
  }
  // Consolidate The Protector snelle flag into same read point
  if (snelleFlags.mpLossReduction?.[playerId]) {
    lossAmount = Math.max(0, lossAmount - snelleFlags.mpLossReduction[playerId]);
    console.log('[MP] Snelle Protector: loss reduced by', snelleFlags.mpLossReduction[playerId]);
    delete state._snelleFlags.mpLossReduction[playerId];
  }

  // ── End snelle interception ───────────────────────────────────────────────

  mosje.mp -= lossAmount;

  // Level regression — MP floor is 0.
  // Overflow below 0 costs one level and carries the remainder into 100 MP.
  // At Level 0, dropping below 0 from a damaging effect DEFEATS the Mosje
  // (canonical ruling phase0-rulings.md:118). The slot is flagged here and
  // swept by applyPendingDefeats() inside checkVictory(). Guarded MP-cost
  // payments never reach below 0, so they never trigger this.
  while (mosje.mp < 0) {
    if (mosje.level === 0) {
      mosje.mp = 0;
      mosje._pendingDefeat = true;
      console.log(`[ENGINE] 💀 ${mosje.name} reduced below 0 at Level 0 → pending defeat`);
      break;
    }
    const overflow = -mosje.mp;
    mosje.level -= 1;
    mosje.mp = 100 - overflow;
    console.log(`[ENGINE] ⬇️ ${mosje.name} level regression → Level ${mosje.level} | MP: ${mosje.mp}`);
  }

  // Safety clamp: ensure MP is never negative (should be caught by while loop above)
  mosje.mp = Math.max(0, mosje.mp);

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

  // Level 3 is the ceiling — reaching it is an instant win (finalised by the
  // checkVictory call that follows every quest/MP change). A Mosje can never
  // exceed Level 3: the loop stops the moment it lands on 3, keeping the
  // leftover MP (e.g. Lvl 2 / 90 MP + 80 → Lvl 3 / 70 MP). The `level < 3`
  // guard also prevents a second gain in the same turn from rolling 3 → 4.
  while (mosje.mp >= 100 && mosje.level < 3) {
    mosje.mp -= 100;
    mosje.level += 1;
    console.log(`[ENGINE] ⬆️ ${mosje.name} levelled up! Now Level ${mosje.level} | MP carried over: ${mosje.mp}`);

    if (mosje.level >= 3) {
      console.log(`[ENGINE] 🏆 ${mosje.name} reached Level 3 — victory condition met!`);
      // victoryChecker.js will detect and finalise the win.
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
