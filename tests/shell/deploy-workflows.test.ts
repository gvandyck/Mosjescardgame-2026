// Phase 64-02: workflow guard (D-34, D-29). Reads .github/workflows/*.yml as plain text (no YAML dependency)
// and fails when a trigger branch, a server-dir, the no-Firebase-secret rule or the exclude list drifts.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLACEHOLDER_FIREBASE_CONFIG_JS } from '../helpers/placeholderFirebaseConfig.js';

const WORKFLOW_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../.github/workflows');
const V4_FILE = 'deploy.yml';
const OBBY2_FILE = 'deploy-obby2.yml';
const FTP_SECRETS = ['FTP_HOST', 'FTP_PASS', 'FTP_USER'];

const read = (file: string): string => readFileSync(join(WORKFLOW_DIR, file), 'utf8');
const codeLines = (text: string): string[] => text.split(/\r?\n/).filter((l) => !l.trim().startsWith('#'));
const indentOf = (line: string): number => line.length - line.trimStart().length;

// The list items under the push `branches:` key (block list or inline [a, b]).
function branchesOf(text: string): string[] {
	const lines = codeLines(text);
	const at = lines.findIndex((l) => /^\s*branches:/.test(l));
	if (at < 0) return [];
	const inline = lines[at].match(/branches:\s*\[(.*)\]/);
	if (inline) return inline[1].split(',').map((s) => s.trim()).filter(Boolean);
	const items: string[] = [];
	for (const line of lines.slice(at + 1)) {
		const item = line.match(/^\s*-\s+(\S+)\s*$/);
		if (!item || indentOf(line) <= indentOf(lines[at])) break;
		items.push(item[1]);
	}
	return items;
}

// The value after `server-dir:`.
function serverDirOf(text: string): string {
	const line = codeLines(text).find((l) => /^\s*server-dir:/.test(l));
	return line ? line.replace(/^\s*server-dir:\s*/, '').trim() : '';
}

// The trimmed lines of the `exclude: |` block.
function excludeOf(text: string): string[] {
	const lines = codeLines(text);
	const at = lines.findIndex((l) => /^\s*exclude:\s*\|/.test(l));
	if (at < 0) return [];
	const entries: string[] = [];
	for (const line of lines.slice(at + 1)) {
		if (line.trim() === '') continue;
		if (indentOf(line) <= indentOf(lines[at])) break;
		entries.push(line.trim());
	}
	return entries;
}

// Every secrets.NAME used on a non-comment line, sorted and de-duplicated.
function secretsOf(text: string): string[] {
	const names = codeLines(text).flatMap((l) => [...l.matchAll(/secrets\.([A-Za-z0-9_]+)/g)].map((m) => m[1]));
	return [...new Set(names)].sort();
}

// Minimal minimatch stand-in: `**/` = any folders (or none), `**` = anything, `*` = anything inside one path segment.
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

const workflowFiles = readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith('.yml'));

describe('deploy-obby2.yml (D-32)', () => {
	const text = read(OBBY2_FILE);

	it('triggers only on a push to obby-2.0', () => {
		expect(branchesOf(text)).toEqual(['obby-2.0']);
		expect(codeLines(text).some((l) => /^\s*(pull_request|pull_request_target|workflow_dispatch|schedule|workflow_run|release)\s*:/.test(l))).toBe(false);
	});

	it('deploys to /domains/eightytwenty.nl/public_html/obbycardgame2/', () => {
		expect(serverDirOf(text)).toBe('/domains/eightytwenty.nl/public_html/obbycardgame2/');
	});

	it('uses the same FTP-Deploy-Action version as deploy.yml', () => {
		const action = read(V4_FILE).match(/uses:\s*(SamKirkland\/FTP-Deploy-Action@\S+)/);
		expect(action).not.toBeNull();
		expect(text).toContain(`uses: ${action![1]}`);
	});
});

describe('deploy.yml (D-32, V4 stays untouched)', () => {
	const text = read(V4_FILE);

	it('triggers only on a push to main', () => {
		expect(branchesOf(text)).toEqual(['main']);
	});

	it('deploys to /domains/eightytwenty.nl/public_html/cardgame2026/', () => {
		expect(serverDirOf(text)).toBe('/domains/eightytwenty.nl/public_html/cardgame2026/');
	});
});

describe('deploy-obby2.yml ships no Firebase secret (D-33, D-34)', () => {
	const text = read(OBBY2_FILE);

	it('writes the placeholder firebase-config.js text', () => {
		expect(PLACEHOLDER_FIREBASE_CONFIG_JS).toContain('YOUR_PROJECT_ID');
		expect(text).toContain(PLACEHOLDER_FIREBASE_CONFIG_JS);
	});

	it('never mentions a FIREBASE_CONFIG token, comments included', () => {
		expect(text).not.toContain('FIREBASE_CONFIG');
	});

	it('uses only the three FTP secrets', () => {
		expect(secretsOf(text)).toEqual(FTP_SECRETS);
	});

	it('limits the GITHUB_TOKEN to contents: read', () => {
		expect(text).toMatch(/^permissions:\s*\n\s+contents:\s*read\s*$/m);
	});
});

describe('deploy-obby2.yml exclude list (D-35)', () => {
	const exclude = excludeOf(read(OBBY2_FILE));

	it('keeps every entry of the V4 exclude list', () => {
		const v4 = excludeOf(read(V4_FILE));
		expect(v4.length).toBeGreaterThan(0);
		for (const entry of v4) expect(exclude, entry).toContain(entry);
	});

	it('hides the account, store, deck-builder, leaderboard and dev/demo pages', () => {
		const pages = [
			'**/account.html', '**/store.html', '**/deck-builder.html', '**/leaderboard.html', '**/demo.html',
			'**/card-*.html', '**/preview-*.html', '**/test-game.html', '**/try-arena.html',
		];
		for (const entry of pages) expect(exclude, entry).toContain(entry);
	});

	it('hides the planning, tooling, test and design folders and the Playwright configs', () => {
		const folders = [
			'**/.planning/**', '**/.claude/**', '**/tests/**', '**/design/**', '**/design-lab/**',
			'**/test-results/**', '**/playwright-report/**', '**/playwright.config.js', '**/pw-*.config.js',
		];
		for (const entry of folders) expect(exclude, entry).toContain(entry);
	});

	it('hides the other repo-only files', () => {
		const repoOnly = [
			'**/vitest.config.*', '**/_archive/**', '**/.git*', '**/database.rules.json', '**/firebase.json', '**/.firebaserc',
			'**/.firebaseignore', '**/eslint.config.js', '**/.eslintrc.json', '**/.prettierrc.json', '**/firebase-config.EXAMPLE.js',
		];
		for (const entry of repoOnly) expect(exclude, entry).toContain(entry);
	});

	it('never excludes a file the 2.0 site needs to load', () => {
		const shipped = [
			'index.html', 'game.html', 'firebase-config.js', 'src/main.js', 'src/version.js', 'src/firebase.js',
			'src/ui/boardRenderer.js', 'styles/main.css', 'styles/board-2-0.css', 'assets/icons/obbyhouse.jpg',
		];
		for (const entry of exclude) {
			const pattern = globToRegExp(entry);
			for (const path of shipped) expect(pattern.test(path), `${entry} would hide ${path}`).toBe(false);
		}
	});
});

describe('workflow server-dirs do not cross over (D-34)', () => {
	it('finds both workflows', () => {
		expect(workflowFiles).toContain(V4_FILE);
		expect(workflowFiles).toContain(OBBY2_FILE);
	});

	it('only deploy-obby2.yml names obbycardgame2 and only deploy.yml names cardgame2026', () => {
		const withObby = workflowFiles.filter((f) => read(f).includes('obbycardgame2'));
		const withV4 = workflowFiles.filter((f) => read(f).includes('cardgame2026'));
		expect(withObby).toEqual([OBBY2_FILE]);
		expect(withV4).toEqual([V4_FILE]);
	});
});
