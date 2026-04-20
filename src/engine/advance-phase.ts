import { appendEvent } from "./append-event.js";
import { endTurn } from "./end-turn.js";
import type { GameState } from "../types/game-state.js";
import type { Phase } from "../types/phase.js";

export function advancePhase(state: GameState): GameState {
  const nextPhaseByCurrent: Record<Phase, Phase> = {
    draw: "main",
    main: "quest",
    quest: "end",
    end: "draw"
  };

  const nextPhase = nextPhaseByCurrent[state.currentPhase];
  const transitioned = appendEvent(
    {
      ...state,
      currentPhase: nextPhase
    },
    {
      type: "phase_changed",
      from: state.currentPhase,
      to: nextPhase
    }
  );

  if (state.currentPhase === "end") {
    return endTurn(transitioned);
  }

  return transitioned;
}
