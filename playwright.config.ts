import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port = Number(process.env.E2E_PORT ?? 8765);
const baseURL = `http://127.0.0.1:${port}`;

// A second server with the Google tag switched on, for google-tag.spec.ts only.
// The spec intercepts every request to Google, so CI never records a visit.
const gtagPort = port + 1;
const gtagURL = `http://127.0.0.1:${gtagPort}`;

// Env beats `.env` in Laravel: point the app at a throwaway SQLite file and
// switch off everything that would reach a real service (Redis, Sentry, AdSense).
const appEnv = {
    E2E_PORT: String(port),
    APP_ENV: 'e2e',
    APP_DEBUG: 'true',
    APP_URL: baseURL,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: process.env.E2E_DB ?? join(tmpdir(), 'anitrack-e2e', 'e2e.sqlite'),
    CACHE_STORE: 'file',
    QUEUE_CONNECTION: 'sync',
    SESSION_DRIVER: 'file',
    SESSION_DOMAIN: 'null',
    SCOUT_DRIVER: 'collection',
    MAIL_MAILER: 'array',
    INERTIA_SSR_ENABLED: 'false',
    SENTRY_LARAVEL_DSN: '',
    ADSENSE_CLIENT: '',
    ADSENSE_SLOT: '',
    GOOGLE_ANALYTICS_ID: '',
    GOOGLE_ADS_ID: '',
    LOG_CHANNEL: 'single',
};

const gtagEnv = {
    ...appEnv,
    E2E_PORT: String(gtagPort),
    APP_URL: gtagURL,
    DB_DATABASE: join(tmpdir(), 'anitrack-e2e', 'e2e-gtag.sqlite'),
    // The production IDs, so the real tag runs with its real destinations.
    GOOGLE_ANALYTICS_ID: 'G-4K6RNYTM27',
    GOOGLE_ADS_ID: 'AW-18128258525',
};

export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /google-tag\.spec\.ts/ },
        {
            name: 'google-tag',
            use: { ...devices['Desktop Chrome'], baseURL: gtagURL },
            testMatch: /google-tag\.spec\.ts/,
        },
    ],
    webServer: [
        {
            command: 'node tests/e2e/serve.mjs',
            url: `${baseURL}/up`,
            timeout: 120_000,
            reuseExistingServer: false,
            env: appEnv,
        },
        {
            command: 'node tests/e2e/serve.mjs',
            url: `${gtagURL}/up`,
            timeout: 120_000,
            reuseExistingServer: false,
            env: gtagEnv,
        },
    ],
});
