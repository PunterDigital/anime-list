import { expect, test, type Page } from '@playwright/test';

// Seeded by database/seeders/E2ESeeder.php: the `error-pages` flag is on for everyone,
// and hidden-e2e-show is hidden (451) with Cowboy Bebop and Mob Psycho 100 as its
// recommendations.

// The browser logs the error status of the page itself; anything else is a real error.
function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error' && !/status of (404|451)/.test(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('a 404 page keeps the site layout and offers a way out', async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);

    await expect(page.getByRole('heading', { level: 1, name: "We couldn't find that page" })).toBeVisible();
    // The navbar and footer are there.
    await expect(page.getByRole('link', { name: 'Seasonal' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go back' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Popular pages' }).getByRole('link', { name: 'Top rated' }).click();
    await expect(page).toHaveURL(/\/top$/);
    expect(errors).toEqual([]);
});

test('a missing anime URL fills in a search from the link', async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto('/anime/cowboy-bebop-the-movie');
    expect(response?.status()).toBe(404);

    const search = page.getByRole('searchbox', { name: 'Search anime' });
    await expect(search).toHaveValue('cowboy bebop the movie');
    await search.fill('cowboy');
    await page.getByRole('search').getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/anime\?filter%5Bsearch%5D=cowboy/);
    await expect(page.getByRole('link', { name: 'Cowboy Bebop' }).first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('a hidden anime suggests other anime and never shows its own', async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto('/anime/hidden-e2e-show');
    expect(response?.status()).toBe(451);

    await expect(page.getByRole('heading', { level: 1, name: 'This anime page is no longer available' })).toBeVisible();
    const alternatives = page.locator('[data-test="error-alternatives"]');
    await expect(alternatives.getByRole('link')).toHaveCount(2);
    await expect(alternatives.getByRole('link').first()).toContainText('Cowboy Bebop');
    await expect(page.getByText('Hidden E2E Show')).toHaveCount(0);
    await expect(page.getByText('Hidden synopsis')).toHaveCount(0);

    await alternatives.getByRole('link').first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Cowboy Bebop' })).toBeVisible();
    expect(errors).toEqual([]);
});

test('a signed-in user stays signed in on a 404 page', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/login');
    await page.locator('#email').fill('e2e@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page.getByRole('link', { name: 'My List' })).toBeVisible();

    const response = await page.goto('/definitely/not/here');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('link', { name: 'My List' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toHaveCount(0);
    expect(errors).toEqual([]);
});
