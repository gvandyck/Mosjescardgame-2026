// EFX-01 Example Deck 3, the rest: Tuk Healer (Healing Hands), Binti (Cutting Words), DJ 80/20 (Lucky Beats reroll
// at the Quest after-roll pause). Card List 2.0 texts are quoted in each describe.
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error - JS module
import { rollQuestAttempt } from "../../src/engine/quests/rollQuestAttempt.js";
// @ts-expect-error - JS module
import { resolveQuestAttempt } from "../../src/engine/quests/resolveQuestAttempt.js";
// @ts-expect-error - JS module
import { resolveReaction } from "../../src/engine/reactions/resolveReaction.js";
// @ts-expect-error - JS module
import { getEligibleReactions } from "../../src/engine/reactions/getEligibleReactions.js";
// @ts-expect-error - JS module
import { settleReactions } from "../../src/bot/settleReactions.js";
// @ts-expect-error - JS module
import { settleMosjePauses } from "../../src/bot/settleMosjePauses.js";
// @ts-expect-error - JS module
import { defaultAbilityInputs } from "../../src/bot/strategy/defaultAbilityInputs.js";
// @ts-expect-error - JS module
import { pushTestDice, clearTestDice } from "../../src/engine/dice/testDiceQueue.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { mkSlot, byName, build } from "../helpers/quest56.js";

afterEach(() => clearTestDice());

const TUK = byName(/Tuk, The Healing/);
const BINTI = byName(/Binti, The Sharp/);
const DJ = byName(/DJ 80\/20/);
const card = (cardId: string, type = "PIECIE") => ({ cardId, type });

describe("Tuk Healer: Healing Hands (pay 1 Energy: one of your Mosjes, herself included, gains 20 MP)", () => {
  const board = (energy = 3) => makeEngineState({
    turnNumber: 3,
    players: { player_1: { energy, activeSlots: [mkSlot({ mp: 20 }, TUK), mkSlot({ mp: 20 })] }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
  });

  it("the chosen own Mosje gains 20 and Tuk pays 1 Energy", () => {
    const s = board();
    s._pendingTargets = { own_slot_index: 1 };
    const res = useMosjeAbility(s, "player_1", TUK.id);
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.activeSlots[1].mp).toBe(40);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(20);
    expect(res.state.players.player_1.energy).toBe(2);
  });

  it("herself by default, and only once per turn", () => {
    const first = useMosjeAbility(board(), "player_1", TUK.id);
    expect(first.state.players.player_1.activeSlots[0].mp).toBe(40);
    const again = useMosjeAbility(first.state, "player_1", TUK.id);
    expect(again.success).toBe(false);
    expect(again.error).toBe("Ability already used this turn");
  });

  it("is refused with 0 Energy and changes nothing", () => {
    const res = useMosjeAbility(board(0), "player_1", TUK.id);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(20);
  });
});

describe("Binti: Cutting Words (1 Energy + discard 1 Piecie: one opponent Mosje, not fresh, loses 10; opponent discards 1 of their choice)", () => {
  const board = (oppHand: any[], oppSlots: any[] = [mkSlot({ mp: 40 }), null]) => {
    const s = makeEngineState({
      turnNumber: 3,
      players: {
        player_1: { energy: 3, hand: [card("snelle_lucky_coin", "SNELLE_PIECIE"), card("piecie_kannetje_melk")], activeSlots: [mkSlot({ mp: 30 }, BINTI), null] },
        player_2: { hand: oppHand, activeSlots: oppSlots },
      },
    });
    s._pendingTargets = { hand_card: 1, opp_slot_index: 0 };
    return s;
  };

  it("discards the Piecie, the target loses 10, the opponent's only card is discarded automatically", () => {
    const res = useMosjeAbility(board([card("piecie_broodje_doner")]), "player_1", BINTI.id);
    expect(res.success).toBe(true);
    const [p1, p2] = [res.state.players.player_1, res.state.players.player_2];
    expect(p1.hand.map((c: any) => c.cardId)).toEqual(["snelle_lucky_coin"]);
    expect(p1.graveyard.map((c: any) => c.cardId)).toEqual(["piecie_kannetje_melk"]);
    expect(p1.energy).toBe(2);
    expect(p2.activeSlots[0].mp).toBe(30);
    expect(p2.hand).toHaveLength(0);
    expect(p2.graveyard.map((c: any) => c.cardId)).toEqual(["piecie_broodje_doner"]);
    expect(res.state.pendingChoice).toBeUndefined();
  });

  it("with several different cards the OPPONENT chooses which one to discard", () => {
    const res = useMosjeAbility(board([card("piecie_broodje_doner"), card("piecie_te_hard_gaan")]), "player_1", BINTI.id);
    const pc = res.state.pendingChoice;
    expect(pc.playerId).toBe("player_2");
    expect(pc.options.map((o: any) => o.cardId)).toEqual(["piecie_broodje_doner", "piecie_te_hard_gaan"]);
    const done = resolvePendingChoice(res.state, pc.options[1]);
    expect(done.state.players.player_2.hand.map((c: any) => c.cardId)).toEqual(["piecie_broodje_doner"]);
    expect(done.state.players.player_2.graveyard.map((c: any) => c.cardId)).toEqual(["piecie_te_hard_gaan"]);
    expect(done.state.pendingChoice).toBeUndefined();
  });

  it("a bot opponent settles the pause (never stalls)", () => {
    const res = useMosjeAbility(board([card("piecie_broodje_doner"), card("piecie_te_hard_gaan")]), "player_1", BINTI.id);
    const out = settleMosjePauses(res.state, ["player_1"]);
    expect(out.waiting).toBe(false);
    expect(out.state.players.player_2.hand).toHaveLength(1);
  });

  it("an empty opponent hand: only the MP loss happens, no pause", () => {
    const res = useMosjeAbility(board([]), "player_1", BINTI.id);
    expect(res.success).toBe(true);
    expect(res.state.players.player_2.activeSlots[0].mp).toBe(30);
    expect(res.state.pendingChoice).toBeUndefined();
  });

  it("a Snelle from hand is refused: nothing spent, nothing lost", () => {
    const s = board([card("piecie_broodje_doner")]);
    s._pendingTargets.hand_card = 0; // the Snelle
    const res = useMosjeAbility(s, "player_1", BINTI.id);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(3);
    expect(res.state.players.player_1.hand).toHaveLength(2);
    expect(res.state.players.player_2.activeSlots[0].mp).toBe(40);
  });

  it("every opponent Mosje fresh: refused, nothing spent", () => {
    const res = useMosjeAbility(board([card("piecie_broodje_doner")], [mkSlot({ mp: 40, entryProtected: true }), null]), "player_1", BINTI.id);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(3);
    expect(res.state.players.player_1.hand).toHaveLength(2);
    expect(res.state.players.player_2.hand).toHaveLength(1);
  });

  it("the owner picks the target; a fresh pick is refused", () => {
    const slots = [mkSlot({ mp: 40 }), mkSlot({ mp: 50, entryProtected: true })];
    const s = board([], slots);
    s._pendingTargets.opp_slot_index = 1;
    expect(useMosjeAbility(s, "player_1", BINTI.id).success).toBe(false);
    s._pendingTargets.opp_slot_index = 0;
    expect(useMosjeAbility(s, "player_1", BINTI.id).state.players.player_2.activeSlots[0].mp).toBe(30);
  });

  it("the bot's default inputs are a Piecie index and a non-fresh target", () => {
    const s = board([]);
    s._pendingTargets = {};
    expect(defaultAbilityInputs(s, "player_1", "ability_binti_cutting_words")).toEqual({ hand_card: 1, opp_slot_index: 0 });
  });
});

describe("DJ 80/20: Lucky Beats (once per turn, reroll any one die at the Quest after-roll pause)", () => {
  // Tough It Out is a steady Quest (one die, 4+ wins). Initial roll: rng 0.7 -> 5 (win), rng 0.1 -> 1 (fail).
  const quest = (djOwner: "player_1" | "player_2", djOver: any = {}) => {
    const { s } = build("tough_it_out", { opp: [mkSlot({ mp: 40 }), null] });
    s.turnNumber = 3;
    s.players[djOwner].activeSlots[1] = mkSlot({ mp: 30, ...djOver }, DJ);
    return s;
  };
  const stackOf = (s: any) => Object.keys(s.questStacks).find((k) => s.questStacks[k].faceUp === "quest_tough_it_out");
  const rollOn = (s: any, rng: number) => rollQuestAttempt(s, "player_1", { slotIndex: 0, stackId: stackOf(s), rng: () => rng });

  it("opponent's winning roll: the DJ owner rerolls the die, the band is re-checked, the Quest fails", () => {
    const w = rollOn(quest("player_2"), 0.7);
    expect(w.state.pendingReaction.responderId).toBe("player_2");
    expect(w.state.pendingReaction.eligible).toEqual(["djReroll:0"]);
    expect(w.state.pendingQuestRoll.win).toBe(true);
    pushTestDice([2]);
    const r = resolveReaction(w.state, "player_2", "djReroll:0");
    expect(r.ok).toBe(true);
    expect(r.state.pendingQuestRoll.dice).toEqual([2]);
    expect(r.state.pendingQuestRoll.win).toBe(false);
    expect(r.state.players.player_2.activeSlots[1].djRerollTurn).toBe("3:player_1");
  });

  it("own failing roll: reroll to a 6 turns it into a win that resolves as a win", () => {
    const w = rollOn(quest("player_1"), 0.1);
    expect(w.state.pendingReaction.responderId).toBe("player_1");
    expect(w.state.pendingReaction.moments).toEqual(["afterOwnQuestRoll"]);
    pushTestDice([6]);
    const r = resolveReaction(w.state, "player_1", "djReroll:0");
    expect(r.state.pendingReaction).toBeUndefined();
    const out = resolveQuestAttempt(r.state, undefined as any);
    expect(out.win).toBe(true);
  });

  it("passing leaves the roll, and DJ stays unused", () => {
    const w = rollOn(quest("player_2"), 0.7);
    const r = resolveReaction(w.state, "player_2", null);
    expect(r.state.pendingQuestRoll.dice).toEqual([5]);
    expect(r.state.players.player_2.activeSlots[1].djRerollTurn).toBeUndefined();
  });

  it("used once -> no DJ window for the rest of that turn; a new turn allows it again", () => {
    const s = quest("player_2", { djRerollTurn: "3:player_1" });
    expect(rollOn(s, 0.7).state.pendingReaction).toBeUndefined();
    s.turnNumber = 4;
    expect(rollOn(s, 0.7).state.pendingReaction.eligible).toEqual(["djReroll:0"]);
  });

  it("a sideways DJ gets no window", () => {
    expect(rollOn(quest("player_2", { sideways: true }), 0.7).state.pendingReaction).toBeUndefined();
  });

  it("no pending roll / not an after-roll moment: no DJ entry", () => {
    const s = quest("player_2");
    expect(getEligibleReactions(s, "player_2", ["afterQuestRoll"])).toEqual([]);
    expect(getEligibleReactions(s, "player_2", ["attacked"], { dice: [5] })).toEqual([]);
  });

  it("bot DJ rerolls the opponent's winning roll and its own failing roll, but leaves rolls that suit it", () => {
    const w = rollOn(quest("player_2"), 0.7);
    pushTestDice([1]);
    const settled = settleReactions(w.state, ["player_1"]);
    expect(settled.waiting).toBe(false);
    expect(settled.state.pendingQuestRoll.win).toBe(false);

    const own = rollOn(quest("player_1"), 0.1);
    pushTestDice([6]);
    expect(settleReactions(own.state, []).state.pendingQuestRoll.win).toBe(true);

    const lost = rollOn(quest("player_2"), 0.1); // the opponent already failed: leave it
    expect(settleReactions(lost.state, ["player_1"]).state.pendingQuestRoll.dice).toEqual([1]);
  });
});
