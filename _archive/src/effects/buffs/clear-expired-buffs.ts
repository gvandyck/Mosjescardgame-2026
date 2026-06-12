import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";

export const clearExpiredBuffs: Primitive<Record<string, never>> = (state, _params, context) => {
  let nextState = state;

  for (const player of state.players) {
    for (const [flagKey, flagValue] of Object.entries(player.flags)) {
      if (!flagKey.startsWith("buff:")) continue;
      const expiryTurn = Number((flagValue as { expiryTurn?: number }).expiryTurn ?? Number.NaN);
      if (!Number.isFinite(expiryTurn) || expiryTurn > context.turnCount) continue;

      const updatedPlayers = nextState.players.map((candidate) => {
        if (candidate.id !== player.id) return candidate;
        const nextFlags = { ...candidate.flags };
        delete nextFlags[flagKey];
        return { ...candidate, flags: nextFlags };
      });
      nextState = appendEvent({ ...nextState, players: updatedPlayers }, {
        type: "buff_expired",
        target: { playerId: player.id },
        buffId: flagKey.replace("buff:", "")
      });
    }

    for (const mosje of player.mosjes) {
      for (const [flagKey, flagValue] of Object.entries(mosje.flags)) {
        if (!flagKey.startsWith("buff:")) continue;
        const expiryTurn = Number((flagValue as { expiryTurn?: number }).expiryTurn ?? Number.NaN);
        if (!Number.isFinite(expiryTurn) || expiryTurn > context.turnCount) continue;

        const updatedPlayers = nextState.players.map((candidate) => {
          if (candidate.id !== player.id) return candidate;
          return {
            ...candidate,
            mosjes: candidate.mosjes.map((candidateMosje) => {
              if (candidateMosje.instanceId !== mosje.instanceId) return candidateMosje;
              const nextFlags = { ...candidateMosje.flags };
              delete nextFlags[flagKey];
              return { ...candidateMosje, flags: nextFlags };
            })
          };
        });
        nextState = appendEvent({ ...nextState, players: updatedPlayers }, {
          type: "buff_expired",
          target: { playerId: player.id, instanceId: mosje.instanceId },
          buffId: flagKey.replace("buff:", "")
        });
      }
    }
  }

  return nextState;
};
