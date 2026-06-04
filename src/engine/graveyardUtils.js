// graveyardUtils.js — Pure graveyard helpers. No side effects.

import { MOSJES } from '../data/mosjes.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';
import { SNELLE_PIECIES } from '../data/snellePiecies.js';
import { QUESTS } from '../data/quests.js';

// Internal lookup built once — includes every card type so callers never miss a type.
const ALL_CARD_DATA = [...MOSJES, ...PIECIES, ...PLACES, ...SNELLE_PIECIES, ...QUESTS];
const CARD_DEF_MAP = Object.fromEntries(ALL_CARD_DATA.map(c => [c.id, c]));

/**
 * toGraveyardEntry — builds a typed graveyard entry for any card.
 * @param {string} cardId
 * @param {string} source - 'defeated' | 'played' | 'discarded' | 'destroyed'
 * @returns {{ cardId: string, name: string, type: string, source: string }}
 */
export function toGraveyardEntry(cardId, source) {
  const def = CARD_DEF_MAP[cardId];
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
 * @param {string} source
 * @returns {object} new state
 */
export function addToGraveyard(state, playerId, cardId, source) {
  const entry = toGraveyardEntry(cardId, source);
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
