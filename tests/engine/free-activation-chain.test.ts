import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error - JS module
import { activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { activatePiecieFree } from "../../src/engine/table/activatePiecieFree.js";
// @ts-expect-error - JS module
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error - JS module
import { MOSJE_TRIGGERS } from "../../src/engine/mosje/mosjeTriggers.js";
// @ts-expect-error - JS module
// @ts-expect-error - JS module
import { pushTestDice, clearTestDice, shiftTestDie } from "../../src/engine/dice/testDiceQueue.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";

const mosje = (cardId: string, mp = 30) => ({ cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false });
const placed = (cardId: string, extra: any = {}) => ({ cardId, type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1, ...extra });
const DONER = "piecie_broodje_doner"; // cost 1, FOOD
const TE_HARD = "piecie_te_hard_gaan"; // cost 2

function build(p1: any = {}, extra: any = {}) {
  return makeEngineState({
    turnNumber: 3,
    ...extra,
    players: {
      player_1: { energy: 6, activeSlots: [mosje("mosje_a"), null], piecieSlots: [placed(TE_HARD), null, null], ...p1 },
      player_2: { activeSlots: [mosje("mosje_b"), null] },
    },
  });
}

const seen: any[] = [];
const spy = { mosjeId: "mosje_a", run: (s: any, ctx: any) => { seen.push({ free: ctx.free, slotIndex: ctx.slotIndex, id: ctx.cardDef?.id }); return s; } };
afterEach(() => {
  clearTestDice();
  seen.length = 0;
  const i = MOSJE_TRIGGERS.piecieActivated.indexOf(spy);
  if (i >= 0) MOSJE_TRIGGERS.piecieActivated.splice(i, 1);
  vi.restoreAllMocks();
});

describe("activatePiecieFree", () => {
  it("normal activation pays Energy and reports free:false; free pays none and reports free:true", () => {
    MOSJE_TRIGGERS.piecieActivated.push(spy);
    const normal = activatePiecie(build(), "player_1", 0);
    expect(normal.success).toBe(true);
    expect(normal.state.players.player_1.energy).toBe(4);
    const free = activatePiecieFree(build(), "player_1", { slotIndex: 0 });
    expect(free.success).toBe(true);
    expect(free.state.players.player_1.energy).toBe(6);
    expect(seen.map(x => x.free)).toEqual([false, true]);
  });

  it("is still an activation: counters rise and the Piecie leaves its slot for the discard pile", () => {
    const res = activatePiecieFree(build(), "player_1", { slotIndex: 0 });
    const p = res.state.players.player_1;
    expect(p.pieciesActivatedThisTurn).toBe(1);
    expect(p.piecieActivationsThisTurn).toBe(1);
    expect(p.piecieSlots[0]).toBeNull();
    expect(p.graveyard.some((c: any) => c.cardId === TE_HARD)).toBe(true);
  });

  it("refuses an unready Piecie unless ignoreReadiness, and an already activated one", () => {
    const s = build({ piecieSlots: [placed(TE_HARD, { canActivateOnTurn: 4 }), null, null] });
    expect(activatePiecieFree(s, "player_1", { slotIndex: 0 }).success).toBe(false);
    expect(activatePiecieFree(s, "player_1", { slotIndex: 0 }, { ignoreReadiness: true }).success).toBe(true);
    const done = build({ piecieSlots: [placed(TE_HARD, { activated: true, faceDown: false }), null, null] });
    expect(activatePiecieFree(done, "player_1", { slotIndex: 0 }).error).toBe("Piecie already activated");
  });

  it("never fires the DDR Chris chain (normal activation chains on a 6, free does not)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // every die = 6
    const mk = () => build({
      activeSlots: [mosje("mosje_chris_ddr"), null],
      piecieSlots: [placed(TE_HARD), placed(DONER), placed(DONER)],
    });
    let normal: any = activatePiecie(mk(), "player_1", 0);
    while (normal.state.pendingChoice) normal = resolvePendingChoice(normal.state, normal.state.pendingChoice.options[0]);
    expect(normal.state.players.player_1.ddrChainsThisTurn).toBe(1); // one roll per paid activation: one ready Piecie chained for free
    expect(normal.state.players.player_1.piecieSlots.filter((s: any) => s === null).length).toBe(2);
    const free = activatePiecieFree(mk(), "player_1", { slotIndex: 0 });
    expect(free.state.players.player_1.ddrChainsThisTurn || 0).toBe(0); // no chain
    expect(free.state.players.player_1.piecieSlots[1]?.activated).toBe(false);
  });

  it("the gates still apply (Jeffrey blocks a FOOD Piecie, free or not)", () => {
    const s = build({ activeSlots: [mosje("mosje_jeffrey"), null], piecieSlots: [placed(DONER), null, null] });
    expect(activatePiecie(s, "player_1", 0).success).toBe(false);
    const free = activatePiecieFree(s, "player_1", { slotIndex: 0 });
    expect(free.success).toBe(false);
    expect(free.state.players.player_1.piecieSlots[0].activated).toBe(false);
  });

  it("a card from the discard pile runs once and goes back to the discard pile", () => {
    MOSJE_TRIGGERS.piecieActivated.push(spy);
    const s = build({ piecieSlots: [null, null, null], graveyard: [{ cardId: DONER, type: "PIECIE" }] });
    const res = activatePiecieFree(s, "player_1", { card: DONER, from: "discard" });
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(6);
    expect(res.state.players.player_1.graveyard.filter((c: any) => c.cardId === DONER).length).toBe(1);
    expect(seen).toEqual([{ free: true, slotIndex: -1, id: DONER }]);
  });

  it("a card from the deck can return to the bottom of the deck; a missing card is refused", () => {
    const s = build({ piecieSlots: [null, null, null], deck: [{ cardId: DONER, type: "PIECIE" }, { cardId: "x", type: "PIECIE" }] });
    const res = activatePiecieFree(s, "player_1", { card: DONER, from: "deck" }, { returnTo: "deck" });
    expect(res.state.players.player_1.deck.map((c: any) => c.cardId)).toEqual(["x", DONER]);
    expect(activatePiecieFree(s, "player_1", { card: "piecie_nope", from: "hand" }).success).toBe(false);
  });

  it("a Stays Piecie from outside takes a free slot and is refused when all slots are full", () => {
    const full = build({ piecieSlots: [placed(DONER), placed(DONER), placed(DONER)], graveyard: [{ cardId: "piecie_kleine_taks", type: "PIECIE" }] });
    const refused = activatePiecieFree(full, "player_1", { card: "piecie_kleine_taks", from: "discard" });
    expect(refused.success).toBe(false);
    expect(refused.error).toMatch(/free Piecie slot/);
    const roomy = build({ graveyard: [{ cardId: "piecie_kleine_taks", type: "PIECIE" }] });
    const ok = activatePiecieFree(roomy, "player_1", { card: "piecie_kleine_taks", from: "discard" });
    expect(ok.success).toBe(true);
    expect(ok.state.players.player_1.piecieSlots.some((s: any) => s?.cardId === "piecie_kleine_taks" && s.stays)).toBe(true);
  });
});

// Handoff 6b: the chain rule, proven with the dice queue (leftover dice = no extra roll happened).
const rest = () => { const out: number[] = []; for (let d = shiftTestDie(); d !== null; d = shiftTestDie()) out.push(d); return out; };
const world = (mosjes: string[], slots: any[]) => build({
  activeSlots: [mosje(mosjes[0]), mosjes[1] ? mosje(mosjes[1]) : null],
  piecieSlots: slots,
}, {});
// a sturdier foe so TE_HARD's own damage and Jisca's -15 do not defeat it
const sturdy = (s: any) => { s.players.player_2.activeSlots[0].mp = 80; return s; };

describe("chain rule: a free activation never starts a roll", () => {
  it("Jisca + DDR on one activation: each rolls once, Energy is paid once, the freed Piecies roll nothing", () => {
    pushTestDice([5, 6, 1, 1]); // Jisca 5, DDR 6, then two leftovers that must stay unread
    const s = sturdy(world(["mosje_jisca", "mosje_chris_ddr"], [placed(TE_HARD), placed(DONER), placed(DONER)]));
    let res: any = activatePiecie(s, "player_1", 0);
    expect(res.state.pendingChoice.key).toBe("jisca_piecie"); // two ready Piecies: Jisca's owner picks
    res = resolvePendingChoice(res.state, res.state.pendingChoice.options[0]); // slot 1; the foe target is automatic
    const p = res.state.players.player_1;
    expect(res.state.pendingChoice).toBeUndefined();
    expect(p.energy).toBe(4); // only the paid Piecie (2) cost Energy
    expect(p.ddrChainsThisTurn).toBe(1);
    expect(p.piecieSlots.every((x: any) => x === null)).toBe(true); // all three Piecies resolved
    expect(res.state.players.player_2.activeSlots[0].mp).toBe(65); // 80 - 15 (Jisca); Te Hard Gaan is +20 Power (Card List 2.0), no damage
    expect(rest()).toEqual([1, 1]); // the two freed Piecies rolled nothing
  });

  it("Jisca + DDR + Cless: Cless rolls once, for the paid activation only", () => {
    pushTestDice([5, 6, 5, 1, 1]); // Jisca, DDR, Cless, leftovers
    const s = world(["mosje_jisca", "mosje_chris_ddr"], [placed(TE_HARD), placed(DONER), placed(DONER)]);
    s.players.player_1.activeSlots.push(mosje("mosje_cless_teacher"));
    s.players.player_1.deck = [{ cardId: "x", type: "PLACE" }];
    let res: any = activatePiecie(s, "player_1", 0);
    while (res.state.pendingChoice) res = resolvePendingChoice(res.state, res.state.pendingChoice.options[0]);
    expect(res.state.players.player_1.hand.some((c: any) => c.cardId === "x")).toBe(true); // Cless drew once
    expect(rest()).toEqual([1, 1]);
  });

  it("a direct free activation (Ming Natural / Master Plan style) rolls nothing", () => {
    pushTestDice([6, 6]);
    const s = world(["mosje_jisca", "mosje_chris_ddr"], [placed(TE_HARD), placed(DONER), null]);
    const res = activatePiecieFree(s, "player_1", { slotIndex: 0 });
    expect(res.success).toBe(true);
    expect(res.state.pendingChoice).toBeUndefined();
    expect(res.state.players.player_1.piecieSlots[1].activated).toBe(false);
    expect(rest()).toEqual([6, 6]);
  });
});
