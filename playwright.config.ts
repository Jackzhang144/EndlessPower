import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT || 4173)

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    geolocation: { latitude: 30.757064, longitude: 103.933993 },
    permissions: ['geolocation']
  },
  webServer: {
    command: `VITE_MAP_STYLE=/e2e-map-style.json PLAYWRIGHT=1 npm run dev -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] }
    }
  ]
})
