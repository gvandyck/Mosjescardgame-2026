import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { MOSJE_TRIGGERS } from "../../src/engine/mosje/mosjeTriggers.js";
// @ts-expect-error - JS module
import { runMosjeTriggers } from "../../src/engine/mosje/runMosjeTriggers.js";
// @ts-expect-error - JS module
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error - JS module
import { finishDrawStep } from "../../src/engine/mosje/finishDrawStep.js";
// @ts-expect-error - JS module
import { settleMosjePauses } from "../../src/bot/settleMosjePauses.js";
// @ts-expect-error - JS module
import { startTurn, endTurn, useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { build, finish, mkSlot } from "../helpers/quest56.js";

function mosje(cardId: string, mp = 30, extra: any = {}) {
  return { cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false, ...extra };
}
// Test-only registry entries are pushed here and removed again after each test.
const added: Array<[string, any]> = [];
function reg(hook: string, entry: any) {
  MOSJE_TRIGGERS[hook].push(entry);
  added.push([hook, entry]);
}
afterEach(() => {
  for (const [hook, entry] of added.splice(0)) MOSJE_TRIGGERS[hook].splice(MOSJE_TRIGGERS[hook].indexOf(entry), 1);
});
const log: string[] = [];
const field = (p1: any[], p2: any[] = [null, null], extra: any = {}) =>
  makeEngineState({
    turnNumber: 3,
    ...extra,
    players: {
      player_1: { activeSlots: p1, deck: [{ cardId: "d1", type: "PIECIE" }, { cardId: "d2", type: "PIECIE" }] },
      player_2: { activeSlots: p2, deck: [{ cardId: "e1", type: "PIECIE" }] },
    },
  });

describe("runMosjeTriggers hooks", () => {
  it("fires start/opp-start/end hooks for the right field, skipping defeated and sideways Mosjes", () => {
    const seen: string[] = [];
    for (const hook of ["startOfTurn", "oppStartOfTurn", "endOfTurn"]) {
      reg(hook, { mosjeId: "mosje_a", run: (s: any, ctx: any) => { seen.push(`${hook}:${ctx.ownerId}:${ctx.holderSlotIndex}`); return s; } });
    }
    let s = field([mosje("mosje_a"), mosje("mosje_a", 30, { isDefeated: true })], [mosje("mosje_a", 30, { sideways: true }), mosje("mosje_a")]);
    s = startTurn(s);
    expect(seen).toEqual(["startOfTurn:player_1:0", "oppStartOfTurn:player_2:1"]);
    endTurn(s);
    expect(seen[2]).toBe("endOfTurn:player_1:0");
  });

  it("fires cardPlayedFromHand and placeDestroyed with their ctx for the right owner", () => {
    const seen: any[] = [];
    reg("cardPlayedFromHand", { mosjeId: "mosje_a", run: (s: any, c: any) => { seen.push(["played", c.cardType]); return s; } });
    reg("placeDestroyed", { mosjeId: "mosje_a", run: (s: any, c: any) => { seen.push(["destroyed", c.destroyingPlayerId]); return s; } });
    const s = field([mosje("mosje_a"), null]);
    runMosjeTriggers(s, "cardPlayedFromHand", { playerId: "player_1", cardType: "PLACE" });
    runMosjeTriggers(s, "placeDestroyed", { destroyingPlayerId: "player_1" });
    runMosjeTriggers(s, "placeDestroyed", { destroyingPlayerId: "player_2" });
    expect(seen).toEqual([["played", "PLACE"], ["destroyed", "player_1"]]);
  });
});

describe("pendingChoice", () => {
  const needing = (rolls: number[]) => ({
    mosjeId: "mosje_a",
    run: (s: any, ctx: any) => {
      const t = s.players.player_1._pendingTargets?.pick;
      if (t === undefined) {
        const roll = ctx.rolls ?? (rolls.shift() as number);
        log.push(`roll:${roll}`);
        return { needChoice: { playerId: "player_1", choiceKind: "oppMosje", options: ctx.options, key: "pick", ctx: { rolls: roll } } };
      }
      log.push(`picked:${t}:${ctx.rolls}`);
      s.players.player_1.picked = t;
      return s;
    },
  });

  it("pauses on state.pendingChoice and resumes without re-rolling", () => {
    log.length = 0;
    reg("startOfTurn", needing([5, 1]));
    const s = field([mosje("mosje_a"), null]);
    const paused = runMosjeTriggers(s, "startOfTurn", { playerId: "player_1", options: [0, 1] });
    expect(paused.pendingChoice.options).toEqual([0, 1]);
    expect(paused.pendingChoice.triggerId).toBe("startOfTurn:mosje_a");
    expect(resolvePendingChoice(paused, 7).ok).toBe(false);
    const done = resolvePendingChoice(paused, 1);
    expect(done.state.pendingChoice).toBeUndefined();
    expect(done.state.players.player_1.picked).toBe(1);
    expect(log).toEqual(["roll:5", "picked:1:5"]); // one roll only
    expect(done.state.players.player_1._pendingTargets.pick).toBeUndefined();
  });

  it("auto-picks when there is only one option (no pause)", () => {
    log.length = 0;
    reg("startOfTurn", needing([3]));
    const out = runMosjeTriggers(field([mosje("mosje_a"), null]), "startOfTurn", { playerId: "player_1", options: [0] });
    expect(out.pendingChoice).toBeUndefined();
    expect(out.players.player_1.picked).toBe(0);
  });

  it("the bot settle answers a bot's pause so play never stalls, and waits for a human", () => {
    reg("startOfTurn", needing([2]));
    const paused = runMosjeTriggers(field([mosje("mosje_a"), null]), "startOfTurn", { playerId: "player_1", options: [4, 5] });
    expect(settleMosjePauses(paused, ["player_1"]).waiting).toBe(true);
    const r = settleMosjePauses(paused, []);
    expect(r.waiting).toBe(false);
    expect(r.state.pendingChoice).toBeUndefined();
    expect(r.state.players.player_1.picked).toBe(4);
  });
});

describe("draw step", () => {
  it("pauses before the draw only when an option exists, then finishes the turn start", () => {
    const s = field([mosje("mosje_a"), null]);
    const plain = startTurn(s);
    expect(plain.pendingDrawStep).toBeUndefined();
    expect(plain.players.player_1.hand.length).toBe(1);

    reg("drawStep", { mosjeId: "mosje_a", available: () => true, run: (st: any) => { st.players.player_1.mark = true; return { state: st, replacesDraw: false }; } });
    const paused = startTurn(s);
    expect(paused.pendingDrawStep.options).toEqual([{ mosjeId: "mosje_a" }]);
    expect(paused.players.player_1.hand.length).toBe(0);
    const def = finishDrawStep(paused, "player_1", {});
    expect(def.state.players.player_1.hand.length).toBe(1);
    expect(def.state.players.player_1.mark).toBeUndefined();
    const used = finishDrawStep(paused, "player_1", { use: ["mosje_a"] });
    expect(used.state.players.player_1.mark).toBe(true);
    expect(used.state.pendingDrawStep).toBeUndefined();
  });

  it("a replacing draw-step option skips the normal draw", () => {
    reg("drawStep", { mosjeId: "mosje_a", run: (st: any) => ({ state: st, replacesDraw: true }) });
    const paused = startTurn(field([mosje("mosje_a"), null]));
    const r = finishDrawStep(paused, "player_1", { use: ["mosje_a"] });
    expect(r.state.players.player_1.hand.length).toBe(0);
  });

  it("the bot settle finishes a draw step with the normal draw", () => {
    reg("drawStep", { mosjeId: "mosje_a", run: (st: any) => ({ state: st, replacesDraw: true }) });
    const paused = startTurn(field([mosje("mosje_a"), null]));
    const r = settleMosjePauses(paused, []);
    expect(r.state.pendingDrawStep).toBeUndefined();
    expect(r.state.players.player_1.hand.length).toBe(1);
  });
});

describe("useMosjeAbility gates", () => {
  const withE = (cardId: string, extra: any = {}, active = "player_1") =>
    field([mosje(cardId, 30, extra), null], [mosje("mosje_michelle"), null], { activePlayerId: active });
  it("refuses trigger and passive kinds", () => {
    expect(useMosjeAbility(withE("mosje_michelle"), "player_1", "mosje_michelle").error).toBe("This ability works on its own");
    expect(useMosjeAbility(withE("mosje_jeffrey"), "player_1", "mosje_jeffrey").error).toBe("This ability works on its own");
  });
  it("refuses off the owner's turn (except DJ 80/20)", () => {
    const s = withE("mosje_tuk_healer", {}, "player_2");
    expect(useMosjeAbility(s, "player_1", "mosje_tuk_healer").error).toBe("You can only use this ability on your own turn");
    const dj = withE("mosje_dj_8020", {}, "player_2");
    expect(useMosjeAbility(dj, "player_1", "mosje_dj_8020").error).not.toBe("You can only use this ability on your own turn");
  });
  it("refuses when Energy is short and when the once-per-game / per-turn limit is spent", () => {
    const broke = withE("mosje_tuk_healer");
    broke.players.player_1.energy = 0;
    expect(useMosjeAbility(broke, "player_1", "mosje_tuk_healer").error).toBe("Not enough Energy");
    expect(useMosjeAbility(withE("mosje_gandoe_destroyer", { abilityUsedThisGame: true }), "player_1", "mosje_gandoe_destroyer").error).toBe("Ability already used this game");
    expect(useMosjeAbility(withE("mosje_tuk_healer", { abilityUsedThisTurn: true }), "player_1", "mosje_tuk_healer").error).toBe("Ability already used this turn");
    expect(useMosjeAbility(withE("mosje_coert_tech", { abilityUsesThisTurn: 2 }), "player_1", "mosje_coert_tech").error).toBe("Ability already used this turn");
  });
  it("refuses a sideways Mosje", () => {
    expect(useMosjeAbility(withE("mosje_tuk_healer", { sideways: true }), "player_1", "mosje_tuk_healer").error).toBe("This Mosje is sideways");
  });
  it("Coert Tech may be used twice per turn, not three times", () => {
    const a = useMosjeAbility(withE("mosje_coert_tech"), "player_1", "mosje_coert_tech");
    expect(a.success).toBe(true);
    const b = useMosjeAbility(a.state, "player_1", "mosje_coert_tech");
    expect(b.success).toBe(true);
    expect(useMosjeAbility(b.state, "player_1", "mosje_coert_tech").error).toBe("Ability already used this turn");
  });
});

describe("Quest win is ONE gain", () => {
  it("applies every questWinAmount modifier, then a single gain (70 + 80 -> Level 2 at 0 MP)", () => {
    reg("questWinAmount", { mosjeId: mkSlot().cardId, run: (_s: any, ctx: any) => ctx.amount * 2 });
    const { s, q } = build("arm_wrestling", { me: mkSlot({ mp: 70 }) });
    const out = finish(s, q, true);
    const me = out.players.player_1.activeSlots[0];
    expect(me.level).toBe(2);
    expect(me.mp).toBe(0);
  });
  it("runs questSuccess triggers after the gain with the final amount", () => {
    let seen = 0;
    reg("questSuccess", { mosjeId: mkSlot().cardId, run: (s: any, ctx: any) => { seen = ctx.amount; return s; } });
    const { s, q } = build("arm_wrestling");
    finish(s, q, true);
    expect(seen).toBe(40);
  });
});
