export function U5_computeEffectExpiryTurn(currentTurnCount, turns) {
  if (!Number.isInteger(currentTurnCount) || currentTurnCount < 0) {
    throw new Error("currentTurnCount must be a non-negative integer");
  }
  if (!Number.isInteger(turns) || turns < 0) {
    throw new Error("turns must be a non-negative integer");
  }
  return currentTurnCount + turns;
}
