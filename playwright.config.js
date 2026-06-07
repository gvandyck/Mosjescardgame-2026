import { defineConfig } from '@playwright/test';

// Two projects:
//  - "visual"  — headed + slowMo so you can WATCH the debug tests (smoke, mechanics,
//                full-game, chain). This is the default and matches everything EXCEPT
//                the high-volume simulation directory.
//  - "sim"     — headless + no slowMo for the 30-game statistical simulation. Fast.
//
// Run examples:
//   npx playwright test                              → both projects
//   npx playwright test --project=visual             → only watchable tests
//   npx playwright test --project=sim                → only the fast simulation
export default defineConfig({
  testDir: './tests/ui',
  timeout: 60000,
  webServer: {
    command: 'npx http-server . -p 5500 --cors -c-1',
    port: 5500,
    reuseExistingServer: true,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  projects: [
    {
      // Everything watchable: smoke, mechanics, full-game, and the chain tests.
      // These were developed + validated with slowMo so keep them headed.
      name: 'visual',
      testIgnore: '**/sim-30-games.spec.js',
      use: {
        baseURL: 'http://localhost:5500',
        headless: false,
        slowMo: 600,
        screenshot: 'on',
        video: 'retain-on-failure',
      },
    },
    {
      // Only the 30-game bulk statistical simulation — headless + fast.
      name: 'sim',
      testMatch: '**/sim-30-games.spec.js',
      timeout: 180000,
      use: {
        baseURL: 'http://localhost:5500',
        headless: true,   // no window — runs fast for batch data gathering
        slowMo: 0,
        screenshot: 'only-on-failure',
        video: 'off',
      },
    },
  ],
});
