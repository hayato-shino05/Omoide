import { defineConfig, devices } from '@playwright/test'

// ブラウザスモークテスト。本番データは使わず Supabase REST をモックする。
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  retries: 0,
  outputDir: 'tmp/browser-smoke/test-results',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
