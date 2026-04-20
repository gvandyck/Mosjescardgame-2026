export function U2_anyDeckScopeCheck(player, chosenDeck) {
  if (!player || !chosenDeck) return false;

  const ownerId = chosenDeck.ownerId;
  if (!ownerId) return false;

  if (ownerId === player.playerId) return true;
  if (!Array.isArray(player.opponentIds)) return false;

  return player.opponentIds.includes(ownerId);
}
