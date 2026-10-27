import { expect, test } from '@playwright/test';

// Runs against the second E2E server, which has the production Google tag IDs
// (see playwright.config.ts). The tag's own scripts are fetched for real so it
// behaves as it does in production; every other request to a non-local host
// (page_view hits, conversion pings, remarketing pixels) is answered here with
// an empty 204 and never leaves the test.
const TAG_SCRIPTS = /^https:\/\/www\.googletagmanager\.com\/gtag\/(js|destination)\b/;

test('the Google tag sends its hits without CSP violations', async ({ page, baseURL }) => {
    const local = new URL(baseURL!).host;
    const hits: string[] = [];
    await page.route('**/*', (route) => {
        const url = route.request().url();
        if (new URL(url).host === local || TAG_SCRIPTS.test(url)) return route.continue();
        hits.push(url);
        return route.fulfill({ status: 204, body: '' });
    });

    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await expect(page.getByPlaceholder('Search anime...').first()).toBeVisible();

    // A blocked hit never reaches the router, so wait until both destinations
    // have sent something before checking the console.
    await expect
        .poll(() => hits.filter((u) => u.includes('/g/collect')).length, { timeout: 15_000 })
        .toBeGreaterThan(0);
    await expect
        .poll(() => hits.filter((u) => u.includes('/ccm/')).length, { timeout: 15_000 })
        .toBeGreaterThan(0);
    await page.waitForTimeout(1_000);

    expect(errors).toEqual([]);
});
