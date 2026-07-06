import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://localhost:8443';
const clientDir = path.resolve(import.meta.dirname, '../../apps/node/client');

export default defineConfig({
    testDir: './scenarios',
    timeout: 90_000,
    expect: {
        timeout: 15_000,
    },
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    use: {
        ...devices['Desktop Chrome'],
        baseURL,
        ignoreHTTPSErrors: true,
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'moon run client:dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        cwd: clientDir,
    },
});
