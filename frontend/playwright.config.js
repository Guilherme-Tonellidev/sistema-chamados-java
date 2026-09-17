import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/resultados',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  reporter: 'list',

  use: {
    baseURL: 'http://127.0.0.1:5174',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run dev -- --mode e2e --host 127.0.0.1',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
    timeout: 60000,
  },
})