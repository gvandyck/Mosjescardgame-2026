// questLogic.js — Checks whether a Quest's requirements are met
// and applies MP rewards or penalties after the dice roll.
//
// canAttemptPersonalQuest() is implemented here now (Phase 2 update).
// Full requirement/reward functions are filled in Phase 4.

console.log('[ABILITY] questLogic.js loaded');

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function getFirstActiveMosjeSlotIndex(player) {
  return player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
}

function getFirstActiveMosje(player) {
  const idx = getFirstActiveMosjeSlotIndex(player);
  return idx >= 0 ? player.activeSlots[idx] : null;
}

function applyQuestMpResult(mosje, questCard, didSucceed) {
  if (didSucceed) {
    mosje.mp += questCard.successMP;
    return;
  }
  const failValue = typeof questCard.failMP === 'number'
    ? questCard.failMP
    : (typeof questCard.failureMP === 'number' ? questCard.failureMP : 0);
  mosje.mp += failValue;
}

// General Quests can be attempted by any active Mosje with non-negative MP.
export function canAttemptGeneralQuest(questCard, gameState, playerId) {
  console.log('[QUEST] Checking General Quest eligibility:', questCard.id);
  const player = gameState.players[playerId];
  if (!player) return false;
  const activeMosje = getFirstActiveMosje(player);
  if (!activeMosje) {
    console.log('[QUEST] No active Mosje on field — cannot attempt General Quest');
    return false;
  }
  if (activeMosje.mp < 0) {
    console.log('[QUEST] Active Mosje has negative MP — cannot attempt General Quest');
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// canAttemptPersonalQuest
// Checks whether the player has the required Mosje on the field
// before they are allowed to attempt a Personal Quest.
//
// questCard   — the PERSONAL Quest card object from QUESTS array
// gameState   — the full game state object
// playerId    — the id of the player trying to attempt
//
// Returns true if allowed, false if not.
// ─────────────────────────────────────────────────────────────
export function canAttemptPersonalQuest(questCard, gameState, playerId) {
  console.log('[QUEST] Checking Personal Quest eligibility:', questCard.id);

  const player = gameState.players[playerId];
  if (!player) {
    console.log('[QUEST] Player not found:', playerId);
    return false;
  }

  // activeSlots contains Mosje state objects with a cardId property.
  // Defeated Mosjes do NOT count as active for Personal Quest checks.
  const activeMosjes = player.activeSlots.filter(
    slot => slot !== null && !slot.isDefeated
  );
  const hasRequiredMosje = activeMosjes.some(
    mosje => mosje.cardId === questCard.requiredMosjeId
  );

  if (!hasRequiredMosje) {
    console.log(
      '[QUEST] Required Mosje not on field — cannot attempt.',
      'Needs:', questCard.requiredMosjeId
    );
    return false;
  }

  console.log('[QUEST] Personal Quest eligible — required Mosje is on field.');
  return true;
}

// Resolves the MP result of a quest and updates completion counters.
// The caller provides didSucceed after rolling/checking requirements.
export function resolveQuest(gameState, playerId, questCard, didSucceed) {
  const state = cloneState(gameState);
  const player = state.players[playerId];
  if (!player) {
    console.log('[QUEST] resolveQuest: player not found:', playerId);
    return state;
  }

  const slotIndex = getFirstActiveMosjeSlotIndex(player);
  if (slotIndex < 0) {
    console.log('[QUEST] resolveQuest: no active Mosje found for player:', playerId);
    return state;
  }

  const mosje = player.activeSlots[slotIndex];
  applyQuestMpResult(mosje, questCard, didSucceed);

  if (didSucceed) {
    player.questsCompleted += 1;
    player.questsCompletedThisTurn += 1;
    console.log('[QUEST] Quest success:', questCard.id, '| MP now:', mosje.mp);
  } else {
    console.log('[QUEST] Quest failed:', questCard.id, '| MP now:', mosje.mp);
  }

  return state;
}
