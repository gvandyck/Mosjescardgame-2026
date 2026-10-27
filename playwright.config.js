import { defineConfig } from '@playwright/test';

// Projects:
//  - "visual" — headed + slowMo: smoke, mechanics, full-game, chain tests.
//  - "sim"    — headless + fast: the 2.0 deck-matrix simulation (sim-deck-matrix.spec.js):
//               9 ordered matchups of the 3 Example Decks x 10 games + a crash / timeout gate (64-06).
//  - "cards"  — the data-driven card-effect library. headless + slowMo so a
//               SINGLE browser steps through cards gently (no rapid open/close
//               that hangs a busy PC). Run --headed to watch.
//  - "mobile-canary" — REPORT ONLY (64-07, D-30): headless 390x844 touch phone, lobby -> deck -> Start -> board.
//               Its result is written to a report and never gates the phase; only `npm run test:mobile-canary`
//               runs it (own project, excluded from "visual"). Phase 65 owns the phone layout it will flag.
//
// IMPORTANT: card + sim tests share one http-server on port 5500 and are NOT
// parallel-safe — always run them with `--workers=1` (the npm scripts do this).
//
// Run examples:
//   npm run test:cards          → card library, headless, one-at-a-time
//   npm run test:cards:watch    → same, but headed so you can watch
//   npm run test:sim            → 2.0 bot-vs-bot simulation (GAMES_PER_MATCHUP=1 for a 9-game smoke)
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
      // Phase 50: rarity-tier card faces in WebKit (Safari engine).
      name: 'tiers-webkit',
      testMatch: ['**/card-tiers.spec.js'],
      use: { browserName: 'webkit', baseURL: 'http://localhost:5500', headless: true, screenshot: 'only-on-failure' },
    },
    {
      name: 'visual',
      testIgnore: ['**/sim-deck-matrix.spec.js', '**/cards/**', '**/mobile-canary.spec.js'],
      use: {
        baseURL: 'http://localhost:5500',
        headless: false,
        slowMo: 600,
        // Open maximized (fills the screen) instead of the 1280x720 default — looks
        // tiny on a 4K panel. viewport:null lets the page match the window size.
        // Opens on the right-hand monitor (x=2560) so it doesn't cover the screen
        // you're playing on; override with PW_WINDOW_POS="x,y".
        viewport: null,
        launchOptions: { args: [`--window-position=${process.env.PW_WINDOW_POS || '2560,0'}`, '--start-maximized'] },
        screenshot: 'on',
        video: 'retain-on-failure',
      },
    },
    {
      name: 'sim',
      testMatch: ['**/sim-deck-matrix.spec.js'],
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
      // D-30: report-only phone canary (390x844, touch). Chromium with isMobile + hasTouch; never part of the gate.
      name: 'mobile-canary',
      testMatch: ['**/mobile-canary.spec.js'],
      timeout: 90000,
      use: {
        baseURL: 'http://localhost:5500',
        browserName: 'chromium',
        headless: true,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
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
        // The Arena hand strip sits low and covers the field at 1280x720; the Arena
        // specs use 1600x900, so the card library does too.
        viewport: { width: 1600, height: 900 },
        // Auto-slow when watching (--headed); fast (0) for headless CI. Override via SLOWMO.
        slowMo: Number(process.env.SLOWMO) || (process.argv.includes('--headed') ? 400 : 0),
        screenshot: 'only-on-failure',
        video: 'off',
      },
    },
  ],
});
