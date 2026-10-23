// buildCardPanel.js — the hover / detail panel markup (D-09): one .cv2-panel with one escaped line per entry of
// getCardPanelLines, or '' when the card has nothing to show. Pure string builder; the caller decides where it goes.
import { escapeHtml } from './escapeHtml.js';
import { getCardPanelLines } from './getCardPanelLines.js';

export function buildCardPanel(card) {
  const lines = getCardPanelLines(card);
  if (!lines.length) return '';
  const body = lines.map((l) => `<p class="cv2-panel-line cv2-panel-line--${l.kind}">${escapeHtml(l.text)}</p>`).join('');
  return `<div class="cv2-panel">${body}</div>`;
}
