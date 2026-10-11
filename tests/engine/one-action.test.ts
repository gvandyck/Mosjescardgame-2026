// @ts-nocheck
// E13 - one action per Mosje per turn: attack OR Quest; sideways / cooldown refused at engine level.
import { describe, it, expect } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { rollQuestAttempt } from "../../src/engine/quests/rollQuestAttempt.js";
import { resolveQuestAttempt } from "../../src/engine/quests/resolveQuestAttempt.js";
import { attackMosje } from "../../src/engine/actions/attackMosje.js";

const mk = (over = {}) => Object.assign(createMosjeSlot(MOSJES[0], { level: 1, mp: 50 }), { entryProtected: false }, over);
function build(p1 = {}, a = {}, b = {}) {
  const stacks = {};
  for (const id of ["FIGHTING", "DIGITAL", "ARTISTIC"]) stacks[id] = { deck: ["quest_x"], faceUp: "quest_tough_it_out", tokens: 0, discard: [] };
  return makeEngineState({
    questStacks: stacks,
    players: { player_1: { activeSlots: [mk(a), mk(b)], ...p1 }, player_2: { activeSlots: [mk(), null] } },
  });
}
const quest = (s, i = 0) => rollQuestAttempt(s, "player_1", { slotIndex: i, stackId: "FIGHTING", rng: () => 0.7 });
const attack = (s, i = 0) => attackMosje(s, "player_1", { attackerSlotIndex: i, targetPlayerId: "player_2", targetSlotIndex: 0 });

describe("one action per Mosje (E13)", () => {
  it("an attacked Mosje cannot Quest", () => {
    const r = attack(build());
    expect(r.ok).toBe(true);
    const q = quest(r.state);
    expect(q.ok).toBe(false);
    expect(q.error).toMatch(/already acted/);
  });
  it("a Mosje that tried a Quest cannot attack", () => {
    const q = quest(build());
    expect(q.ok).toBe(true);
    const a = attack(resolveQuestAttempt(q.state, q.pending).state);
    expect(a.ok).toBe(false);
    expect(a.error).toMatch(/already acted/);
  });
  it("a second Mosje of the same player can still act", () => {
    const q = quest(build());
    const st = resolveQuestAttempt(q.state, q.pending).state;
    expect(attack(st, 1).ok).toBe(true);
    expect(rollQuestAttempt(st, "player_1", { slotIndex: 1, stackId: "DIGITAL", rng: () => 0.7 }).ok).toBe(true);
  });
  it("sideways Mosjes cannot act", () => {
    const s = build({}, { sideways: true });
    expect(quest(s).ok).toBe(false);
    expect(attack(s).ok).toBe(false);
  });
  it("cooldown turn blocks both actions", () => {
    const s = build({ cooldownTurn: true });
    const q = quest(s);
    const a = attack(s);
    expect([q.ok, a.ok]).toEqual([false, false]);
    expect(q.error).toBe("Cooldown turn: only face-down Piecies");
    expect(a.error).toBe("Cooldown turn: only face-down Piecies");
  });
  it("not your turn is refused", () => {
    const s = build();
    s.activePlayerId = "player_2";
    expect(quest(s).ok).toBe(false);
  });
});
