import { describe, expect, it } from "vitest";
import { makeInstanceId } from "../../src/utils/id.js";

describe("makeInstanceId", () => {
  it("is deterministic for same inputs", () => {
    const one = makeInstanceId("mosje", 42, 7);
    const two = makeInstanceId("mosje", 42, 7);
    expect(one).toBe(two);
  });

  it("is unique across 100000 counters for same prefix and seed", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100_000; i += 1) {
      ids.add(makeInstanceId("effect", 777, i));
    }
    expect(ids.size).toBe(100_000);
  });

  it("changes when seed changes", () => {
    const a = makeInstanceId("mosje", 1, 10);
    const b = makeInstanceId("mosje", 2, 10);
    expect(a).not.toBe(b);
  });
});
