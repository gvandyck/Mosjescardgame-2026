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
// @ts-expect-error
import { getPower } from "../../src/engine/mp/getPower.js";
// @ts-expect-error
import { pickDefensiveSnelle } from "../../src/bot/strategy/pickDefensiveSnelle.js";

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

// BOT-03 (61-07): defender reactions are chosen by survival and price. Windows are hand-built (the preview a real attack
// shows is checked against the engine in the last case); the bot is player_2, the actor player_1.
describe("pickDefensiveSnelle", () => {
  const BOT = "player_2";
  const L = (mp: number, level = 1, extra: any = {}) => mk(mp, plain, { level, ...extra });
  const none = { getemt: [] as number[], toWelloe: false, mpLoss: {}, welloeSlots: [] as number[] };
  const piecieHit = { type: "activatePiecie", args: ["player_1", 0] };
  // A bot window: `field` is the bot's board, `extra` overrides the state (`extra.bot` the bot's own fields).
  const win = (field: any[], moments: string[], eligible: string[], preview: any, extra: any = {}, action: any = { type: "attack", args: ["player_1", ATT] }) => {
    const { bot, ...rest } = extra;
    return makeEngineState({ turnNumber: 3, activePlayerId: "player_1", ...rest,
      players: { player_1: { activeSlots: [mk(50, attackerDef), null] }, [BOT]: { activeSlots: field, ...(bot || {}) } },
      pendingReaction: { id: "r1", responderId: BOT, actorId: "player_1", moments, eligible, preview: { ...none, ...preview }, action, queue: [] } });
  };
  const hit = (field: any[], loss: number, eligible: string[], extra: any = {}) =>
    win(field, ["attacked", "wouldLoseMp"], eligible, { getemt: loss >= field[0].mp ? [0] : [], mpLoss: { 0: loss } }, extra);
  const targeted = (field: any[], loss: number, eligible: string[], extra: any = {}) =>
    win(field, ["targeted", "wouldLoseMp"], eligible, { getemt: loss >= field[0].mp ? [0] : [], mpLoss: { 0: loss } }, extra, piecieHit);

  it("L1 at 20 MP, a 30 hit, The Protector and Perfect Dodge eligible: The Protector (0 Energy)", () => {
    expect(pickDefensiveSnelle(hit([L(20), null], 30, ["snelle_perfect_dodge", "snelle_the_protector"]), BOT)).toBe("snelle_the_protector");
  });
  it("the same hit with only Emergency Healings (Resilient 1): Emergency Healings; under The Void: null", () => {
    const f = () => [L(20, 1, { traits: { resilient: 1 } }), null];
    expect(pickDefensiveSnelle(hit(f(), 30, ["snelle_emergency_healings"]), BOT)).toBe("snelle_emergency_healings");
    expect(pickDefensiveSnelle(hit(f(), 30, ["snelle_emergency_healings"], { activePlace: "place_the_void" }), BOT)).toBeNull();
  });
  it("a 10 loss on an L1 at 60 is passed (the card is saved); 20 is worth a card", () => {
    expect(pickDefensiveSnelle(hit([L(60), null], 10, ["snelle_the_protector", "snelle_perfect_dodge"]), BOT)).toBeNull();
    expect(pickDefensiveSnelle(hit([L(60), null], 20, ["snelle_the_protector"]), BOT)).toBe("snelle_the_protector");
  });
  it("a 20 loss on a Level 3 at 80: the cheapest reducer; equal price goes in Card List order", () => {
    expect(pickDefensiveSnelle(hit([L(80, 3), null], 20, ["snelle_perfect_dodge", "snelle_the_protector", "snelle_emergency_healings"]), BOT)).toBe("snelle_the_protector");
    expect(pickDefensiveSnelle(hit([L(80, 3), null], 20, ["snelle_drain_reversal", "snelle_perfect_dodge"]), BOT)).toBe("snelle_perfect_dodge");
    expect(pickDefensiveSnelle(hit([L(80, 3), null], 20, ["snelle_emergency_healings", "snelle_drain_reversal"]), BOT)).toBe("snelle_emergency_healings"); // 1 Energy beats 2
  });
  it("a Welloe move with Not Today! eligible: Not Today!, ahead of the cheaper reducers", () => {
    const w = win([L(0, 1, { sideways: true }), L(50)], ["attacked", "wouldLoseMp", "toWelloe"], ["snelle_the_protector", "snelle_negate_elimination"], { getemt: [0], toWelloe: true, welloeSlots: [0] });
    expect(pickDefensiveSnelle(w, BOT)).toBe("snelle_negate_elimination");
  });
  it("targeted and losing MP on an L1 at 40: a 50 loss -> The Protector (both prevent it, 0 Energy beats 1); an 80 loss -> Jensen!", () => {
    expect(pickDefensiveSnelle(targeted([L(40), null], 50, ["snelle_jensen", "snelle_the_protector"]), BOT)).toBe("snelle_the_protector");
    expect(pickDefensiveSnelle(targeted([L(40), null], 80, ["snelle_jensen", "snelle_the_protector"]), BOT)).toBe("snelle_jensen");
  });
  it("when nothing saves the Mosje, the biggest cut is still played (ties: the cheaper card)", () => {
    expect(pickDefensiveSnelle(hit([L(20), null], 100, ["snelle_drain_reversal", "snelle_the_protector"]), BOT)).toBe("snelle_the_protector");
  });
  it("a Mosje a card sends straight to the Welloe pile cannot be cut: a reducer is not played, Jensen! is", () => {
    const direct = (eligible: string[]) => win([L(30, 2), null], ["targeted", "wouldLoseMp", "toWelloe"], eligible, { getemt: [0], toWelloe: true, welloeSlots: [0] }, {}, piecieHit);
    expect(pickDefensiveSnelle(direct(["snelle_the_protector"]), BOT)).toBeNull();
    expect(pickDefensiveSnelle(direct(["snelle_the_protector", "snelle_jensen"]), BOT)).toBe("snelle_jensen");
  });
  it("Counter Strikka needs a second Mosje to send the hit to; Blensen! only when nothing cheaper saves", () => {
    expect(pickDefensiveSnelle(targeted([L(40), null], 40, ["snelle_counter_strikka"]), BOT)).toBeNull();
    expect(pickDefensiveSnelle(targeted([L(40), L(50)], 40, ["snelle_counter_strikka"]), BOT)).toBe("snelle_counter_strikka");
    expect(pickDefensiveSnelle(targeted([L(40), null], 40, ["snelle_blensen", "snelle_jensen"]), BOT)).toBe("snelle_jensen");
    expect(pickDefensiveSnelle(targeted([L(40), null], 40, ["snelle_blensen"]), BOT)).toBe("snelle_blensen");
  });
  it("Perfect Dodge cuts 30 on Physical 3 and 20 below it", () => {
    // A 100 hit on an L1 at 40 is lost whatever is played, so the biggest cut wins: Emergency Healings (Resilient 1) cuts 25.
    const f = (physical: number) => [L(40, 1, { traits: { physical, resilient: 1 } }), null];
    const both = ["snelle_emergency_healings", "snelle_perfect_dodge"];
    expect(pickDefensiveSnelle(hit(f(3), 100, both), BOT)).toBe("snelle_perfect_dodge"); // 30 > 25
    expect(pickDefensiveSnelle(hit(f(2), 100, both), BOT)).toBe("snelle_emergency_healings"); // 20 < 25
    // Equal cut and price (Dodge 20, Drain Reversal 20): Card List order.
    expect(pickDefensiveSnelle(hit(f(2), 100, ["snelle_drain_reversal", "snelle_perfect_dodge"]), BOT)).toBe("snelle_perfect_dodge");
  });
  it("Delluft on the bot's own turn: Energy 1 cannot pay a cost-1 Snelle (1 + the fee); Energy 2 can", () => {
    const own = (energy: number) => targeted([L(40), null], 80, ["snelle_jensen"], { activePlace: "place_delluft", activePlayerId: BOT, bot: { energy } });
    expect(pickDefensiveSnelle(own(1), BOT)).toBeNull();
    expect(pickDefensiveSnelle(own(2), BOT)).toBe("snelle_jensen");
  });
  it("a window of the other seat is not the bot's: null", () => {
    expect(pickDefensiveSnelle(hit([L(20), null], 30, ["snelle_the_protector"]), "player_1")).toBeNull();
  });
  it("real attack window: the preview stops at the Mosje's MP, so the hit is read from the attacker's Power (L1 at 40, Power 70)", () => {
    const attacker = mk(50, attackerDef);
    attacker.powerBoost = 70 - getPower(attacker, undefined, "player_1");
    const s = makeEngineState({ turnNumber: 3, players: { player_1: { activeSlots: [attacker, null] },
      [BOT]: { activeSlots: [L(40, 1, { traits: { resilient: 2 } }), null], hand: H("snelle_the_protector", "snelle_emergency_healings") } } });
    const w = attackMosje(s, "player_1", ATT).state;
    expect(w.pendingReaction.eligible).toEqual(expect.arrayContaining(["snelle_the_protector", "snelle_emergency_healings"]));
    expect(w.pendingReaction.preview.mpLoss[0]).toBe(40); // capped at the Mosje's MP: the preview alone makes The Protector look enough
    // The Protector: 70 - 30 = 40 lost = dead. Emergency Healings (Resilient 2): +35 first, then 70 lost = 5 left.
    expect(pickDefensiveSnelle(w, BOT)).toBe("snelle_emergency_healings");
    const saved = resolveReaction(w, BOT, "snelle_emergency_healings").state.players[BOT].activeSlots[0];
    expect(saved.sideways).toBeFalsy();
    expect(saved.mp).toBeGreaterThan(0);
    expect(resolveReaction(w, BOT, "snelle_the_protector").state.players[BOT].activeSlots[0].sideways).toBe(true); // the engine agrees
  });
});
