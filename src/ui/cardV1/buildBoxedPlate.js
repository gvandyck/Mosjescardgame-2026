// buildBoxedPlate.js — the see-through description plate of the boxed layout.
// Tiers 1-2 get an extra clipped copy of the wave pattern behind the plate so
// the texture stays visible through it (RARITY-TIERS-DESIGN.md sec. 4.10).
export function buildBoxedPlate(tier, descHtml) {
  const waves = tier <= 2 ? '<i class="ct-plate-waves"></i>' : '';
  return `${waves}<div class="ct-plate">${descHtml}</div>`;
}
