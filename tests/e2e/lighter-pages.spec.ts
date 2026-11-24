import { expect, test, type Page } from '@playwright/test';

// Card 5710: Inertia visits leave out the Ziggy route list, and the browse
// filter options come once and stay in the client.

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('a browse filter visit keeps the studio and genre options without resending them', async ({ page }) => {
    const errors = collectErrors(page);
    const visits: Record<string, unknown>[] = [];
    page.on('response', async (response) => {
        if (response.request().headers()['x-inertia'] && response.url().includes('/anime')) {
            visits.push(await response.json());
        }
    });

    const html = await (await page.goto('/anime'))!.text();
    // Guests' route list (@routes) has no admin or Horizon names.
    expect(html).toContain('"anime.show"');
    expect(html).not.toMatch(/"(admin|horizon)\.[a-z.-]+"/);

    await page.getByRole('combobox', { name: 'Format' }).click();
    await page.getByRole('option', { name: 'TV', exact: true }).click();
    await expect.poll(() => decodeURIComponent(page.url())).toContain('filter[format]=TV');
    await expect.poll(() => visits.length).toBeGreaterThan(0);

    const props = visits[visits.length - 1].props as Record<string, unknown>;
    expect(Object.keys(props)).not.toContain('ziggy');
    expect(Object.keys(props)).not.toContain('studios');
    expect(Object.keys(props)).not.toContain('genres');

    // The options are still there after the visit.
    await page.getByRole('combobox', { name: 'Studio' }).click();
    await expect(page.getByRole('option', { name: 'Kumo Studio' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('combobox', { name: 'Genre' }).click();
    await expect(page.getByRole('option', { name: 'Kumo Genre' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Links built with route() still work on the client.
    await page.getByRole('link', { name: 'Kumo E2E Show' }).first().click();
    await expect(page).toHaveURL(/\/anime\/kumo-e2e-show$/);
    expect(errors).toEqual([]);
});

test('pages preconnect to the AniList image CDN', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="preconnect"][href="https://s4.anilist.co"]')).toHaveCount(1);
});
