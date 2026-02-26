import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Support both e2e/ (existing tests) and tests/journeys/ (PROJ-9 user journey tests)
  testDir: './tests/journeys',
  fullyParallel: false, // Sequential for dependent tests (serial mode)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  // Global setup for test user seeding
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    // User Journey Tests - Desktop Chrome (primary)
    {
      name: 'journeys-chromium',
      testDir: './tests/journeys',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
    // Existing E2E Tests
    {
      name: 'e2e-chromium',
      testDir: './e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    // Cross-browser testing
    {
      name: 'e2e-firefox',
      testDir: './e2e',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'e2e-webkit',
      testDir: './e2e',
      use: { ...devices['Desktop Safari'] },
    },
    // Responsive testing (mobile & tablet)
    {
      name: 'e2e-mobile-chrome',
      testDir: './e2e',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'e2e-mobile-safari',
      testDir: './e2e',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'e2e-tablet',
      testDir: './e2e',
      use: { ...devices['iPad Pro'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});