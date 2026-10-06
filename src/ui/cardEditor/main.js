// main.js — card-editor.html: pick any card, set its rarity (stars) and drag its artwork.
// Every change is saved straight into src/data/*.js by scripts/card-editor/server.mjs.
import { renderCard } from '../cardRenderer.js';
import { CARD_GROUPS } from './allCards.js';
import { saveEdit } from './saveEdit.js';
import { enableArtDrag, parseFocus, formatFocus } from './enableArtDrag.js';

const $ = (id) => document.getElementById(id);
const RARITIES = ['★', '★★', '★★★', '★★★★', '★★★★★'];
const state = { card: null, type: 'all', query: '', edited: new Set() };
const allEntries = CARD_GROUPS.flatMap(([group, cards]) => cards.map((card) => ({ group, card })));

function setStatus(text, kind = '') { const s = $('status'); s.textContent = text; s.className = kind; }

async function persist(edit) {
  setStatus('Saving...');
  const res = await saveEdit({ id: state.card.id, ...edit });
  if (res.ok) { state.edited.add(state.card.id); setStatus(`Saved to ${res.file}`, 'ok'); } else setStatus(`Not saved: ${res.error}`, 'err');
  renderList();
}

function renderList() {
  const q = state.query.trim().toLowerCase();
  const list = $('card-list'); list.innerHTML = '';
  let lastGroup = '';
  for (const { group, card } of allEntries) {
    if (state.type !== 'all' && state.type !== group) continue;
    if (q && !String(card.name).toLowerCase().includes(q)) continue;
    if (group !== lastGroup) { const h = document.createElement('div'); h.className = 'group-h'; h.textContent = group; list.append(h); lastGroup = group; }
    const row = document.createElement('div');
    row.className = `row${card === state.card ? ' sel' : ''}${state.edited.has(card.id) ? ' edited' : ''}`;
    row.dataset.id = card.id;
    row.innerHTML = '<span class="nm"></span><span class="stars"></span>';
    row.firstChild.textContent = card.name; row.lastChild.textContent = card.rarity || '—';
    row.onclick = () => select(card);
    list.append(row);
  }
}

function renderControls() {
  const card = state.card;
  $('card-title').textContent = card.name;
  $('card-sub').textContent = `${card.id} · ${card.artPath || 'no art'}`;
  const box = $('rarity-btns'); box.innerHTML = '';
  for (const r of RARITIES) {
    const b = document.createElement('button'); b.textContent = r; b.classList.toggle('active', card.rarity === r);
    b.onclick = () => { card.rarity = r; renderPreview(); persist({ rarity: r }); };
    box.append(b);
  }
  const f = parseFocus(card.artFocus);
  $('fx').value = Math.round(f.x); $('fy').value = Math.round(f.y);
}

function renderPreview() {
  const stage = $('stage'); stage.innerHTML = '';
  const el = renderCard(state.card, {});
  stage.append(el);
  renderControls();
  enableArtDrag(el, state.card.artFocus, {
    onChange: (focus) => { const f = parseFocus(focus); $('fx').value = Math.round(f.x); $('fy').value = Math.round(f.y); },
    onDone: (focus) => { state.card.artFocus = focus; persist({ artFocus: focus }); },
  });
}

function select(card) { state.card = card; renderPreview(); renderList(); document.querySelector('.row.sel')?.scrollIntoView({ block: 'nearest' }); }

function applyTyped() {
  const focus = formatFocus({ x: Number($('fx').value), y: Number($('fy').value) });
  state.card.artFocus = focus; renderPreview(); persist({ artFocus: focus });
}
$('fx').onchange = applyTyped; $('fy').onchange = applyTyped;
$('reset-focus').onclick = () => { delete state.card.artFocus; renderPreview(); persist({ artFocus: '' }); };
$('search').oninput = (e) => { state.query = e.target.value; renderList(); };

const filter = $('type-filter');
for (const name of ['all', ...CARD_GROUPS.map((g) => g[0])]) {
  const b = document.createElement('button'); b.textContent = name; b.classList.toggle('active', name === 'all');
  b.onclick = () => { state.type = name; [...filter.children].forEach((x) => x.classList.toggle('active', x === b)); renderList(); };
  filter.append(b);
}

document.addEventListener('keydown', (e) => {
  if (!['ArrowDown', 'ArrowUp'].includes(e.key) || document.activeElement?.tagName === 'INPUT') return;
  const rows = [...document.querySelectorAll('#card-list .row')];
  const i = rows.findIndex((r) => r.classList.contains('sel'));
  const next = rows[i + (e.key === 'ArrowDown' ? 1 : -1)];
  if (next) { e.preventDefault(); select(allEntries.find((x) => x.card.id === next.dataset.id).card); }
});

renderList();
select(allEntries[0].card);
