// cardTiersDemo.js — debug grid for card-tiers-demo.html: 6 card types x 4
// rarity tiers, rendered through the real renderCard. Forces ?tiers=all.
import { MOSJES } from '../data/mosjes.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';
import { SNELLE_PIECIES } from '../data/snellePiecies.js';
import { renderCard } from './cardRenderer.js';
import { parseMosjeName } from './cardV1/parseMosjeName.js';

const params = new URLSearchParams(window.location.search);
if (params.get('tiers') !== 'all') {
  params.set('tiers', 'all');
  window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
}

const hasArt = (c) => typeof c.artPath === 'string' && c.artPath && !c.artPath.endsWith('/placeholder.png');
const pick = (list, test = () => true) => list.find((c) => test(c) && hasArt(c)) || list.find(test);
const mosje = (subtype) => pick(MOSJES, (c) => String(c.subtype).toUpperCase() === subtype);

const ROWS = [
  ['Fighting Mosje', mosje('FIGHTING')],
  ['Digital Mosje', mosje('DIGITAL')],
  ['Artistic Mosje', mosje('ARTISTIC')],
  ['Piecie', pick(PIECIES)],
  ['Place', pick(PLACES)],
  ['Snelle', pick(SNELLE_PIECIES)],
];

const grid = document.getElementById('tier-grid');

function cell(className, text) {
  const div = document.createElement('div');
  div.className = className;
  div.textContent = text;
  return div;
}

grid.append(cell('head', ''));
for (let tier = 1; tier <= 4; tier += 1) grid.append(cell('head', `Tier ${tier} (${'★'.repeat(tier)})`));

for (const [label, card] of ROWS) {
  grid.append(cell('row-label', card ? `${label}\n${card.name}` : `${label} (missing)`));
  for (let tier = 1; tier <= 4; tier += 1) {
    if (!card) { grid.append(cell('', '-')); continue; }
    grid.append(renderCard({ ...card, rarity: '★'.repeat(tier) }));
  }
}

// Edge cases, each shown at tiers 1-4 (tier 3 added in 50-04).
const EDGE_TIERS = [1, 2, 3, 4];
const descLen = (c) => String(c.abilityDescription || c.description || '').length + String(c.synergyEffect || '').length;
const shownName = (c) => (String(c.type).toUpperCase() === 'MOSJE' ? parseMosjeName(c.name).firstName : String(c.name));
const ALL = [...MOSJES, ...PIECIES, ...PLACES, ...SNELLE_PIECIES];
const EDGE = [
  ['Mosje, 4 traits', MOSJES.find((c) => Object.keys(c.traits || {}).length >= 4) || MOSJES.reduce((a, b) => (Object.keys(b.traits || {}).length > Object.keys(a.traits || {}).length ? b : a))],
  ['Place', pick(PLACES)],
  ['Piecie without art', { ...pick(PIECIES), artPath: null }],
  // Mosje names are "[First] Nickname": test the parsed parts, not the raw string.
  ['Mosje without nickname', MOSJES.find((c) => !parseMosjeName(c.name).nickname)],
  ['Very long name', ALL.reduce((a, b) => (shownName(b).length > shownName(a).length ? b : a))],
  ['Longest ability text', ALL.reduce((a, b) => (descLen(b) > descLen(a) ? b : a))],
];
const edge = document.getElementById('edge-grid');
for (const [label, card] of EDGE) {
  if (!card) continue;
  for (const tier of EDGE_TIERS) {
    const wrap = cell('edge-cell', '');
    wrap.append(cell('row-label', `${label} - tier ${tier}
${card.name}`), renderCard({ ...card, rarity: '★'.repeat(tier) }));
    edge.append(wrap);
  }
}
const field = document.getElementById('field-grid');
for (let tier = 1; tier <= 4; tier += 1) {
  const wrap = cell('edge-cell', '');
  wrap.append(cell('row-label', `Field tile, tier ${tier}`), renderCard({ ...mosje('FIGHTING'), rarity: '★'.repeat(tier) }, { fieldMode: true }));
  field.append(wrap);
}

document.getElementById('anim-toggle').addEventListener('change', (e) => {
  document.querySelectorAll('.card.card-v1--full').forEach((c) => c.classList.toggle('card--tier-anim', e.target.checked));
});

document.querySelectorAll('.controls button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.body.style.setProperty('--demo-w', `${btn.dataset.w}px`);
    document.querySelectorAll('.controls button').forEach((b) => b.classList.toggle('active', b === btn));
  });
});
