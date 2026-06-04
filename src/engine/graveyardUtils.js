// graveyardUtils.js — Pure graveyard helpers. No side effects.

/**
 * toGraveyardEntry — builds a typed graveyard entry for any card.
 * @param {string} cardId
 * @param {Array<{id:string, name:string, type:string}>} allCardData - flat array of all card definitions
 * @param {string} source - 'defeated' | 'played' | 'discarded' | 'destroyed'
 * @returns {{ cardId: string, name: string, type: string, source: string }}
 */
export function toGraveyardEntry(cardId, allCardData, source) {
  const def = allCardData.find(c => c.id === cardId);
  return {
    cardId,
    name: def?.name ?? cardId,
    type: def?.type ?? 'HAND_CARD',
    source,
  };
}

/**
 * addToGraveyard — pure function; returns new state with entry pushed to player.graveyard.
 * @param {object} state
 * @param {string} playerId
 * @param {string} cardId
 * @param {Array} allCardData
 * @param {string} source
 * @returns {object} new state
 */
export function addToGraveyard(state, playerId, cardId, allCardData, source) {
  const entry = toGraveyardEntry(cardId, allCardData, source);
  const player = state.players[playerId];
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        graveyard: [...(player.graveyard ?? []), entry],
      },
    },
  };
}

/**
 * getGraveyardByType — returns all graveyard entries of a given type.
 * @param {object} player
 * @param {string} type - e.g. 'MOSJE' | 'PIECIE' | 'PLACE' | 'HAND_CARD'
 * @returns {Array}
 */
export function getGraveyardByType(player, type) {
  return (player.graveyard ?? []).filter(e => e.type === type);
}
