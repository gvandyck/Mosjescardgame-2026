// isCooldownBlocked.js - Obby 2.0 RULE-07: on a cooldown turn only face-down Piecies may be placed.
export const COOLDOWN_ERROR = 'Cooldown turn: only face-down Piecies';

export function isCooldownBlocked(state, playerId) {
  return state?.players?.[playerId]?.cooldownTurn === true;
}
