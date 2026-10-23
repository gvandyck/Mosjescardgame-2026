// contrast.js — test-only WCAG contrast maths (not app code). Colours are [r, g, b] 0..255.
function channel(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// fg at the given alpha, drawn over an opaque bg.
export function compositeOver(fg, alpha, bg) {
  return fg.map((v, i) => alpha * v + (1 - alpha) * bg[i]);
}
