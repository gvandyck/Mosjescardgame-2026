// synergyResolver.js — Detects which Mosje synergy pairs are currently active.
// A synergy is active when BOTH named Mosjes are on the same player's field
// at the same time and neither is defeated.

import { MOSJES } from '../data/mosjes.js';

console.log('[ENGINE] synergyResolver.js loaded');

// ─────────────────────────────────────────────────────────────
// getActiveSynergies
// Returns an array of active synergy objects for a player.
// Each result: { mosjeAId, mosjeBId, synergyEffect }
//
// gameState — full game state
// playerId  — the player to check synergies for
// ─────────────────────────────────────────────────────────────
export function getActiveSynergies(gameState, playerId) {
  const player = gameState.players[playerId];
  if (!player) return [];

  const activeMosjeIds = player.activeSlots
    .filter(slot => slot !== null && !slot.isDefeated)
    .map(slot => slot.cardId);

  const synergies = [];
  const alreadyChecked = new Set();

  for (const mosjeId of activeMosjeIds) {
    const mosjeData = MOSJES.find(m => m.id === mosjeId);
    if (!mosjeData || !mosjeData.synergyWith) continue;

    for (const partnerId of mosjeData.synergyWith) {
      // Build a sorted key so we don't add the same pair twice
      const pairKey = [mosjeId, partnerId].sort().join('|');
      if (alreadyChecked.has(pairKey)) continue;
      alreadyChecked.add(pairKey);

      // Synergy triggers if the partner is on the field, OR if the acting
      // player has activated Synergy Chamber's once-per-turn partner waiver.
      if (activeMosjeIds.includes(partnerId) || player.synergyWaiverActive === true) {
        synergies.push({
          mosjeAId: mosjeId,
          mosjeBId: partnerId,
          synergyEffect: mosjeData.synergyEffect,
        });
        console.log(`[ENGINE] Synergy active: ${mosjeId} + ${partnerId} — ${mosjeData.synergyEffect}`);
      }
    }
  }

  if (synergies.length === 0) {
    console.log('[ENGINE] No synergies active for player:', playerId);
  }

  return synergies;
}

// ─────────────────────────────────────────────────────────────
// hasSynergy
// Quick check: returns true if two specific Mosjes have an
// active synergy for the given player.
// ─────────────────────────────────────────────────────────────
export function hasSynergy(gameState, playerId, mosjeAId, mosjeBId) {
  const synergies = getActiveSynergies(gameState, playerId);
  return synergies.some(
    s => (s.mosjeAId === mosjeAId && s.mosjeBId === mosjeBId) ||
         (s.mosjeAId === mosjeBId && s.mosjeBId === mosjeAId)
  );
}

// ─────────────────────────────────────────────────────────────
// hasFoodDoubleSynergy
// Specific helper for the Binti + Coert synergy:
// FOOD cards give double MP.
// Called by piecieEffects.js before applying FOOD card gains.
// ALL Coert variants count (2026-07-12 ruling) — matches Binti's
// synergyWith list in src/data/mosjes.js.
// ─────────────────────────────────────────────────────────────
const FOOD_SYNERGY_COERTS = [
  'mosje_coert_tech',
  'mosje_coert_kasteluck',
  'mosje_coert_kastelein',
];

export function hasFoodDoubleSynergy(gameState, playerId) {
  return FOOD_SYNERGY_COERTS.some(
    coertId => hasSynergy(gameState, playerId, 'mosje_binti', coertId)
  );
}

// ─────────────────────────────────────────────────────────────
// hasAlyssaJiscaSynergy
// Specific helper for the Alyssa + Jisca "party amplifier" synergy
// (Phase 38, D-01..D-05): true when Jisca is paired with EITHER Alyssa
// variant on the given player's field. Consumed by the wave-2 engine
// wiring (Alyssa's +10/turn trickle bonus, Jisca's first-Piecie-per-turn
// +10 bonus) — this file only detects the pair, it does not apply MP.
// ─────────────────────────────────────────────────────────────
const ALYSSA_IDS = [
  'mosje_alyssa_bulldozer',
  'mosje_alyssa_fissa',
];

export function hasAlyssaJiscaSynergy(gameState, playerId) {
  return ALYSSA_IDS.some(
    alyssaId => hasSynergy(gameState, playerId, 'mosje_jisca', alyssaId)
  );
}
