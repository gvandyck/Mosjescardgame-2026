// getMosjeTypeKey.js — FIGHTING | DIGITAL | ARTISTIC for a Mosje card. Falls back
// to FIGHTING (and never throws) if the subtype is missing or unknown.
import { TYPE_COLORS } from './typeColors.js';

export function getMosjeTypeKey(card) {
  const key = String(card?.subtype || '').toUpperCase();
  return ['FIGHTING', 'DIGITAL', 'ARTISTIC'].includes(key) && TYPE_COLORS[key] ? key : 'FIGHTING';
}
