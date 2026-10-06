// cache-bust.mjs — deploy-time cache busting. Appends ?v=<version> to every local script, stylesheet
// and ES-module import so browsers refetch changed files instead of using a copy cached for days.
// Usage: node scripts/cache-bust.mjs <dir> <version>   (the deploy workflow runs it before the FTP sync)
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const [dir = '.', version = String(Date.now())] = process.argv.slice(2);
const SKIP = new Set(['node_modules', '.git', '.github', '.planning', '_archive', 'tests', 'docs', 'design', 'design-lab', 'assets', 'scripts', 'test-results', 'playwright-report']);

// JS: static imports, bare imports and import('...') with a relative .js path.
const JS_IMPORT = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])((?:\.{1,2}\/)[^'"?\n]+\.js)\2/g;
// HTML: local <script src> and <link href> pointing at .js / .css.
const HTML_REF = /\b(src|href)="((?!https?:|\/\/|data:)[^"?#]+\.(?:js|css))"/g;
// CSS: @import of a local stylesheet.
const CSS_IMPORT = /(@import\s+(?:url\()?\s*)(['"])([^'"?]+\.css)\2/g;

function rewrite(file, text) {
  const ext = extname(file);
  if (ext === '.js') return text.replace(JS_IMPORT, (_m, pre, q, path) => `${pre}${q}${path}?v=${version}${q}`);
  if (ext === '.html') return text.replace(HTML_REF, (_m, attr, path) => `${attr}="${path}?v=${version}"`);
  if (ext === '.css') return text.replace(CSS_IMPORT, (_m, pre, q, path) => `${pre}${q}${path}?v=${version}${q}`);
  return text;
}

let changed = 0;
function walk(folder) {
  for (const name of readdirSync(folder)) {
    if (SKIP.has(name)) continue;
    const path = join(folder, name);
    if (statSync(path).isDirectory()) { walk(path); continue; }
    if (!['.js', '.html', '.css'].includes(extname(path))) continue;
    const before = readFileSync(path, 'utf8');
    const after = rewrite(path, before);
    if (after !== before) { writeFileSync(path, after); changed += 1; }
  }
}
walk(dir);
console.log(`cache-bust: version ${version}, ${changed} files updated`);
