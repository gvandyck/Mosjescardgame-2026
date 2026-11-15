// make-app-icons.mjs - one-off tool (Phase 65-10, D-17): turns assets/icons/obbyhouse.jpg into the PNG app icons the Add to Home Screen
// manifest and the iOS meta tags need. No PNG library is installed, so Playwright's headless Chromium draws the jpg through a canvas.
// Usage: node scripts/make-app-icons.mjs        (re-run it only when the jpg changes; the four PNGs are committed)
// Writes assets/icons/: apple-touch-icon.png (180), icon-192.png, icon-512.png and icon-512-maskable.png (512).
// The jpg is a full-bleed red tile with the logo in the middle, so the normal icons fill the whole square (iOS and Android round
// the corners themselves) and the maskable one shows the same image at 80 % on the jpg's own red, so a circular mask keeps the logo.
// scripts/** is not deployed (deploy-obby2.yml exclude list).
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const icons = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons');
const OUTPUTS = [
	{ file: 'apple-touch-icon.png', size: 180, scale: 1 },
	{ file: 'icon-192.png', size: 192, scale: 1 },
	{ file: 'icon-512.png', size: 512, scale: 1 },
	{ file: 'icon-512-maskable.png', size: 512, scale: 0.8 },
];

// Runs in the page: draw the image centred at `scale` of the square on an opaque square of its own red (read a little in from the
// corner, where the jpeg edge is off-tone, so there is no seam round the 80 % copy).
async function drawIcon({ src, size, scale }) {
	const image = new Image();
	image.src = src;
	await image.decode();
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingQuality = 'high';
	const probe = document.createElement('canvas').getContext('2d');
	probe.drawImage(image, 0, 0);
	const [r, g, b] = probe.getImageData(30, 30, 1, 1).data;
	ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
	ctx.fillRect(0, 0, size, size);
	const drawn = size * scale;
	// The outer 6 px of the jpg are off-tone (jpeg edge): crop them so no hairline shows round the 80 % copy.
	const crop = 6;
	ctx.drawImage(image, crop, crop, image.width - 2 * crop, image.height - 2 * crop, (size - drawn) / 2, (size - drawn) / 2, drawn, drawn);
	return canvas.toDataURL('image/png');
}

const src = `data:image/jpeg;base64,${readFileSync(join(icons, 'obbyhouse.jpg')).toString('base64')}`;
const browser = await chromium.launch({ headless: true });
try {
	const page = await browser.newPage();
	for (const { file, size, scale } of OUTPUTS) {
		const dataUrl = await page.evaluate(drawIcon, { src, size, scale });
		writeFileSync(join(icons, file), Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
		console.log(`wrote assets/icons/${file} (${size}x${size}, image at ${Math.round(scale * 100)} %)`);
	}
} finally {
	await browser.close();
}
