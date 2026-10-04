// attachHoverPanel.js — show the hover panel while the pointer is over a card.
// Pressing the card (click opens the detail modal, or plays it) hides the panel.
import { showHoverPanel } from './showHoverPanel.js';
import { hideHoverPanel } from './hideHoverPanel.js';

export function attachHoverPanel(element, card) {
  element.addEventListener('mouseenter', () => showHoverPanel(element, card));
  element.addEventListener('mouseleave', hideHoverPanel);
  element.addEventListener('mousedown', hideHoverPanel);
  element.addEventListener('remove', hideHoverPanel);
}
