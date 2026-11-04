import { expect, test, type Page } from '@playwright/test';

// Card 4198. Seeded by database/seeders/E2ESeeder.php: the admin
// e2e-admin@example.com and "Nsfw E2E Show" (nsfw-e2e-show), not marked yet.

const SLUG = 'nsfw-e2e-show';
const TITLE = 'Nsfw E2E Show';

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('an admin marks a title NSFW: search leaves it out and guests are asked to sign in', async ({ page, browser }) => {
    const errors = collectErrors(page);

    // Before: search finds it.
    const before = await (await page.request.get('/api/search?q=nsfw+e2e')).json();
    expect(before.total).toBe(1);

    await page.goto('/login');
    await page.locator('#email').fill('e2e-admin@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto(`/admin/anime?search=${SLUG}`);
    await page.getByRole('row', { name: new RegExp(TITLE) }).getByRole('link', { name: 'Edit' }).click();
    const form = page.locator('[data-testid="nsfw-form"]');
    await expect(form.locator('[data-testid="anilist-adult"]')).toContainText('AniList adult flag: no');
    await form.getByRole('checkbox', { name: 'NSFW' }).check();
    await expect(page.getByText('Marked NSFW.').first()).toBeVisible();
    await expect(form).toContainText('Marked NSFW since');

    // The admin list filter finds it.
    await page.goto('/admin/anime?nsfw_only=1');
    await expect(page.getByRole('row', { name: new RegExp(TITLE) })).toBeVisible();

    // Signed in, the title page still opens.
    await page.goto(`/anime/${SLUG}`);
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();

    // Search (site and API) leaves it out.
    const after = await (await page.request.get('/api/search?q=nsfw+e2e')).json();
    expect(after.total).toBe(0);

    // A guest gets the sign-in page, with a link back to the title.
    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    const guestErrors = collectErrors(guestPage);
    await guestPage.goto(`/anime/${SLUG}`);
    const gate = guestPage.locator('[data-testid="nsfw-gate"]');
    await expect(gate).toContainText('This title is marked NSFW. Sign in to view it.');
    await expect(guestPage.getByText('A show the NSFW end-to-end test marks.')).toHaveCount(0);
    await expect(guestPage.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await gate.getByRole('link', { name: 'Sign in' }).click();
    await expect(guestPage).toHaveURL(new RegExp(`/login\\?redirect=%2Fanime%2F${SLUG}$`));
    await guest.close();

    // Clear it again so the other specs see the seeded title.
    await page.goto(`/admin/anime?nsfw_only=1`);
    await page.getByRole('row', { name: new RegExp(TITLE) }).getByRole('link', { name: 'Edit' }).click();
    await page.locator('[data-testid="nsfw-form"]').getByRole('checkbox', { name: 'NSFW' }).uncheck();
    await expect(page.getByText('No longer marked NSFW.').first()).toBeVisible();

    expect(errors).toEqual([]);
    expect(guestErrors).toEqual([]);
});
