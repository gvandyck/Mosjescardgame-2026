// showHoverPanel.js — Arena-style hover: show the full card face, enlarged, beside
// the hovered card (to its right, or its left when there is no room).
import { buildCardV1 } from './buildCardV1.js';
import { hideHoverPanel } from './hideHoverPanel.js';

const WIDTH = 340;
const GAP = 14;
const MARGIN = 8;

export function showHoverPanel(anchor, card) {
  hideHoverPanel();
  const v1 = buildCardV1(card, { fieldMode: false });
  if (!v1) return;
  const width = Math.min(WIDTH, (window.innerHeight - 2 * MARGIN) / 1.5);
  const big = document.createElement('div');
  big.className = `card ${v1.className} cv1-hover-panel`;
  big.style.setProperty('--cv1-w', `${width}px`);
  big.innerHTML = v1.html;
  document.body.appendChild(big);

  const a = anchor.getBoundingClientRect();
  const height = width * 1.5;
  let left = a.right + GAP;
  if (left + width > window.innerWidth - MARGIN) left = a.left - GAP - width;
  left = Math.max(MARGIN, left);
  const centred = a.top + a.height / 2 - height / 2;
  const top = Math.max(MARGIN, Math.min(centred, window.innerHeight - height - MARGIN));
  big.style.left = `${left}px`;
  big.style.top = `${top}px`;
}
