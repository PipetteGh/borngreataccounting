import path from 'path';
import { PlaywrightTestConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '.env') });

const config: PlaywrightTestConfig = {
  timeout: 180 * 1000,
  workers: 1,
  testDir: path.join(__dirname, 'e2e'),
  testMatch: /record-features-demo\.spec\.ts/,
  globalSetup: path.join(__dirname, 'e2e/global-setup.ts'),
  retries: 0,
  outputDir: 'test-results/feature-demo/',
  use: {
    testIdAttribute: 'data-testid',
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4000',
    storageState: 'e2e/.auth/user.json',
    video: {
      mode: 'on',
      size: { width: 1440, height: 900 },
    },
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'Desktop Chrome Demo',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
};

export default config;
