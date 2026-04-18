// questLogic.js — Checks whether a Quest's requirements are met
// and applies MP rewards or penalties after the dice roll.
//
// canAttemptPersonalQuest() is implemented here now (Phase 2 update).
// Full requirement/reward functions are filled in Phase 4.

console.log('[ABILITY] questLogic.js loaded');

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

  // activeSlots contains Mosje state objects with a cardId property
  const activeMosjes = player.activeSlots.filter(slot => slot !== null);
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
