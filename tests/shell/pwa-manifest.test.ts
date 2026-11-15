// @ts-nocheck
// Phase 65-10 (MOB-07, D-17): the Add to Home Screen guard. The manifest has RELATIVE start_url / scope (so the installed app can
// only live under /obbycardgame2/, T-65-13), standalone + portrait, PNG icons that exist on disk, and both pages link it with the iOS
// meta tags. NO service worker anywhere (T-65-14), noindex stays (T-65-15), and the deploy files are untouched: deploy-obby2.yml does
// not exclude the manifest or the icons, deploy.yml (V4) knows nothing about them (T-65-16).
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const root = (file: string): string => join(ROOT, file);
const read = (file: string): string => readFileSync(root(file), 'utf8');
const PAGES = ['index.html', 'game.html'];
const manifest = existsSync(root('manifest.webmanifest')) ? JSON.parse(read('manifest.webmanifest')) : null;
const isRelative = (path: string): boolean => typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.includes('://');
const tagOf = (html: string, pattern: RegExp): string => html.match(pattern)?.[0] ?? '';

// Every file below a folder, as paths relative to the repo root (forward slashes).
function walk(folder: string): string[] {
	return readdirSync(root(folder)).flatMap((name) => {
		const path = `${folder}/${name}`;
		return statSync(root(path)).isDirectory() ? walk(path) : [path];
	});
}

// The trimmed lines of the `exclude: |` block of a workflow.
function excludeOf(text: string): string[] {
	const lines = text.split(/\r?\n/).filter((l) => !l.trim().startsWith('#'));
	const at = lines.findIndex((l) => /^\s*exclude:\s*\|/.test(l));
	if (at < 0) return [];
	const indent = (l: string): number => l.length - l.trimStart().length;
	const entries: string[] = [];
	for (const line of lines.slice(at + 1)) {
		if (line.trim() === '') continue;
		if (indent(line) <= indent(lines[at])) break;
		entries.push(line.trim());
	}
	return entries;
}

// Minimal minimatch stand-in (same as deploy-workflows.test.ts): `**/` = any folders, `**` = anything, `*` = inside one segment.
function globToRegExp(glob: string): RegExp {
	const source = glob
		.replace(/[.+^${}()|[\]\\?]/g, '\\$&')
		.replace(/\*\*\//g, '\u0000')
		.replace(/\*\*/g, '\u0001')
		.replace(/\*/g, '[^/]*')
		.replace(/\u0000/g, '(?:.*/)?')
		.replace(/\u0001/g, '.*');
	return new RegExp(`^${source}$`);
}

describe('manifest.webmanifest (D-17)', () => {
	it('exists and parses', () => {
		expect(manifest, 'manifest.webmanifest at the repo root').not.toBeNull();
	});

	it('has a relative start_url and scope (never an absolute path or URL)', () => {
		expect(isRelative(manifest.start_url), `start_url ${manifest.start_url}`).toBe(true);
		expect(isRelative(manifest.scope), `scope ${manifest.scope}`).toBe(true);
	});

	it('is standalone and portrait, with a name', () => {
		expect(manifest.display).toBe('standalone');
		expect(manifest.orientation).toBe('portrait');
		expect(String(manifest.name).trim().length).toBeGreaterThan(0);
		expect(String(manifest.short_name).trim().length).toBeGreaterThan(0);
		expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
		expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it('lists the 192 and 512 PNGs, a maskable one and the obbyhouse jpg; every src is relative and exists on disk', () => {
		const icons = manifest.icons;
		const has = (sizes: string, type: string, purpose: string): boolean => icons.some((i) => i.sizes === sizes && i.type === type && (i.purpose ?? 'any') === purpose);
		expect(has('192x192', 'image/png', 'any'), '192 png').toBe(true);
		expect(has('512x512', 'image/png', 'any'), '512 png').toBe(true);
		expect(has('512x512', 'image/png', 'maskable'), '512 maskable png').toBe(true);
		expect(icons.some((i) => i.type === 'image/jpeg' && i.src.endsWith('obbyhouse.jpg')), 'obbyhouse jpg').toBe(true);
		for (const icon of icons) {
			expect(isRelative(icon.src), `icon src ${icon.src} is relative`).toBe(true);
			expect(existsSync(root(icon.src)), `${icon.src} exists`).toBe(true);
		}
	});
});

describe.each(PAGES)('%s install tags (D-17)', (page) => {
	const html = read(page);

	it('links the manifest and an apple-touch-icon PNG that exists', () => {
		expect(html).toMatch(/<link\s+rel="manifest"\s+href="manifest\.webmanifest"\s*\/?>/);
		const href = tagOf(html, /<link\s+rel="apple-touch-icon"[^>]*>/).match(/href="([^"]+)"/)?.[1] ?? '';
		expect(href, 'apple-touch-icon href').toMatch(/\.png$/);
		expect(existsSync(root(href)), `${href} exists`).toBe(true);
	});

	it('carries the iOS / Android web-app meta tags and a theme colour', () => {
		expect(html).toMatch(/<meta\s+name="apple-mobile-web-app-capable"\s+content="yes"\s*\/?>/);
		expect(html).toMatch(/<meta\s+name="mobile-web-app-capable"\s+content="yes"\s*\/?>/);
		expect(html).toMatch(/<meta\s+name="theme-color"\s+content="#[0-9a-f]{6}"\s*\/?>/i);
	});

	it('still hides the site from search engines', () => {
		expect(html).toContain('noindex,nofollow');
	});
});

describe('no service worker (D-17, T-65-14)', () => {
	it('is not mentioned in src/ or in any html file at the repo root', () => {
		const files = [...walk('src'), ...readdirSync(root('.')).filter((name) => name.endsWith('.html'))];
		expect(files.length).toBeGreaterThan(50);
		const offenders = files.filter((file) => /serviceWorker/.test(read(file)));
		expect(offenders).toEqual([]);
	});
});

describe('deploy path (T-65-16)', () => {
	it('deploy-obby2.yml excludes neither the manifest nor the icons', () => {
		const text = read('.github/workflows/deploy-obby2.yml');
		const exclude = excludeOf(text);
		expect(exclude.length).toBeGreaterThan(10);
		for (const entry of exclude) expect(entry, entry).not.toMatch(/webmanifest|\.png|icons/);
		const shipped = ['manifest.webmanifest', ...manifest.icons.map((i) => i.src), 'assets/icons/apple-touch-icon.png'];
		for (const file of shipped) {
			const hit = exclude.find((entry) => globToRegExp(entry).test(file));
			expect(hit, `${file} must not be excluded`).toBeUndefined();
		}
	});

	it('deploy.yml (V4) knows nothing about the manifest', () => {
		const text = read('.github/workflows/deploy.yml');
		expect(text).not.toContain('webmanifest');
		expect(text).not.toContain('apple-touch');
	});
});
