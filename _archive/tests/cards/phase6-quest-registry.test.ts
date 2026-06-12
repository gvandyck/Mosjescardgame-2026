/**
 * Phase 6 Step 6 — Registry audit for quest cards.
 * Verifies all 36 general quest cards are registered, well-formed, and meet the
 * QuestDefinition contract.
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { clearRegistry } from "../../src/cards/registry/card-registry.js";
import { getCardsByCategory } from "../../src/cards/registry/card-registry.js";

// Side-effect import: registers all quest cards
import "../../src/cards/quests/index.js";

import type { QuestDefinition } from "../../src/cards/schema/quest-definition.js";

const EXPECTED_QUEST_IDS = [
  // Physical
  "quest_arm_wrestling",
  "quest_parkour_challenge",
  "quest_endurance_test",
  "quest_sprint_race",
  // Mental
  "quest_strategy_puzzle",
  "quest_calculate_odds",
  "quest_master_plan",
  "quest_quick_thinking",
  // Social
  "quest_inspire_crowd",
  "quest_form_alliance",
  "quest_negotiation",
  "quest_team_building",
  // Creative
  "quest_artistic_expression",
  "quest_improvise",
  "quest_create_masterpiece",
  "quest_lucky_break",
  // Technical
  "quest_debug_system",
  "quest_hack_mainframe",
  "quest_build_gadget",
  "quest_precision_work",
  // Resilient
  "quest_survive_storm",
  "quest_endure_pain",
  "quest_never_give_up",
  "quest_tough_it_out",
  // Mixed / Special
  "quest_leap_of_faith",
  "quest_momentum_master",
  "quest_the_gauntlet",
  "quest_ultimate_challenge",
  "quest_speed_run",
  "quest_sustained_assault",
  "quest_perfect_timing",
  "quest_elimination_challenge",
  "quest_chain_master",
  "quest_synergy_mastery",
  "quest_regelaar",
  "quest_late_night_questing",
  "quest_larry_temmen",
  "quest_geen_raad_vraag_aad",
  "quest_parkeren_delft",
  "quest_shotje_obby",
  // Personal
  "quest_west_perfect_read",
  "quest_personal_iron_will",
  "quest_personal_perfect_sync",
  "quest_personal_lucky_crescendo",
] as const;

afterAll(() => {
  clearRegistry();
});

describe("phase6 quest registry audit", () => {
  it(`registers exactly ${EXPECTED_QUEST_IDS.length} quest cards`, () => {
    const quests = getCardsByCategory("quest");
    expect(quests).toHaveLength(EXPECTED_QUEST_IDS.length);
  });

  it("registers all expected quest IDs", () => {
    const quests = getCardsByCategory("quest");
    const registeredIds = new Set(quests.map((q) => q.id));
    for (const id of EXPECTED_QUEST_IDS) {
      expect(registeredIds.has(id as string), `Missing quest: ${id}`).toBe(true);
    }
  });

  it("every quest has category 'quest'", () => {
    const quests = getCardsByCategory("quest");
    for (const q of quests) {
      expect(q.category, `${q.id} has wrong category`).toBe("quest");
    }
  });

  it("every quest has a scope of general or personal", () => {
    const quests = getCardsByCategory("quest") as ReadonlyArray<QuestDefinition>;
    for (const q of quests) {
      expect(["general", "personal"]).toContain(q.scope);
    }
  });

  it("every quest has a non-empty onSuccess array", () => {
    const quests = getCardsByCategory("quest") as ReadonlyArray<QuestDefinition>;
    for (const q of quests) {
      expect(q.onSuccess.length, `${q.id} has empty onSuccess`).toBeGreaterThan(0);
    }
  });

  it("every quest with a roll has valid thresholds (1-6) for all three star levels", () => {
    const quests = getCardsByCategory("quest") as ReadonlyArray<QuestDefinition>;
    for (const q of quests) {
      if (q.roll === undefined) continue;
      const { thresholds } = q.roll;
      for (const key of ["1", "2", "3"] as const) {
        const t = thresholds[key];
        expect(t, `${q.id} threshold[${key}] out of range`).toBeGreaterThanOrEqual(1);
        expect(t, `${q.id} threshold[${key}] out of range`).toBeLessThanOrEqual(6);
      }
    }
  });

  it("every general quest has no requiredMosjeCardId", () => {
    const quests = getCardsByCategory("quest") as ReadonlyArray<QuestDefinition>;
    const general = quests.filter((q) => q.scope === "general");
    for (const q of general) {
      expect(q.requiredMosjeCardId, `${q.id} general quest should not have requiredMosjeCardId`).toBeUndefined();
    }
  });

  it("every personal quest has a requiredMosjeCardId", () => {
    const quests = getCardsByCategory("quest") as ReadonlyArray<QuestDefinition>;
    const personal = quests.filter((q) => q.scope === "personal");
    for (const q of personal) {
      expect(q.requiredMosjeCardId, `${q.id} personal quest missing requiredMosjeCardId`).toBeDefined();
    }
  });

  it("all quest subcategories are known values", () => {
    const knownSubcategories = new Set([
      "PHYSICAL", "MENTAL", "SOCIAL", "CREATIVE", "TECHNICAL", "RESILIENT", "MIXED"
    ]);
    const quests = getCardsByCategory("quest");
    for (const q of quests) {
      if (q.subcategory !== undefined) {
        expect(knownSubcategories.has(q.subcategory), `${q.id} unknown subcategory: ${q.subcategory}`).toBe(true);
      }
    }
  });
});
