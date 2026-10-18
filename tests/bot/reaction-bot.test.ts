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
// @ts-expect-error
import { pickCounterSnelle } from "../../src/bot/strategy/pickCounterSnelle.js";
// @ts-expect-error
import { PIECIES } from "../../src/data/piecies.js";
// @ts-expect-error
import { QUESTS } from "../../src/data/quests.js";

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
const BOT = "player_2";
const L = (mp: number, level = 1, extra: any = {}) => mk(mp, plain, { level, ...extra });
const none = { getemt: [] as number[], toWelloe: false, mpLoss: {}, welloeSlots: [] as number[] };
const piecieHit = { type: "activatePiecie", args: ["player_1", 0] };
// A bot window (the bot is player_2, the actor player_1): `field` is the bot's board; `extra` overrides the state,
// `extra.bot` the bot's own fields and `extra.opp` the actor's.
const win = (field: any[], moments: string[], eligible: string[], preview: any, extra: any = {}, action: any = { type: "attack", args: ["player_1", ATT] }) => {
  const { bot, opp, ...rest } = extra;
  return makeEngineState({ turnNumber: 3, activePlayerId: "player_1", ...rest,
    players: { player_1: { activeSlots: [mk(50, attackerDef), null], ...(opp || {}) }, [BOT]: { activeSlots: field, ...(bot || {}) } },
    pendingReaction: { id: "r1", responderId: BOT, actorId: "player_1", moments, eligible, preview: { ...none, ...preview }, action, queue: [] } });
};
const hit = (field: any[], loss: number, eligible: string[], extra: any = {}) =>
  win(field, ["attacked", "wouldLoseMp"], eligible, { getemt: loss >= field[0].mp ? [0] : [], mpLoss: { 0: loss } }, extra);
const targeted = (field: any[], loss: number, eligible: string[], extra: any = {}) =>
  win(field, ["targeted", "wouldLoseMp"], eligible, { getemt: loss >= field[0].mp ? [0] : [], mpLoss: { 0: loss } }, extra, piecieHit);

describe("pickDefensiveSnelle", () => {
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

// BOT-03 (61-07): answers to the opponent's Piecie, Quest roll and Jensen!, and the bot's own windows. Windows are hand-built.
describe("pickCounterSnelle and chooseReaction", () => {
  const faceDown = (cardId: string) => ({ cardId, type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 2, canActivateOnTurn: 3 });
  const asked = (w: any) => { const pick = chooseReaction(w, BOT); if (pick) expect(w.pendingReaction.eligible, "the answer is always an eligible card").toContain(pick); return pick; };
  const theirs = (cardId: string, eligible: string[], extra: any = {}, field: any[] = [L(30), L(40)]) =>
    win(field, ["afterPiecieActivation"], eligible, {}, { ...extra, opp: { piecieSlots: [faceDown(cardId), null, null] } }, piecieHit);
  const mine = (cardId: string, eligible: string[], bot: any = {}) =>
    win([L(30), L(40)], ["afterOwnPiecieActivation"], eligible, {}, { bot: { energy: 4, piecieSlots: [faceDown(cardId), null, null], ...bot } }, { type: "activatePiecie", args: [BOT, 0] });
  const withRarity = (cardId: string, rarity: string, run: () => void) => { // a fixture: the same card, printed as a five-star
    const def = PIECIES.find((p: any) => p.id === cardId);
    const was = def.rarity;
    def.rarity = rarity;
    try { run(); } finally { def.rarity = was; }
  };
  const JAM = "snelle_jammertje_gepakt", GEV = "snelle_gevalletje_klakkeloos", TEM = "snelle_dubbele_temminks";

  it("the opponent activates Harde Didde (cost 4, attack, five stars): Jammertje Gepakt!; Gevalletje alone passes", () => {
    expect(asked(theirs("piecie_harde_didde", [JAM]))).toBe(JAM);
    expect(asked(theirs("piecie_harde_didde", [GEV]))).toBeNull(); // not on a five-star card
  });
  it("Kannetje Melk (a plain gain): Gevalletje Klakkeloos, also when Jammertje Gepakt! is eligible", () => {
    expect(asked(theirs("piecie_kannetje_melk", [GEV]))).toBe(GEV);
    expect(asked(theirs("piecie_kannetje_melk", [JAM, GEV]))).toBe(GEV);
    expect(asked(theirs("piecie_kannetje_melk", [JAM]))).toBeNull(); // cost 0, no attack: not worth the card
  });
  it("Jammertje Gepakt! for cost 2+, attack / Power cards and five-star cards; a cheap utility Piecie passes", () => {
    expect(asked(theirs("piecie_tempiecie", [JAM]))).toBe(JAM); // cost 2
    expect(asked(theirs("piecie_te_hard_gaan", [JAM]))).toBe(JAM); // Power
    expect(asked(theirs("piecie_affoe", [JAM]))).toBe(JAM); // attack
    expect(asked(theirs("piecie_loaded_dice", [JAM]))).toBeNull(); // cost 0, quest prep
    withRarity("piecie_loaded_dice", "★★★★★", () => expect(asked(theirs("piecie_loaded_dice", [JAM]))).toBe(JAM)); // five stars
  });
  it("Gevalletje Klakkeloos copies a gain or draw card, never a five-star one, and not when nobody could receive the MP", () => {
    expect(asked(theirs("piecie_pot_of_weed", [GEV]))).toBe(GEV); // draw
    withRarity("piecie_kannetje_melk", "★★★★★", () => expect(asked(theirs("piecie_kannetje_melk", [GEV]))).toBeNull());
    expect(asked(theirs("piecie_loaded_dice", [GEV]))).toBeNull(); // neither gain nor draw
    expect(asked(theirs("piecie_kannetje_melk", [GEV], {}, [L(95, 3), null]))).toBeNull(); // a Level 3 at 95 cannot gain
  });
  it("pickCounterSnelle alone: the same answers, and nothing in a defender window", () => {
    expect(pickCounterSnelle(theirs("piecie_harde_didde", [JAM]), BOT)).toBe(JAM);
    expect(pickCounterSnelle(hit([L(20), null], 30, ["snelle_the_protector"]), BOT)).toBeNull();
    expect(pickCounterSnelle(theirs("piecie_harde_didde", [JAM]), "player_1")).toBeNull(); // not this seat's window
  });
  it("the opponent's winning Quest roll: Je Weet Niet; a losing one passes; a Piecie / DJ reroll that flips it goes first", () => {
    const steady = QUESTS.find((q: any) => q.band === "steady");
    const trained = QUESTS.find((q: any) => q.band === "trained");
    const roll = (q: any, dice: number[], wins: boolean, eligible: string[]) =>
      win([L(30), null], ["afterQuestRoll"], eligible, {}, { pendingQuestRoll: { questId: q.id, playerId: "player_1", dice, win: wins } }, { type: "quest", args: ["player_1", { slotIndex: 0, stackId: q.stack }] });
    expect(asked(roll(steady, [5], true, ["snelle_jeweetniet"]))).toBe("snelle_jeweetniet");
    expect(asked(roll(steady, [2], false, ["snelle_jeweetniet", "snelle_lucky_coin"]))).toBeNull();
    expect(asked(roll(steady, [5], true, ["snelle_lucky_coin"]))).toBe("snelle_lucky_coin"); // Lucky Coin after Je Weet Niet
    expect(asked(roll(steady, [5], true, ["snelle_jeweetniet", "snelle_lucky_coin", "djReroll:0"]))).toBe("djReroll:0");
    expect(asked(roll(steady, [5], true, ["snelle_jeweetniet", "piecieReroll:0"]))).toBe("piecieReroll:0");
    expect(asked(roll(trained, [5], true, ["snelle_jeweetniet", "snelle_lucky_coin"]))).toBeNull(); // a trained Quest never fails
  });
  it("Jensen! was played: Frenssen!; else a free Blensen!; a 4-Energy Blensen! passes", () => {
    const jensen = (eligible: string[], extra: any = {}) => win([L(30), null], ["jensenPlayed"], eligible, {}, extra, piecieHit);
    expect(asked(jensen(["snelle_frenssen", "snelle_blensen"], { jensenPlayedTurn: 3 }))).toBe("snelle_frenssen");
    expect(asked(jensen(["snelle_blensen"], { jensenPlayedTurn: 3 }))).toBe("snelle_blensen"); // free: a Jensen! this turn
    expect(asked(jensen(["snelle_blensen"], { bot: { energy: 6 } }))).toBeNull();
    expect(asked(jensen(["snelle_frenssen"], { bot: { energy: 1 } }))).toBeNull(); // cannot pay 2
  });
  it("defender windows go to the defender rule: a real threat gets the cheapest saver, a small loss on a healthy Mosje is passed", () => {
    expect(asked(hit([L(20), null], 30, ["snelle_perfect_dodge", "snelle_the_protector"]))).toBe("snelle_the_protector");
    expect(asked(hit([L(60), null], 10, ["snelle_the_protector"]))).toBeNull();
    expect(asked(targeted([L(40), null], 80, ["snelle_jensen", "snelle_the_protector"]))).toBe("snelle_jensen");
  });
  it("own windows: Sleutelpuntje and Lucky Coin need the Energy; Dubbele Temminks follows a gain or draw Piecie only", () => {
    const stacks: any = {};
    for (const id of ["FIGHTING", "DIGITAL", "ARTISTIC"]) stacks[id] = { deck: ["quest_filler"], faceUp: "quest_filler", tokens: 0, discard: [] };
    const q = getQuestDef("quest_tough_it_out");
    stacks[q.stack] = { deck: ["quest_filler"], faceUp: q.id, tokens: 0, discard: [] };
    const traits = { physical: 1, mental: 1, creative: 1, technical: 1, resilient: 1, social: 1 };
    const quest = (moments: string[], eligible: string[], energy: number, roll: any = {}) =>
      win([L(30, 1, { traits }), null], moments, eligible, {}, { questStacks: stacks, bot: { energy }, pendingQuestRoll: { questId: q.id, playerId: BOT, dice: [1], win: false, ...roll } }, { type: "quest", args: [BOT, { slotIndex: 0, stackId: q.stack }] });
    expect(asked(quest(["beforeOwnQuestRoll"], ["snelle_sleutelpuntje"], 1))).toBe("snelle_sleutelpuntje");
    expect(asked(quest(["beforeOwnQuestRoll"], ["snelle_sleutelpuntje"], 0))).toBeNull();
    expect(asked(quest(["afterOwnQuestRoll"], ["snelle_lucky_coin"], 1))).toBe("snelle_lucky_coin");
    expect(asked(quest(["afterOwnQuestRoll"], ["snelle_lucky_coin"], 0))).toBeNull();
    expect(asked(mine("piecie_kannetje_melk", [TEM]))).toBe(TEM);
    expect(asked(mine("piecie_pot_of_weed", [TEM]))).toBe(TEM); // draw
    expect(asked(mine("piecie_kannetje_melk", [TEM], { energy: 1 }))).toBeNull(); // cannot pay 2
    expect(asked(mine("piecie_harde_didde", [TEM]))).toBeNull(); // five stars (and an attack)
    expect(asked(mine("piecie_loaded_dice", [TEM]))).toBeNull(); // neither gain nor draw
    withRarity("piecie_kannetje_melk", "★★★★★", () => expect(asked(mine("piecie_kannetje_melk", [TEM]))).toBeNull());
  });
});

// A reaction the bot plays is a metric (the bot-quality sweep counts them).
describe("reaction-played metric", () => {
  const metrics = (run: () => void) => {
    const lines: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...a: any[]) => { if (String(a[0]).startsWith("[BOT] METRIC")) lines.push(String(a[0]).slice(13)); });
    try { run(); } finally { spy.mockRestore(); }
    return lines.map((l) => JSON.parse(l)).filter((m) => m.ev === "reaction-played");
  };
  it("settleReactions emits it for the Snelle the bot plays, and not for a pass", () => {
    const w = attackMosje(board({ hand: H("snelle_negate_elimination") }), "player_1", ATT).state;
    const played = metrics(() => settleReactions(w, []));
    expect(played).toHaveLength(1);
    expect(played[0]).toMatchObject({ responderId: "player_2", cardId: "snelle_negate_elimination" });
    expect(played[0].moments).toContain("toWelloe");
    const safe = attackMosje(board({ hand: H("snelle_negate_elimination"), activeSlots: [mk(50), mk(50)] }), "player_1", ATT).state;
    expect(metrics(() => settleReactions(safe, []))).toHaveLength(0);
  });
});

describe("bot-vs-bot reactions on the seeded Example Deck pairings", () => {
  const pairs: Array<[string, string]> = [["EXAMPLE_TAKSEN", "EXAMPLE_REGELAARS"], ["EXAMPLE_CREATIEVELINGEN", "EXAMPLE_TAKSEN"], ["EXAMPLE_REGELAARS", "EXAMPLE_CREATIEVELINGEN"]];
  const seeded = (seed: number) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  it("the bots play at least one reaction Snelle in total and every game still reaches a stable end", () => {
    const real = Math.random;
    const lines: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...a: any[]) => { if (String(a[0]).startsWith("[BOT] METRIC")) lines.push(String(a[0]).slice(13)); });
    try {
      pairs.forEach(([a, b], n) => {
        Math.random = seeded(0xB07 + n);
        const players = [{ playerId: "player_1", name: "A", deckId: a }, { playerId: "player_2", name: "B", deckId: b }];
        let s = startTurn(createInitialGameState(players, "T", { firstPlayerId: "player_1" }));
        for (let turns = 0; s.status !== "FINISHED" && turns < 60; turns++) {
          s = driveBotTurn(s, s.activePlayerId);
          expect(s.pendingReaction).toBeUndefined();
          if (s.status === "FINISHED") break;
          s = startTurn(s);
        }
      });
    } finally { Math.random = real; spy.mockRestore(); }
    const played = lines.map((l) => JSON.parse(l)).filter((m) => m.ev === "reaction-played");
    expect(played.length).toBeGreaterThanOrEqual(1);
  });
});
