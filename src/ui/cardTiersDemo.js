// cardTiersDemo.js — debug grid for card-tiers-demo.html: 6 card types x 4
// rarity tiers, rendered through the real renderCard. Forces ?tiers=all.
import { MOSJES } from '../data/mosjes.js';
import { PIECIES } from '../data/piecies.js';
import { PLACES } from '../data/places.js';
import { SNELLE_PIECIES } from '../data/snellePiecies.js';
import { renderCard } from './cardRenderer.js';

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

document.querySelectorAll('.controls button').forEach((btn) => {
  btn.addEventListener('click', () => {
    grid.style.setProperty('--demo-w', `${btn.dataset.w}px`);
    document.querySelectorAll('.controls button').forEach((b) => b.classList.toggle('active', b === btn));
  });
});
