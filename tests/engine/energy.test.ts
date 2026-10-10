import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { createInitialGameState } from "../../src/engine/gameState.js";
// @ts-expect-error — JS module, no type declarations
import { startTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { payEnergy } from "../../src/engine/energy/payEnergy.js";
// @ts-expect-error — JS module, no type declarations
import { canPay } from "../../src/engine/energy/canPay.js";
// @ts-expect-error — JS module, no type declarations
import { gainEnergy } from "../../src/engine/energy/gainEnergy.js";

/** E1 — Energy pool: start 2, +1 per own turn, max 6, carry-over, safe payment. */
function newGame() {
  return createInitialGameState(
    [
      { playerId: "player_1", name: "One", deckId: "EXAMPLE_TAKSEN" },
      { playerId: "player_2", name: "Two", deckId: "EXAMPLE_TAKSEN" },
    ],
    "TEST",
  );
}

describe("E1 Energy", () => {
  it("new game gives both players 2 Energy and an empty welloePile", () => {
    const s = newGame();
    for (const id of ["player_1", "player_2"]) {
      expect(s.players[id].energy).toBe(2);
      expect(s.players[id].welloePile).toEqual([]);
    }
  });

  it("startTurn adds +1 Energy up to the cap of 6", () => {
    let s = newGame();
    const seen: number[] = [];
    for (let i = 0; i < 5; i++) {
      s.activePlayerId = "player_1";
      s = startTurn(s);
      seen.push(s.players.player_1.energy);
    }
    expect(seen).toEqual([3, 4, 5, 6, 6]);
  });

  it("unspent Energy carries over", () => {
    let s = newGame();
    s.players.player_1.energy = 4;
    expect(payEnergy(s, "player_1", 1).success).toBe(true);
    s.activePlayerId = "player_1";
    s = startTurn(s);
    expect(s.players.player_1.energy).toBe(4);
  });

  it("refuses overpay and leaves Energy untouched", () => {
    const s = newGame();
    s.players.player_1.energy = 3;
    const r = payEnergy(s, "player_1", 4);
    expect(r.success).toBe(false);
    expect(r.error).toBe("Not enough Energy");
    expect(s.players.player_1.energy).toBe(3);
  });

  it("refuses negative, NaN, non-integer and string amounts", () => {
    const s = newGame();
    s.players.player_1.energy = 3;
    for (const bad of [-1, 1.5, NaN, "2"]) {
      const r = payEnergy(s, "player_1", bad);
      expect(r.success).toBe(false);
      expect(r.error).toBe("Invalid cost");
      expect(s.players.player_1.energy).toBe(3);
    }
  });

  it("refuses an unknown player", () => {
    const r = payEnergy(newGame(), "nobody", 1);
    expect(r.success).toBe(false);
    expect(r.error).toBe("Player not found");
  });

  it("pays 0 as a no-op and can drain to exactly 0", () => {
    const s = newGame();
    s.players.player_1.energy = 3;
    expect(payEnergy(s, "player_1", 0).success).toBe(true);
    expect(s.players.player_1.energy).toBe(3);
    expect(payEnergy(s, "player_1", 3).success).toBe(true);
    expect(s.players.player_1.energy).toBe(0);
  });

  it("canPay mirrors payEnergy without mutating", () => {
    const p = { energy: 3 };
    expect(canPay(p, 3)).toBe(true);
    expect(canPay(p, 4)).toBe(false);
    expect(canPay(p, -1)).toBe(false);
    expect(canPay(p, NaN)).toBe(false);
    expect(canPay({}, 0)).toBe(false);
    expect(p.energy).toBe(3);
  });

  it("gainEnergy caps at 6 and ignores invalid amounts", () => {
    const s = newGame();
    s.players.player_1.energy = 5;
    gainEnergy(s, "player_1", 5);
    expect(s.players.player_1.energy).toBe(6);
    gainEnergy(s, "player_1", -2);
    gainEnergy(s, "player_1", 0.5);
    expect(s.players.player_1.energy).toBe(6);
  });

  it("a skipped (cooldown) turn still receives +1 Energy", () => {
    const s = newGame();
    s.activePlayerId = "player_1";
    s.players.player_1.skipNextTurn = true;
    const out = startTurn(s);
    expect(out.players.player_1.energy).toBe(3);
  });
});
