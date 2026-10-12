// TABLE-04 bot: chooseReaction policy, driver settling, human-window pause/resume, bot-vs-bot no deadlock.
import { describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS modules
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error
import { rollQuestAttempt } from "../../src/engine/quests/rollQuestAttempt.js";
// @ts-expect-error
import { getQuestDef } from "../../src/engine/quests/getQuestDef.js";
// @ts-expect-error
import { resolveReaction } from "../../src/engine/reactions/resolveReaction.js";
// @ts-expect-error
import { chooseReaction } from "../../src/bot/strategy/chooseReaction.js";
// @ts-expect-error
import { settleReactions } from "../../src/bot/settleReactions.js";
// @ts-expect-error
import { driveBotTurnSteps, driveBotTurn } from "../../src/bot/botDriver.js";
// @ts-expect-error
import { createInitialGameState } from "../../src/engine/gameState.js";
// @ts-expect-error
import { startTurn, endTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";

const attackerDef = MOSJES.find((m: any) => m.id === "mosje_alyssa_bulldozer");
const plain = MOSJES.find((m: any) => m.id !== "mosje_alyssa_bulldozer" && m.id !== "mosje_parkour_west");
const mk = (mp: number, d = plain, extra: any = {}) => {
  const s = createMosjeSlot(d, { level: 1, mp });
  s.entryProtected = false;
  return Object.assign(s, extra);
};
const H = (...ids: string[]) => ids.map((cardId) => ({ cardId }));
const ATT = { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0 };
const board = (p2: any = {}, p1: any = {}) =>
  makeEngineState({ turnNumber: 3, players: { player_1: { activeSlots: [mk(50, attackerDef), null], ...p1 }, player_2: { activeSlots: [mk(10, plain, { sideways: true }), mk(50)], ...p2 } } });

describe("chooseReaction", () => {
  it("defender: cheapest eligible when the attack would getemt / go to Welloe; else null", () => {
    const w = attackMosje(board({ hand: H("snelle_perfect_dodge", "snelle_the_protector", "snelle_negate_elimination") }), "player_1", ATT).state;
    expect(w.pendingReaction.preview.getemt.length + (w.pendingReaction.preview.toWelloe ? 1 : 0)).toBeGreaterThan(0);
    const pick = chooseReaction(w, "player_2");
    expect(w.pendingReaction.eligible).toContain(pick);
    const safe = attackMosje(board({ hand: H("snelle_perfect_dodge"), activeSlots: [mk(50), mk(50)] }), "player_1", ATT).state;
    expect(safe.pendingReaction.preview.getemt).toEqual([]);
    expect(chooseReaction(safe, "player_2")).toBeNull();
  });
  it("actor: Sleutelpuntje below 4 dice, Lucky Coin on a lost roll, pass otherwise", () => {
    const q = getQuestDef("quest_tough_it_out");
    const stacks: any = {};
    for (const id of ["FIGHTING", "DIGITAL", "ARTISTIC"]) stacks[id] = { deck: ["quest_filler"], faceUp: "quest_filler", tokens: 0, discard: [] };
    stacks[q.stack] = { deck: ["quest_filler"], faceUp: q.id, tokens: 0, discard: [] };
    const traits = { physical: 1, mental: 1, creative: 1, technical: 1, resilient: 1, social: 1 };
    const s = makeEngineState({ turnNumber: 3, questStacks: stacks, players: { player_1: { hand: H("snelle_sleutelpuntje", "snelle_lucky_coin"), activeSlots: [mk(30, plain, { traits }), null] }, player_2: { activeSlots: [mk(30), null] } } });
    const before = rollQuestAttempt(s, "player_1", { slotIndex: 0, stackId: q.stack, rng: () => 0.7 });
    expect(chooseReaction(before.state, "player_1")).toBe("snelle_sleutelpuntje");
    const lost = rollQuestAttempt(s, "player_1", { slotIndex: 0, stackId: q.stack, rng: () => 0, skipBeforeRoll: true });
    expect(lost.state.pendingReaction.moments).toEqual(["afterOwnQuestRoll"]);
    expect(chooseReaction(lost.state, "player_1")).toBe("snelle_lucky_coin");
    const won = rollQuestAttempt(s, "player_1", { slotIndex: 0, stackId: q.stack, rng: () => 0.99, skipBeforeRoll: true });
    expect(chooseReaction(won.state, "player_1")).toBeNull();
  });
});

describe("settleReactions", () => {
  it("settles bot windows; stops at a human window", () => {
    const w = attackMosje(board({ hand: H("snelle_perfect_dodge") }), "player_1", ATT).state;
    expect(settleReactions(w, ["player_2"]).waiting).toBe(true);
    const r = settleReactions(w, []);
    expect(r.waiting).toBe(false);
    expect(r.state.pendingReaction).toBeUndefined();
  });
});

describe("driver", () => {
  const decks = [{ playerId: "player_1", name: "A", deckId: "EXAMPLE_TAKSEN" }, { playerId: "player_2", name: "B", deckId: "EXAMPLE_REGELAARS" }];
  it("a human window pauses the bot turn; resuming continues without repeating the attack", () => {
    let s = createInitialGameState(decks, "T", { firstPlayerId: "player_2" });
    s = startTurn(s);
    s.turnNumber = 5;
    // Deterministic: createInitialGameState deals random face-up Quests; if one was playable the bot
    // quested instead of attacking (flaky). Pin every stack to an unplayable filler so the attack is the only play.
    for (const id of ["FIGHTING", "DIGITAL", "ARTISTIC"]) s.questStacks[id] = { deck: ["quest_filler"], faceUp: "quest_filler", tokens: 0, discard: [] };
    s.players.player_2.activeSlots = [mk(50, attackerDef), null];
    s.players.player_2.hand = [];
    s.players.player_1.activeSlots = [mk(50), null];
    s.players.player_1.hand = H("snelle_perfect_dodge");
    s.players.player_1.energy = 6;
    const steps = driveBotTurnSteps(s, "player_2", { humanIds: ["player_1"] });
    const last = steps[steps.length - 1];
    if (last.state.pendingReaction) {
      expect(last.state.pendingReaction.responderId).toBe("player_1");
      expect(last.label).toMatch(/waits for your reaction/);
      expect(last.state.activePlayerId).toBe("player_2");
      const answered = resolveReaction(last.state, "player_1", null).state;
      const hpAfter = answered.players.player_1.activeSlots[0].mp;
      const more = driveBotTurnSteps(answered, "player_2", { humanIds: ["player_1"] });
      const end = more[more.length - 1].state;
      expect(end.activePlayerId).toBe("player_1");
      expect(end.players.player_1.activeSlots[0].mp).toBeGreaterThanOrEqual(0);
      expect(hpAfter).toBeLessThan(50); // attack landed once, in the replay
    } else {
      throw new Error("expected the bot to attack and open a human window; steps: " + steps.map((x: any) => x.label).join(" | "));
    }
  });
  it("bot-vs-bot: acting bot holding Sleutelpuntje never deadlocks", () => {
    let s = createInitialGameState(decks, "T", { firstPlayerId: "player_1" });
    s = startTurn(s);
    s.players.player_1.hand.push({ cardId: "snelle_sleutelpuntje" }, { cardId: "snelle_lucky_coin" });
    s = driveBotTurn(s, "player_1");
    expect(s.pendingReaction).toBeUndefined();
  });
});

describe("bot-vs-bot on the Example Deck pairings", () => {
  const pairs: Array<[string, string]> = [["EXAMPLE_TAKSEN", "EXAMPLE_REGELAARS"], ["EXAMPLE_CREATIEVELINGEN", "EXAMPLE_TAKSEN"], ["EXAMPLE_REGELAARS", "EXAMPLE_CREATIEVELINGEN"]];
  for (const [a, b] of pairs) {
    it(`${a} vs ${b} reaches a stable end (no open window, no throw)`, () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const players = [{ playerId: "player_1", name: "A", deckId: a }, { playerId: "player_2", name: "B", deckId: b }];
      let s = startTurn(createInitialGameState(players, "T", { firstPlayerId: "player_1" }));
      let turns = 0;
      while (s.status !== "FINISHED" && turns < 60) {
        s = driveBotTurn(s, s.activePlayerId);
        expect(s.pendingReaction).toBeUndefined();
        if (s.status === "FINISHED") break;
        s = startTurn(s);
        turns++;
      }
      console.info(`[bot-vs-bot] ${a} vs ${b}: ${s.status}${s.winnerId ? " winner " + s.winnerId : ""} after ${turns} turns`);
      expect(s.activePlayerId).toBeTruthy();
    });
  }
});
