import { defineConfig } from '@playwright/test';

// Three projects:
//  - "visual" — headed + slowMo: smoke, mechanics, full-game, chain tests.
//  - "sim"    — headless + fast: the bulk bot-vs-bot statistical simulation.
//  - "cards"  — the data-driven card-effect library. headless + slowMo so a
//               SINGLE browser steps through cards gently (no rapid open/close
//               that hangs a busy PC). Run --headed to watch.
//
// IMPORTANT: card + sim tests share one http-server on port 5500 and are NOT
// parallel-safe — always run them with `--workers=1` (the npm scripts do this).
//
// Run examples:
//   npm run test:cards          → card library, headless, one-at-a-time
//   npm run test:cards:watch    → same, but headed so you can watch
//   npm run test:sim            → bot-vs-bot simulation
export default defineConfig({
  testDir: './tests/ui',
  timeout: 60000,
  workers: 1,            // serial by default — tests share port 5500, not parallel-safe
  webServer: {
    command: 'npx http-server . -p 5500 --cors -c-1',
    port: 5500,
    reuseExistingServer: true,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  projects: [
    {
      name: 'visual',
      testIgnore: ['**/sim-30-games.spec.js', '**/sim-botvsbot.spec.js', '**/cards/**'],
      use: {
        baseURL: 'http://localhost:5500',
        headless: false,
        slowMo: 600,
        screenshot: 'on',
        video: 'retain-on-failure',
      },
    },
    {
      name: 'sim',
      testMatch: ['**/sim-30-games.spec.js', '**/sim-botvsbot.spec.js'],
      timeout: 180000,
      use: {
        baseURL: 'http://localhost:5500',
        headless: true,
        slowMo: 0,
        screenshot: 'only-on-failure',
        video: 'off',
      },
    },
    {
      // Data-driven card library. Runs with one browser (workers=1 via the npm
      // script) so contexts cycle on a single reused browser — no rapid open/close
      // that hangs a busy PC. slowMo from the SLOWMO env var (0 = fast CI default;
      // set SLOWMO=400 + --headed to watch in slow motion).
      name: 'cards',
      testMatch: ['**/cards/**/*.spec.js'],
      timeout: 90000,
      use: {
        baseURL: 'http://localhost:5500',
        headless: true,
        slowMo: Number(process.env.SLOWMO) || 0,
        screenshot: 'only-on-failure',
        video: 'off',
      },
    },
  ],
});
