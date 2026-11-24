import { expect, test, type Page } from '@playwright/test';

// Card 5715: the AdSense loader is printed only while the `ads` flag is on for
// the viewer and a slot is set. The E2E server has a client and a slot
// (playwright.config.ts) and the flag stays off, so no page may ask for it.
const LOADER = /^https:\/\/([a-z0-9-]+\.)*(googlesyndication\.com|googleadservices\.com|doubleclick\.net|adtrafficquality\.google)\//;

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('no AdSense request while the ads flag is off', async ({ page }) => {
    const errors = collectErrors(page);
    const adRequests: string[] = [];

    // Answer AdSense's hosts here, so a regression is counted and never reaches Google.
    await page.route(LOADER, (route) => {
        adRequests.push(route.request().url());
        return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    });

    await page.goto('/');
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute('content', 'ca-pub-0000000000000000');

    // An Inertia visit to another page, then a full load of it.
    await page.getByRole('link', { name: 'Browse', exact: true }).first().click();
    await expect(page).toHaveURL(/\/anime/);
    await page.reload();
    await page.waitForLoadState('load');

    await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
    expect(adRequests).toEqual([]);
    expect(errors).toEqual([]);
});
