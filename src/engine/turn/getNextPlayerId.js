// getNextPlayerId — next seat, and whether play wraps back to the first player (round counter).
export function getNextPlayerId(state, playerId) {
  const ids = Object.keys(state.players);
  const currentIndex = ids.indexOf(playerId);
  const nextIndex = (currentIndex + 1) % ids.length;
  const nextPlayerId = ids[nextIndex];
  const wrapsRound = state.firstPlayerId ? nextPlayerId === state.firstPlayerId : nextIndex === 0;
  return { nextPlayerId, wrapsRound };
}
