// buildArtLayer.js — the <img> inside the art window. No art, or an image that
// fails to load, leaves the type-coloured fallback background showing instead.
import { escapeHtml } from './escapeHtml.js';
import { resolveArtUrl } from './resolveArtUrl.js';

export function buildArtLayer(card) {
  const url = resolveArtUrl(card.artPath);
  if (!url) return '';
  const focus = card.artFocus ? ` style="object-position:${escapeHtml(card.artFocus)}"` : '';
  return `<img class="cv1-art" src="${escapeHtml(url)}" alt="" draggable="false" onerror="this.remove()"${focus}>`;
}
