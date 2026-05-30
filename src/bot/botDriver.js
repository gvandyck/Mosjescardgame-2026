// botDriver.js — Pure function. Runs the bot's full turn synchronously.
// Imports only from engine and data — never from multiplayer.
//
// Priority order:
//   1. Play Piecies from hand (all that fit)
//   2. Activate Piecies already on the field
//   3. Attempt General Quest
//   3b. Attempt Personal Quest (face-down from hand)
//   4. Play Places from hand
//   5. Activate Places already on the field (face-down)
//   6. Use Mosje ability
//   7. End turn (unconditional)

import {
  playPiecie,
  activatePiecie,
  playPlace,
  activatePlace,
  attemptGeneralQuest,
  attemptPersonalQuest,
  useMosjeAbility,
  endTurn,
} from '../engine/turnManager.js';
import { canAttemptGeneralQuest, canAttemptPersonalQuest, resolveQuest } from '../abilities/questLogic.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';
import { QUESTS } from '../data/quests.js';
import { MOSJES } from '../data/mosjes.js';
import { rollDie } from '../engine/deckEngine.js';

const PIECIE_LOOKUP = Object.fromEntries(PIECIES.map(c => [c.id, c]));
const PLACE_LOOKUP = Object.fromEntries(PLACES.map(c => [c.id, c]));
const QUEST_LOOKUP = Object.fromEntries(QUESTS.map(c => [c.id, c]));
const MOSJE_LOOKUP = Object.fromEntries(MOSJES.map(m => [m.id, m]));

/**
 * driveBotTurn
 * Executes the bot's full turn by calling the same turnManager.js action
 * functions a human calls. Returns the final state after endTurn.
 *
 * @param {object} gameState  - Current immutable game state (not mutated)
 * @param {string} botPlayerId - Player id of the bot (must be activePlayerId)
 * @returns {object} New game state after the bot's complete turn
 */
export function driveBotTurn(gameState, botPlayerId) {
  // Work on a local variable — never mutate the input argument
  let state = gameState;

  // ── Step 1: Play Piecies from hand ────────────────────────────────────────
  // Iterate a snapshot of the hand so splicing doesn't skip cards
  const handSnapshot = [...(state.players[botPlayerId]?.hand || [])];
  for (const cardRef of handSnapshot) {
    if (cardRef.type !== 'PIECIE') continue;
    const cardDef = PIECIE_LOOKUP[cardRef.cardId];
    if (!cardDef) continue;
    const result = playPiecie(state, botPlayerId, cardRef, cardDef);
    if (result.success) {
      state = result.state;
    } else if (result.error && /slot|full/i.test(result.error)) {
      break; // No more room — stop trying
    }
  }

  // ── Step 2: Activate Piecies already on the field ─────────────────────────
  const piecieSlots = state.players[botPlayerId]?.piecieSlots || [];
  for (let i = 0; i < piecieSlots.length; i++) {
    const slot = piecieSlots[i];
    if (!slot) continue;
    if (slot.type !== 'PIECIE') continue;
    if (slot.activated) continue;
    if (state.turnNumber < (slot.canActivateOnTurn ?? Infinity)) continue;
    const result = activatePiecie(state, botPlayerId, i);
    if (result.success) {
      state = result.state;
      // Re-read slots from updated state for subsequent iterations
      const updatedSlots = state.players[botPlayerId]?.piecieSlots || [];
      // Update local reference for remaining indices
      for (let j = i + 1; j < piecieSlots.length; j++) {
        piecieSlots[j] = updatedSlots[j] ?? null;
      }
    }
  }

  // ── Step 3: Attempt General Quest ─────────────────────────────────────────
  const questResult = attemptGeneralQuest(state);
  // attemptGeneralQuest already increments questsAttemptedThisTurn internally
  state = questResult.state;
  const questCard = questResult.questCard;

  if (questCard) {
    const questDef = QUEST_LOOKUP[questCard.cardId];
    if (questDef && canAttemptGeneralQuest(questDef, state, botPlayerId)) {
      const player = state.players[botPlayerId];
      const firstActiveMosjeSlotIndex = (player?.activeSlots || [])
        .findIndex(s => s && !s.isDefeated);
      const didSucceed = rollDie() >= 4;
      state = resolveQuest(state, botPlayerId, questDef, didSucceed, firstActiveMosjeSlotIndex);
      state = {
        ...state,
        sharedGeneralQuestDiscard: [...(state.sharedGeneralQuestDiscard || []), questCard],
      };
    } else {
      // Can't attempt — return quest to discard without resolving
      state = {
        ...state,
        sharedGeneralQuestDiscard: [...(state.sharedGeneralQuestDiscard || []), questCard],
      };
    }
  }

  // ── Step 3b: Attempt Personal Quest ───────────────────────────────────────
  const handAfterGeneral = state.players[botPlayerId]?.hand || [];
  for (const cardRef of handAfterGeneral) {
    if (cardRef.type !== 'QUEST') continue;
    const questDef = QUEST_LOOKUP[cardRef.cardId];
    if (!questDef) continue;
    if (questDef.questType !== 'PERSONAL') continue;
    if (canAttemptPersonalQuest(questDef, state, botPlayerId)) {
      // attemptPersonalQuest uses state.activePlayerId — must equal botPlayerId
      const pqResult = attemptPersonalQuest(state, cardRef.cardId);
      if (pqResult.eligible) {
        state = pqResult.state;
      }
    }
    break; // Only attempt the first eligible Personal Quest per turn
  }

  // ── Step 4: Play Places from hand ─────────────────────────────────────────
  const handAfterQuests = [...(state.players[botPlayerId]?.hand || [])];
  for (const cardRef of handAfterQuests) {
    if (cardRef.type !== 'PLACE') continue;
    const cardDef = PLACE_LOOKUP[cardRef.cardId];
    if (!cardDef) continue;
    const result = playPlace(state, botPlayerId, cardRef, cardDef);
    if (result.success) {
      state = result.state;
      break; // One Place per turn is sufficient
    }
  }

  // ── Step 5: Activate Places already on the field (face-down) ──────────────
  const slotsAfterPlace = state.players[botPlayerId]?.piecieSlots || [];
  for (let i = 0; i < slotsAfterPlace.length; i++) {
    const slot = slotsAfterPlace[i];
    if (!slot) continue;
    if (slot.type !== 'PLACE') continue;
    if (slot.activated) continue;
    if (state.turnNumber < (slot.canActivateOnTurn ?? Infinity)) continue;
    const result = activatePlace(state, botPlayerId, i);
    if (result.success) {
      state = result.state;
      break; // Only activate one Place per pass
    }
  }

  // ── Step 6: Use Mosje ability ──────────────────────────────────────────────
  const activeSlots = state.players[botPlayerId]?.activeSlots || [];
  for (const slot of activeSlots) {
    if (!slot || slot.isDefeated) continue;
    if (slot.abilityUsedThisTurn) continue;
    const mosjeDef = MOSJE_LOOKUP[slot.cardId];
    if (!mosjeDef?.abilityId) continue;
    const result = useMosjeAbility(state, botPlayerId, slot.cardId);
    if (result.success) {
      state = result.state;
    }
    break; // One ability per turn
  }

  // ── Step 7: End turn (unconditional) ──────────────────────────────────────
  state = endTurn(state);

  return state;
}
