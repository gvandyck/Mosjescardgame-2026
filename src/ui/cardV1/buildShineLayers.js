// buildShineLayers.js — holographic shine for full-art (tier 4) cards: holo
// colour wash, light sweep and 3 glints. Must stay DIRECT children of
// .cv1-window so mix-blend-mode blends with the art (never wrap them).
export function buildShineLayers() {
  return '<div class="ct-holo"></div><div class="ct-sweep"></div>'
    + '<div class="ct-glint ct-glint--1"></div><div class="ct-glint ct-glint--2"></div><div class="ct-glint ct-glint--3"></div>';
}
