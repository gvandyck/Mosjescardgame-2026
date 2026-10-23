// cardAudit.js — card-audit.html: every card in the game, grouped by type, through the real
// renderCard. Flags cards whose 2.0 text is cut without a clamp flag, or whose zones leave the card, so they can be fixed.
import { MOSJES } from '../data/mosjes.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';
import { SNELLE_PIECIES } from '../data/snellePiecies.js';
import { QUESTS } from '../data/quests.js';
import { renderCard } from './cardRenderer.js';

const mosjeOf = (s) => MOSJES.filter((c) => String(c.subtype).toUpperCase() === s);
const GROUPS = [
  ['Fighting Mosjes', mosjeOf('FIGHTING')],
  ['Digital Mosjes', mosjeOf('DIGITAL')],
  ['Artistic Mosjes', mosjeOf('ARTISTIC')],
  ['Piecies', PIECIES],
  ['Snelle Piecies', SNELLE_PIECIES],
  ['Places', PLACES],
  ['Quests', QUESTS.filter((q) => q.type === 'QUEST')],
];

const root = document.getElementById('audit-root');
const problems = document.getElementById('problems');
const state = { w: 300, type: 'all', field: false };

// A 2.0 card overflows when its text box text is cut without the face being flagged clamped (data-cv1-clamped: fade +
// ellipsis, D-02), or when one of its zones sits outside the card. A V4 Quest on the unified template has no cv2 zones.
const ZONES = '.cv2-corner, .cv2-name, .cv2-first, .cv2-nick, .cv2-textbox, .cv2-info, .cv2-pills, .cv2-label, .cv2-footer';
function isOverflowing(el) {
  const card = el.getBoundingClientRect();
  const text = el.querySelector('.cv2-text');
  const clamped = el.querySelector('.cv1-face--2')?.dataset.cv1Clamped === 'true';
  if (text && !clamped && text.scrollHeight > text.clientHeight + 1) return true;
  return [...el.querySelectorAll(ZONES)].some((n) => {
    const r = n.getBoundingClientRect();
    return r.right > card.right + 1 || r.left < card.left - 1 || r.bottom > card.bottom + 1 || r.top < card.top - 1;
  });
}

function render() {
  root.innerHTML = '';
  problems.innerHTML = '';
  document.documentElement.style.setProperty('--cell-w', `${state.field ? Math.round(state.w * 0.75) : state.w}px`);
  const bad = [];
  for (const [title, cards] of GROUPS) {
    if (state.type !== 'all' && state.type !== title) continue;
    const h = document.createElement('h2'); h.textContent = `${title} (${cards.length})`; root.append(h);
    const grid = document.createElement('div'); grid.className = 'grid'; root.append(grid);
    for (const card of cards) {
      const cell = document.createElement('div'); cell.className = 'cell';
      const el = renderCard(card, { fieldMode: state.field });
      const label = document.createElement('div'); label.className = 'label';
      label.textContent = `${card.name} · ${card.rarity || '—'}`;
      cell.append(el, label); grid.append(cell);
      requestAnimationFrame(() => {
        if (!state.field && isOverflowing(el)) { cell.classList.add('bad'); bad.push(`${title}: ${card.name}`); renderProblems(bad); }
      });
    }
  }
}

function renderProblems(bad) {
  problems.innerHTML = `<b>${bad.length} card(s) with overflowing text:</b><ul>${bad.map((b) => `<li>${b}</li>`).join('')}</ul>`;
}

const typeButtons = document.getElementById('type-buttons');
for (const name of ['all', ...GROUPS.map((g) => g[0])]) {
  const b = document.createElement('button'); b.textContent = name; if (name === 'all') b.classList.add('active');
  b.onclick = () => { state.type = name; [...typeButtons.children].forEach((x) => x.classList.toggle('active', x === b)); render(); };
  typeButtons.append(b);
}
document.querySelectorAll('.controls button[data-w]').forEach((b) => {
  b.onclick = () => { state.w = Number(b.dataset.w); document.querySelectorAll('.controls button[data-w]').forEach((x) => x.classList.toggle('active', x === b)); render(); };
});
document.getElementById('field-toggle').onchange = (e) => { state.field = e.target.checked; render(); };
render();
