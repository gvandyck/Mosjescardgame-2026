import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  timeout: 60000,
  webServer: {
    command: 'npx http-server . -p 5500 --cors -c-1',
    port: 5500,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5500',
    headless: false,
    slowMo: 600,
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  reporter: [['html', { open: 'never' }], ['list']],
});
