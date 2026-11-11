import { expect, test, type Page } from '@playwright/test';

// Card 4505 (Sentry ANITRACK-1J): the admin edit page of an anime without a
// slug crashed on route('anime.show'). Seeded by E2ESeeder: "Slugless E2E Show"
// (no slug) and Cowboy Bebop (with one).

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('an admin edits an anime without a slug, and one with a slug keeps its public link', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/login');
    await page.locator('#email').fill('e2e-admin@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/admin/anime?search=Slugless');
    await page.getByRole('row', { name: /Slugless E2E Show/ }).getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(/\/admin\/anime\/\d+\/edit$/);
    await expect(page.getByRole('button', { name: 'Cancel' }).or(page.getByRole('link', { name: 'Cancel' }))).toBeVisible();
    await expect(page.getByRole('link', { name: 'View public page' })).toHaveCount(0);

    await page.goto('/admin/anime?search=Cowboy');
    await page.getByRole('row', { name: /Cowboy Bebop/ }).first().getByRole('link', { name: 'Edit' }).click();
    await expect(page.getByRole('link', { name: 'View public page' })).toHaveAttribute('href', /\/anime\/cowboy-bebop/);

    expect(errors).toEqual([]);
});
