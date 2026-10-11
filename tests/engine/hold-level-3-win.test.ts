import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { applyGainToSlot } from "../../src/engine/mp/applyGainToSlot.js";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { checkVictory } from "../../src/engine/victoryChecker.js";
// @ts-expect-error — JS module, no type declarations
import { startTurn, endTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");
const other = MOSJES.find((m: any) => m.id !== "mosje_gandoe_wizard");
const filler = (n: number) => Array.from({ length: n }, (_, i) => ({ cardId: `filler_${i}`, type: "PIECIE" }));

function build(level = 2, mp = 95) {
  const mine = createMosjeSlot(def, { level, mp });
  mine.entryProtected = false;
  const foe = createMosjeSlot(other, { level: 1, mp: 50 });
  foe.entryProtected = false;
  return makeEngineState({
    turnNumber: 5,
    players: {
      player_1: { activeSlots: [mine, null], deck: filler(5) },
      player_2: { activeSlots: [foe, null], deck: filler(5) },
    },
  });
}

describe("hold Level 3 to win (Obby 2.0 §2b)", () => {
  it("E7: reaching L3 does not end the game; holding it to the next own turn wins", () => {
    let s = build();
    applyGainToSlot(s.players.player_1.activeSlots[0], 10, { turnNumber: 5 });
    expect(s.players.player_1.activeSlots[0].level).toBe(3);
    s = checkVictory(s);
    expect(s.status).toBe("PLAYING");
    s = endTurn(s);
    expect(s.status).toBe("PLAYING");
    expect(s.activePlayerId).toBe("player_2");
    s = startTurn(s);
    expect(s.status).toBe("PLAYING");
    s = endTurn(s);
    s = startTurn(s);
    expect(s.status).toBe("FINISHED");
    expect(s.winnerId).toBe("player_1");
    expect(s.winReason).toBe("LEVEL_3");
  });

  it("E7 negative: a Mosje getemt below L3 before its owner's turn does not win", () => {
    let s = build(3, 95);
    s.activePlayerId = "player_2";
    s = loseMP(s, "player_1", 0, 100, "DRAIN");
    expect(s.players.player_1.activeSlots[0].level).toBe(2);
    s.activePlayerId = "player_1";
    s = startTurn(s);
    expect(s.status).toBe("PLAYING");
  });

  it("E7 skip: a V4 skipNextTurn does not stop the win check", () => {
    let s = build(3, 50);
    s.players.player_1.skipNextTurn = true;
    s = startTurn(s);
    expect(s.status).toBe("FINISHED");
    expect(s.winnerId).toBe("player_1");
  });

  it("E7: the Level 3 holder wins only on their own turn start, not on the opponent's", () => {
    let s = build(3, 50);
    s.activePlayerId = "player_2";
    s = startTurn(s);
    expect(s.status).toBe("PLAYING");
  });
});
