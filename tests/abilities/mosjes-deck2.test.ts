// EFX-01 Example Deck 2 (Digital): Coert Tech (see coert-tech-draw-step), Hacker (amplifier-hacker-rework),
// Chris All-Rounder (ability-text-reconciliation) and FPS West's guess (fps-west-guess) are covered in their files.
// This file holds FPS Coert, The Drainer, the FPS West holder text and the registry wiring.
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { runMosjeTriggers } from "../../src/engine/mosje/runMosjeTriggers.js";
// @ts-expect-error - JS module
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error - JS module
import { fpsWestRevealHand } from "../../src/engine/mosje/fpsWestRevealHand.js";
// @ts-expect-error - JS module
import { MOSJE_TRIGGERS } from "../../src/engine/mosje/mosjeTriggers.js";
// @ts-expect-error - JS module
import { pushTestDice, clearTestDice } from "../../src/engine/dice/testDiceQueue.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";

afterEach(() => clearTestDice());

const mk = (cardId: string, mp = 30, extra: any = {}) => ({ cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false, ...extra });
const field = (p1: any[], p2: any[], extra: any = {}) => makeEngineState({ turnNumber: 3, ...extra, players: { player_1: { activeSlots: p1 }, player_2: { activeSlots: p2 } } });
const slot = (s: any, pid: string, i: number) => s.players[pid].activeSlots[i];
const win = (s: any, category: string) => runMosjeTriggers(s, "questSuccess", { playerId: "player_1", slotIndex: 0, quest: { category }, amount: 50 });

describe("FPS Coert: Headshot Precision", () => {
  const board = (oppSlots: any[] = [mk("mosje_a", 50), mk("mosje_b", 50)]) => field([mk("mosje_fps_coert", 30), null], oppSlots);
  it("Physical win + die 6: +30 MP and the owner chooses the opponent Mosje that loses 15", () => {
    pushTestDice([6]);
    const s = win(board(), "Physical");
    expect(s.pendingChoice.playerId).toBe("player_1");
    expect(s.pendingChoice.options).toHaveLength(2);
    const r = resolvePendingChoice(s, s.pendingChoice.options[1]);
    expect(slot(r.state, "player_1", 0).mp).toBe(60);
    expect(slot(r.state, "player_2", 1).mp).toBe(35);
    expect(slot(r.state, "player_2", 0).mp).toBe(50);
  });
  it("Technical win works; one legal target is picked automatically", () => {
    pushTestDice([6]);
    const s = win(board([mk("mosje_a", 50), null]), "Technical");
    expect(s.pendingChoice).toBeUndefined();
    expect(slot(s, "player_1", 0).mp).toBe(60);
    expect(slot(s, "player_2", 0).mp).toBe(35);
  });
  it("another Quest category or a die of 1-5: nothing happens", () => {
    pushTestDice([6]);
    expect(slot(win(board(), "Mental"), "player_1", 0).mp).toBe(30);
    clearTestDice();
    pushTestDice([5]);
    const s = win(board(), "Physical");
    expect(slot(s, "player_1", 0).mp).toBe(30);
    expect(s.pendingChoice).toBeUndefined();
  });
  it("a fresh opponent Mosje is never offered", () => {
    pushTestDice([6]);
    const s = win(board([mk("mosje_a", 50, { entryProtected: true }), mk("mosje_b", 50)]), "Physical");
    expect(slot(s, "player_2", 0).mp).toBe(50);
    expect(slot(s, "player_2", 1).mp).toBe(35);
  });
  it("only fires for his own Quest win, not a partner's", () => {
    pushTestDice([6]);
    const s = field([mk("mosje_other", 30), mk("mosje_fps_coert", 30)], [mk("mosje_a", 50), null]);
    const out = runMosjeTriggers(s, "questSuccess", { playerId: "player_1", slotIndex: 0, quest: { category: "Physical" }, amount: 50 });
    expect(slot(out, "player_1", 1).mp).toBe(30);
  });
});

describe("The Drainer: Continuous Drain", () => {
  const start = (s: any) => runMosjeTriggers(s, "oppStartOfTurn", { playerId: "player_2" });
  const board = (victims: any[]) => makeEngineState({ turnNumber: 3, activePlayerId: "player_2", players: { player_1: { activeSlots: [mk("mosje_drainer", 30), null] }, player_2: { activeSlots: victims } } });
  it("at the start of the opponent turn, the Drainer owner picks which of their Mosjes loses 5", () => {
    const s = start(board([mk("mosje_a", 50), mk("mosje_b", 40)]));
    expect(s.pendingChoice.playerId).toBe("player_1");
    const r = resolvePendingChoice(s, s.pendingChoice.options[1]);
    expect(slot(r.state, "player_2", 1).mp).toBe(35);
    expect(slot(r.state, "player_2", 0).mp).toBe(50);
  });
  it("auto-picks with one legal target; never picks a Mosje at 0 MP or a fresh one", () => {
    const s = start(board([mk("mosje_a", 0), mk("mosje_b", 40), mk("mosje_c", 40, { entryProtected: true })]));
    expect(s.pendingChoice).toBeUndefined();
    expect(slot(s, "player_2", 1).mp).toBe(35);
    expect(slot(s, "player_2", 2).mp).toBe(40);
  });
  it("nothing legal: nothing happens", () => {
    const s = start(board([mk("mosje_a", 0), null]));
    expect(s.pendingChoice).toBeUndefined();
    expect(slot(s, "player_2", 0).mp).toBe(0);
  });
  it("does not fire on the Drainer owner own turn, and not while sideways", () => {
    const own = runMosjeTriggers(board([mk("mosje_a", 50), null]), "oppStartOfTurn", { playerId: "player_1" });
    expect(slot(own, "player_2", 0).mp).toBe(50);
    const sb = board([mk("mosje_a", 50), null]);
    slot(sb, "player_1", 0).sideways = true;
    expect(slot(start(sb), "player_2", 0).mp).toBe(50);
  });
});

describe("FPS West holder text: reveal the opponent hand", () => {
  const board = (partner: boolean) => field([mk("mosje_fps_west"), partner ? mk("mosje_fps_coert") : null], [mk("mosje_a"), null]);
  it("with FPS Coert on the field: once per turn, free, shown to the owner only", () => {
    const r = fpsWestRevealHand(board(true), "player_1");
    expect(r.success).toBe(true);
    expect(r.state.revealed.player_1).toHaveLength(1);
    expect(r.state.revealed.player_2).toBeUndefined();
    expect(fpsWestRevealHand(r.state, "player_1").success).toBe(false);
  });
  it("without FPS Coert (and no Synergy Chamber) or off your turn: refused", () => {
    expect(fpsWestRevealHand(board(false), "player_1").success).toBe(false);
    expect(fpsWestRevealHand(board(true), "player_2").success).toBe(false);
  });
  it("Synergy Chamber makes it work without the partner", () => {
    const s = board(false);
    s.activePlace = "place_synergy_chamber";
    expect(fpsWestRevealHand(s, "player_1").success).toBe(true);
  });
});

describe("Deck 2 registry wiring", () => {
  it("registers every Deck 2 trigger", () => {
    const ids = (hook: string) => MOSJE_TRIGGERS[hook].map((e: any) => e.mosjeId);
    expect(ids("drawStep")).toContain("mosje_coert_tech");
    expect(ids("questSuccess")).toContain("mosje_fps_coert");
    expect(ids("oppStartOfTurn")).toContain("mosje_drainer");
    expect(ids("cardPlayedFromHand")).toContain("mosje_fps_west");
    expect(ids("endOfTurn")).toContain("mosje_fps_west");
  });
});
