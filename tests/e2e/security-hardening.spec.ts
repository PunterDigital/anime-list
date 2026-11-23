import { expect, test, type Page } from '@playwright/test';

// Card 5529. Seeded by database/seeders/E2ESeeder.php: the e2e-rater-* users
// have list entries and a private list (the default).

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('a private list shows no profile stats to a guest', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/user/e2e-rater-0');
    await expect(page.getByRole('heading', { name: 'E2E Rater 0' })).toBeVisible();
    await expect(page.locator('[data-test="profile-stats-hidden"]')).toHaveText("E2E Rater 0's list is private.");
    await expect(page.getByText('Total Entries')).toHaveCount(0);

    expect(errors).toEqual([]);
});

test('a new email address asks for the current password', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/login');
    await page.locator('#email').fill('e2e@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/settings');
    const email = page.locator('input[type="email"]');
    await expect(email).toHaveValue('e2e@example.com');
    await expect(page.locator('#profile-current-password')).toHaveCount(0);

    // Other specs sign in as this user, so the address is never actually changed.
    await email.fill('someone-else@example.com');
    await expect(page.locator('#profile-current-password')).toBeVisible();
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await expect(page.getByText('Enter your current password to change your email address.')).toBeVisible();

    await email.fill('e2e@example.com');
    await expect(page.locator('#profile-current-password')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('input[type="email"]')).toHaveValue('e2e@example.com');
    await expect(page.locator('#profile-current-password')).toHaveCount(0);

    expect(errors).toEqual([]);
});
