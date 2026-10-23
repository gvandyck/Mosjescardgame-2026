// samplePixels.js — test-only (Phase 62): read the colour of single pixels of a rendered element.
// samplePixels(page, locator, points): points are [x, y] in CSS px relative to the element's top-left corner.
// It takes an element screenshot (PNG), decodes it in the page on a canvas and returns [r, g, b] per point.
// This reads what the browser really painted (frosted backdrop, tints and all), not what the CSS says.
export async function samplePixels(page, locator, points) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('samplePixels: the element has no box (not visible)');
  const png = (await locator.screenshot({ animations: 'disabled' })).toString('base64');
  return page.evaluate(async ({ png, points, cssWidth }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const scale = img.width / cssWidth; // 1 at a device scale factor of 1
    return points.map(([x, y]) => {
      const d = ctx.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data;
      return [d[0], d[1], d[2]];
    });
  }, { png, points, cssWidth: box.width });
}
