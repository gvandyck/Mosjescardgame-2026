// allCards.js — every card in the game, grouped by type, for the card editor.
import { MOSJES } from '../../data/mosjes.js';
import { PIECIES } from '../../data/piecies.js';
import { PLACES } from '../../data/places.js';
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { QUESTS } from '../../data/quests.js';

const mosjeOf = (s) => MOSJES.filter((c) => String(c.subtype).toUpperCase() === s);

export const CARD_GROUPS = [
  ['Fighting', mosjeOf('FIGHTING')],
  ['Digital', mosjeOf('DIGITAL')],
  ['Artistic', mosjeOf('ARTISTIC')],
  ['Piecies', PIECIES],
  ['Snelles', SNELLE_PIECIES],
  ['Places', PLACES],
  ['Quests', QUESTS.filter((q) => q.type === 'QUEST')],
];
