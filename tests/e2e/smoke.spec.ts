import { expect, test, type Page } from '@playwright/test';

// Seeded by database/seeders/E2ESeeder.php.
const ANIME = 'Cowboy Bebop';

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('home page loads without console errors', async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.getByPlaceholder('Search anime...').first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('browse and open an anime detail page', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/anime');
    await page.getByRole('link', { name: ANIME }).first().click();
    await expect(page.getByRole('heading', { name: ANIME }).first()).toBeVisible();
    await expect(page.getByText('to track this anime')).toBeVisible();
    expect(errors).toEqual([]);
});

test('search finds a title ignoring case and punctuation', async ({ page }) => {
    await page.goto('/search?q=cowboy-BEBOP');
    await expect(page).toHaveURL(/\/anime\?/);
    await expect(page.getByRole('link', { name: ANIME }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mob Psycho 100' })).toHaveCount(0);
});

test('register, add an anime to the list and see it on My List', async ({ page }) => {
    const errors = collectErrors(page);
    const id = Date.now();

    await page.goto('/register');
    await page.locator('#name').fill('New Viewer');
    await page.locator('#username').fill(`viewer${id}`);
    await page.locator('#email').fill(`viewer${id}@example.com`);
    await page.locator('#password').fill('a-long-test-password-1');
    await page.locator('#password_confirmation').fill('a-long-test-password-1');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).not.toHaveURL(/\/register/);

    await page.goto('/anime');
    await page.getByRole('link', { name: ANIME }).first().click();
    await page.getByRole('button', { name: 'Add to List' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Added to List').first()).toBeVisible();

    await page.goto('/list');
    await expect(page.getByText(ANIME).first()).toBeVisible();
    expect(errors).toEqual([]);
});
