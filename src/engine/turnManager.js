// turnManager.js — Controls the 4 turn phases:
// DRAW → MAIN → QUEST → END
//
// QUEST PHASE — Two options (player picks one, not both):
//
//   Option A — GENERAL Quest:
//     Draw 1 card from sharedGeneralQuestDeck.
//     Attempt with your active Mosje.
//     On success/fail: apply MP, send to sharedGeneralQuestDiscard.
//
//   Option B — PERSONAL Quest:
//     Play a PERSONAL Quest card from your hand.
//     Requires: requiredMosjeId Mosje is currently on your field.
//     On success/fail: apply MP, send to your personal discard.
//     Cannot attempt if the required Mosje is not on the field.
//
//   Only ONE Quest attempt allowed per turn (General OR Personal).
//   Exception: a card effect can grant a second attempt.
//
// Filled out fully in Phase 3.

console.log('[ENGINE] turnManager.js placeholder loaded');
