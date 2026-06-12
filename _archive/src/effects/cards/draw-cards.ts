import { appendEvent } from "../../engine/append-event.js";
import { drawCard } from "../../engine/reducers/player/draw-card.js";
import type { Primitive } from "../primitive.js";
import type { DrawCardsParams } from "./types.js";

export const drawCards: Primitive<DrawCardsParams> = (state, params) => {
  let nextState = state;

  for (let i = 0; i < params.count; i += 1) {
    const before = nextState.players.find((player) => player.id === params.playerId)?.deck.length ?? 0;
    const drawn = drawCard(nextState, { playerId: params.playerId });
    const after = drawn.players.find((player) => player.id === params.playerId)?.deck.length ?? 0;

    if (before === after) {
      nextState = appendEvent(drawn, {
        type: "warning",
        code: "draw_empty_deck",
        message: `Player ${params.playerId} attempted to draw from an empty deck`
      });
      break;
    }

    nextState = drawn;
  }

  return nextState;
};
