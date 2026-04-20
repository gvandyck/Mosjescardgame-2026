import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGame } from "../../src/engine/create-game.js";
import { endTurn } from "../../src/engine/end-turn.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { PROOF_CONDITIONAL_DRAIN } from "../../src/cards/proof/proof-conditional-drain.js";
import { PROOF_SIMPLE_GAIN } from "../../src/cards/proof/proof-simple-gain.js";
import { PROOF_SYNERGY_BUFF } from "../../src/cards/proof/proof-synergy-buff.js";
import type { CardInvocation } from "../../src/cards/executor/execute-card.js";
import type { GameState } from "../../src/types/game-state.js";
import type { CardId } from "../../src/types/card-id.js";

function cardId(s: string): CardId {
  return s as CardId;
}

/**
 * Build a state where p2's active mosje has Social 3 trait,
 * starting from the Phase 1 createGame factory output.
 */
function buildTestGame(): GameState {
  const base = createGame({
    players: [
      {
        id: "p1",
        name: "Player 1",
        deck: (["d1", "d2", "d3", "d4", "d5"] as CardId[]),
        mosjes: [
          { cardId: cardId("mosje_a"), startMP: 50 },
          { cardId: cardId("mosje_b"), startMP: 10 }
        ]
      },
      {
        id: "p2",
        name: "Player 2",
        deck: (["e1", "e2", "e3"] as CardId[]),
        mosjes: [
          { cardId: cardId("mosje_c"), startMP: 80 },
          { cardId: cardId("mosje_d"), startMP: 20 }
        ]
      }
    ],
    seed: 42
  });

  // Give p2's first mosje Social 3 trait so proof-conditional-drain hits the 'then' branch
  return {
    ...base,
    players: base.players.map((p) =>
      p.id !== "p2"
        ? p
        : {
            ...p,
            mosjes: p.mosjes.map((m, i) =>
              i !== 0 ? m : { ...m, flags: { traits: { Social: 3 } } }
            )
          }
    )
  };
}

describe("phase 3 executor integration (step 6)", () => {
  let state: GameState;

  // Capture instance IDs after createGame assigns them
  let p1m1: string;
  let p1m2: string;
  let p2m1: string;

  beforeEach(() => {
    clearRegistry();
    registerCard(PROOF_SIMPLE_GAIN);
    registerCard(PROOF_CONDITIONAL_DRAIN);
    registerCard(PROOF_SYNERGY_BUFF);

    state = buildTestGame();

    p1m1 = state.players[0]!.mosjes[0]!.instanceId;
    p1m2 = state.players[0]!.mosjes[1]!.instanceId;
    p2m1 = state.players[1]!.mosjes[0]!.instanceId;
  });

  afterEach(() => clearRegistry());

  it("step A: Player A executes proof-simple-gain → MP +25", () => {
    const invocation: CardInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: p1m1 }
    };

    state = executeCard(state, cardId("proof-simple-gain"), invocation);

    const m1 = state.players[0]!.mosjes[0]!;
    expect(m1.mp).toBe(75); // 50 + 25
    expect(state.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
  });

  it("step B: Player A drains from Player B's mosje (Social 3 → then branch, drain 20)", () => {
    const invocation: CardInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: p1m1 },
      targetRef: { playerId: "p2", instanceId: p2m1 }
    };

    state = executeCard(state, cardId("proof-conditional-drain"), invocation);

    // p1 pays 10 MP: 50 - 10 = 40, gains 20 from drain: 40 + 20 = 60
    expect(state.players[0]!.mosjes[0]!.mp).toBe(60);
    // p2 loses 20 from drain: 80 - 20 = 60
    expect(state.players[1]!.mosjes[0]!.mp).toBe(60);
  });

  it("step C: Player A executes proof-synergy-buff WITHOUT partner → buff only (no bonus)", () => {
    const invocation: CardInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: p1m1 }
    };

    // p1's mosjes have cardIds 'mosje_a' and 'mosje_b' — neither is 'proof-simple-gain'
    // so synergy does NOT fire
    state = executeCard(state, cardId("proof-synergy-buff"), invocation);

    const m1 = state.players[0]!.mosjes[0]!;
    // 50 - 15 (cost) = 35. No synergy bonus.
    expect(m1.mp).toBe(35);
    expect(m1.flags["buff:mp-loss-reduction"]).toBeDefined();
    expect(state.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
  });

  it("step D: Put partner on field, execute proof-synergy-buff again → buff + bonus", () => {
    // Change p1m2's cardId to 'proof-simple-gain' so synergy fires
    state = {
      ...state,
      players: state.players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== p1m2 ? m : { ...m, cardId: cardId("proof-simple-gain") }
              )
            }
      )
    };

    const invocation: CardInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: p1m1 }
    };

    state = executeCard(state, cardId("proof-synergy-buff"), invocation);

    const m1 = state.players[0]!.mosjes[0]!;
    // 50 - 15 (cost) + 15 (synergy bonus gainMP) = 50
    expect(m1.mp).toBe(50);
    expect(m1.flags["buff:mp-loss-reduction"]).toBeDefined();
  });

  it("step E: Buff expires after two full turns", () => {
    // Apply the buff first (with no partner so cost is just paid, buff applied)
    const invocation: CardInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: p1m1 }
    };
    state = executeCard(state, cardId("proof-synergy-buff"), invocation);

    // Confirm buff exists
    expect(state.players[0]!.mosjes[0]!.flags["buff:mp-loss-reduction"]).toBeDefined();

    // Advance two full turns (both players take a turn)
    state = endTurn(state); // turn 1 → 2 (p1's turn ends)
    state = endTurn(state); // turn 2 → 3 (p2's turn ends)

    // buff expiryTurn = 1 (original turnCount) + 2 (duration) = 3
    // clearExpiredBuffs runs with turnCount = 3 → removes expiryTurn <= 3
    const m1After = state.players[0]!.mosjes[0]!;
    expect(m1After.flags["buff:mp-loss-reduction"]).toBeUndefined();
  });

  it("step F: Full event log sequence matches expected shape", () => {
    // Run the full sequence and verify the event log has the right event types in order
    const invSelf: CardInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: p1m1 }
    };
    const invToP2: CardInvocation = {
      ...invSelf,
      targetRef: { playerId: "p2", instanceId: p2m1 }
    };

    // 1. proof-simple-gain
    state = executeCard(state, cardId("proof-simple-gain"), invSelf);
    // 2. proof-conditional-drain
    state = executeCard(state, cardId("proof-conditional-drain"), invToP2);
    // 3. proof-synergy-buff (no partner)
    state = executeCard(state, cardId("proof-synergy-buff"), invSelf);

    const log = state.eventLog;

    // proof-simple-gain: mp_gained + card_resolved
    const gainEvent = log.find((e) => e.type === "mp_gained" && (e as { amount: number }).amount === 25);
    expect(gainEvent).toBeDefined();

    // proof-conditional-drain: mp_drained (20) + card_resolved
    const drainEvent = log.find((e) => e.type === "mp_drained" && (e as { amount: number }).amount === 20);
    expect(drainEvent).toBeDefined();

    // proof-synergy-buff: mp_lost (cost 15) + buff_applied + card_resolved
    const mpLostEvents = log.filter((e) => e.type === "mp_lost");
    expect(mpLostEvents.length).toBeGreaterThanOrEqual(1);
    const buffEvent = log.find((e) => e.type === "buff_applied");
    expect(buffEvent).toBeDefined();

    // All three cards should have card_resolved events
    const resolvedEvents = log.filter((e) => e.type === "card_resolved");
    expect(resolvedEvents).toHaveLength(3);
    expect(resolvedEvents.every((e) => (e as { outcome: string }).outcome === "success")).toBe(true);
  });
});
