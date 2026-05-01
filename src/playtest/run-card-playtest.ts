import { createGame } from "../engine/create-game.js";
import { applyVictoryCheck } from "../engine/apply-victory-check.js";
import { aiTakeTurn } from "../simulation/ai-player.js";
import { injectCardIntoHand, getActiveMosjeMP } from "./inject-card.js";
import { getCard } from "../cards/registry/card-registry.js";
import { createRng } from "../utils/rng.js";
import type {
  CardPlaytestSpec,
  PlaytestResult,
  ExpectationResult,
} from "./types.js";
import type { GameState } from "../types/game-state.js";
import type { GameEvent } from "../types/events.js";

export function runCardPlaytest(spec: CardPlaytestSpec): PlaytestResult {
  const seed = 42;

  let state: GameState;

  try {
    state = createGame({
      seed,
      players: [
        {
          id: "player1",
          name: "Tester",
          deck: spec.deck,
          mosjes: [spec.mosje, { cardId: "alyssa-the-bulldozer" as any, startMP: 10 }],
        },
        {
          id: "player2",
          name: "Opponent",
          deck: spec.deck,
          mosjes: [spec.opponentMosje, { cardId: "martin-the-historian" as any, startMP: 10 }],
        },
      ],
    });
  } catch (err) {
    const err_msg = err instanceof Error ? err.message : String(err);
    return buildFailedResult(spec, `Failed to create game: ${err_msg}`, []);
  }

  state = injectCardIntoHand(state, "player1", spec.cardId);
  const eventLogLengthBefore = state.eventLog.length;
  const beforeState = state;
  const beforeMP = getActiveMosjeMP(state, "player1");

  const player1BeforeHand = state.players[0].hand.slice();
  const isPlayersTurn = state.currentPlayerId === "player1";

  const rng = createRng(seed);

  try {
    state = aiTakeTurn(state, "player1", rng);
    state = applyVictoryCheck(state);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return buildFailedResult(
      spec,
      `Error during AI turn: ${errorMsg}`,
      state.eventLog.slice(eventLogLengthBefore)
    );
  }

  const newEvents = state.eventLog.slice(eventLogLengthBefore);

  const cardResolvedEvent = newEvents.find(
    (e) => e.type === "card_resolved" && (e as any).cardId === spec.cardId
  ) as any;

  const played = !!cardResolvedEvent;
  const outcome = cardResolvedEvent?.outcome ?? "not_played";

  if (!played) {
    console.error(`\n[DEBUG ${spec.cardId}] was not played.`);
    console.error(`  Events in this turn: ${newEvents.length}`);
    console.error(`  Card resolved events: ${newEvents.filter((e) => e.type === "card_resolved").map((e) => (e as any).cardId).join(", ") || "NONE"}`);
    console.error(`  Hand before AI turn: ${player1BeforeHand.join(", ")}`);
    console.error(`  Hand after AI turn: ${state.players[0].hand.join(", ")}`);
  }

  const expectations: ExpectationResult[] = [];

  for (const expectation of spec.expectations) {
    if (expectation.type === "card_resolved") {
      const pass =
        !expectation.outcome || outcome === expectation.outcome;
      expectations.push({
        passed: pass,
        description: expectation.description,
        details: pass ? undefined : `Expected outcome ${expectation.outcome}, got ${outcome}`,
      });
    } else if (expectation.type === "event_emitted") {
      const matchingEvents = newEvents.filter((e) =>
        expectation.check(e, beforeState)
      );
      const pass = matchingEvents.length > 0;
      expectations.push({
        passed: pass,
        description: expectation.description,
        details: pass
          ? `Found ${matchingEvents.length} matching event(s)`
          : `No matching events found. Available events: ${newEvents.map((e) => e.type).join(", ")}`,
      });
    } else if (expectation.type === "state_change") {
      const pass = expectation.check(beforeState, state);
      expectations.push({
        passed: pass,
        description: expectation.description,
        details: pass
          ? "State change verified"
          : "State change check failed",
      });
    }
  }

  const allPassed = expectations.every((e) => e.passed);
  const diagnosis = generateDiagnosis(spec, played, outcome, expectations);

  let resultOutcome: "success" | "rejected" | "partial" | "not_played" =
    "not_played";
  if (played) {
    resultOutcome = outcome;
  }

  const card = getCard(spec.cardId);

  return {
    cardId: spec.cardId,
    cardName: card.name,
    description: spec.description,
    played,
    outcome: resultOutcome,
    expectations,
    actualEvents: newEvents,
    diagnosis,
  };
}

function buildFailedResult(
  spec: CardPlaytestSpec,
  diagnosis: string,
  events: ReadonlyArray<GameEvent>
): PlaytestResult {
  const card = getCard(spec.cardId);
  return {
    cardId: spec.cardId,
    cardName: card.name,
    description: spec.description,
    played: false,
    outcome: "not_played",
    expectations: [],
    actualEvents: events,
    diagnosis,
  };
}

function generateDiagnosis(
  spec: CardPlaytestSpec,
  played: boolean,
  outcome: string,
  expectations: ReadonlyArray<ExpectationResult>
): string {
  if (!played) {
    return `Card was not played. Possible reasons: cost requirements not met, hand management failed, or AI skipped it.`;
  }

  const failedExpectations = expectations.filter((e) => !e.passed);

  if (failedExpectations.length === 0) {
    return `All expectations passed. Card executed as designed.`;
  }

  if (outcome === "partial") {
    return `Card resolved with partial outcome. Failed checks: ${failedExpectations.map((e) => e.description).join("; ")}. Some effects may have been blocked or deferred.`;
  }

  const eventIssues = failedExpectations.filter(
    (e) => !e.description.includes("State")
  );

  if (eventIssues.length > 0) {
    return `Card resolved but expected events were not emitted. Failed: ${eventIssues.map((e) => e.description).join("; ")}. Check if effect primitives are registered and fired correctly.`;
  }

  return `Card resolved with outcome "${outcome}" but state changes did not match expectations: ${failedExpectations.map((e) => e.description).join("; ")}.`;
}
