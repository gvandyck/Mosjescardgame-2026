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

// ─────────────────────────────────────────────────────────────
// getQuestDiceThreshold
// Returns the minimum die result (1–6) needed for success.
// A return value of 7 means the quest cannot be attempted
// (e.g. Artistic Expression without the required trait).
//
// questCard    — full quest card definition from QUESTS data
// activeMosje  — the live Mosje slot object (has .traits)
// ─────────────────────────────────────────────────────────────
export function getQuestDiceThreshold(questCard, activeMosje) {
  const traits = activeMosje?.traits || {};

  switch (questCard.requirementId) {
    case 'quest_req_arm_wrestling': {
      const phys = traits.physical || 0;
      if (phys >= 3) return 2;
      if (phys >= 2) return 3;
      return 5;
    }
    case 'quest_req_quick_thinking': {
      const mental = traits.mental || 0;
      if (mental >= 3) return 3;
      if (mental >= 2) return 4;
      return 5;
    }
    case 'quest_req_artistic_expression': {
      const creative = traits.creative || 0;
      // Missing creative trait → impossible (threshold beyond max roll)
      return creative >= 2 ? 4 : 7;
    }
    case 'quest_req_leap_of_faith':
    default:
      return 4;
  }
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

// ─────────────────────────────────────────
// QUEST REQUIREMENT STUB FUNCTIONS
// All return { canAttempt: true } by default until implemented.
// ─────────────────────────────────────────

function _questStub(id) {
  console.log(`[STUB] quest req: ${id}`);
  return { canAttempt: true };
}

export function quest_req_parkour_challenge(questCard, mosje) { return _questStub('parkour_challenge'); }
export function quest_req_endurance_test(questCard, mosje) { return _questStub('endurance_test'); }
export function quest_req_sprint_race(questCard, mosje) { return _questStub('sprint_race'); }
export function quest_req_strategy_puzzle(questCard, mosje) { return _questStub('strategy_puzzle'); }
export function quest_req_calculate_odds(questCard, mosje) { return _questStub('calculate_odds'); }
export function quest_req_master_plan(questCard, mosje) { return _questStub('master_plan'); }
export function quest_req_inspire_crowd(questCard, mosje) { return _questStub('inspire_crowd'); }
export function quest_req_form_alliance(questCard, mosje) { return _questStub('form_alliance'); }
export function quest_req_negotiation(questCard, mosje) { return _questStub('negotiation'); }
export function quest_req_team_building(questCard, mosje) { return _questStub('team_building'); }
export function quest_req_improvise(questCard, mosje) { return _questStub('improvise'); }
export function quest_req_create_masterpiece(questCard, mosje) { return _questStub('create_masterpiece'); }
export function quest_req_lucky_break(questCard, mosje) { return _questStub('lucky_break'); }
export function quest_req_debug_system(questCard, mosje) { return _questStub('debug_system'); }
export function quest_req_hack_mainframe(questCard, mosje) { return _questStub('hack_mainframe'); }
export function quest_req_build_gadget(questCard, mosje) { return _questStub('build_gadget'); }
export function quest_req_precision_work(questCard, mosje) { return _questStub('precision_work'); }
export function quest_req_survive_storm(questCard, mosje) { return _questStub('survive_storm'); }
export function quest_req_endure_pain(questCard, mosje) { return _questStub('endure_pain'); }
export function quest_req_never_give_up(questCard, mosje) { return _questStub('never_give_up'); }
export function quest_req_tough_it_out(questCard, mosje) { return _questStub('tough_it_out'); }
export function quest_req_momentum_master(questCard, mosje) { return _questStub('momentum_master'); }
export function quest_req_the_gauntlet(questCard, mosje) { return _questStub('the_gauntlet'); }
export function quest_req_ultimate_challenge(questCard, mosje) { return _questStub('ultimate_challenge'); }
export function quest_req_speed_run(questCard, mosje) { return _questStub('speed_run'); }
export function quest_req_sustained_assault(questCard, mosje) { return _questStub('sustained_assault'); }
export function quest_req_perfect_timing(questCard, mosje) { return _questStub('perfect_timing'); }
export function quest_req_elimination_challenge(questCard, mosje) { return _questStub('elimination_challenge'); }
export function quest_req_chain_master(questCard, mosje) { return _questStub('chain_master'); }
export function quest_req_synergy_mastery(questCard, mosje) { return _questStub('synergy_mastery'); }
export function quest_req_regelaar(questCard, mosje) { return _questStub('regelaar'); }
export function quest_req_late_night_questing(questCard, mosje) { return _questStub('late_night_questing'); }
export function quest_req_larry_temmen(questCard, mosje) { return _questStub('larry_temmen'); }
export function quest_req_geen_raad_vraag_aad(questCard, mosje) { return _questStub('geen_raad_vraag_aad'); }
export function quest_req_parkeren_delft(questCard, mosje) { return _questStub('parkeren_delft'); }
export function quest_req_shotje_obby(questCard, mosje) { return _questStub('shotje_obby'); }

