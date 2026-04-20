import { describe, expect, it } from "vitest";
import { deepFreeze } from "../../src/utils/freeze.js";

describe("deepFreeze", () => {
  it("throws when mutating frozen objects in strict mode", () => {
    const state = deepFreeze({
      player: { name: "P1", mp: 10 },
      flags: ["a", "b"]
    });

    expect(() => {
      // eslint-disable-next-line no-param-reassign
      (state.player as { mp: number }).mp = 20;
    }).toThrow();

    expect(() => {
      (state.flags as string[]).push("c");
    }).toThrow();
  });
});
