import { expect, test, type Page } from '@playwright/test';

// Card 5718: a long list draws 120 entries at a time; the status tabs and the
// sort still work on every entry. Seeded: shelf-e2e's public list, 125
// entries. "Shelf E2E 125" is the most recently updated, so by default
// 001-005 (the only "watching" ones) are outside the first slice.

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

const rows = (page: Page) => page.locator('tbody tr');

test('a long public list draws one slice, shows more on request, and filters and sorts across all of it', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/user/shelf-e2e/list');
    await expect(rows(page)).toHaveCount(120);
    await expect(page.getByRole('link', { name: 'Shelf E2E 125' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shelf E2E 001' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Show more (5 left)' }).click();
    await expect(rows(page)).toHaveCount(125);
    await expect(page.getByRole('link', { name: 'Shelf E2E 001' })).toBeVisible();
    await expect(page.locator('[data-test="list-show-more"]')).toHaveCount(0);

    // A tab works on entries outside the slice, and the slice starts over after.
    await page.getByRole('button', { name: /^All/ }).click();
    await page.getByRole('button', { name: /^Watching/ }).click();
    await expect(rows(page)).toHaveCount(5);
    await expect(page.getByRole('link', { name: 'Shelf E2E 001' })).toBeVisible();
    await page.getByRole('button', { name: /^All/ }).click();
    await expect(rows(page)).toHaveCount(120);
    await expect(page.getByRole('link', { name: 'Shelf E2E 001' })).toHaveCount(0);

    // Sorting by title brings 001 (outside the slice) to the top.
    await page.locator('select').filter({ hasText: 'Last Updated' }).selectOption('title');
    await expect(rows(page)).toHaveCount(120);
    await expect(rows(page).first()).toContainText('Shelf E2E 001');
    await expect(page.getByRole('link', { name: 'Shelf E2E 125' })).toHaveCount(0);
    expect(errors).toEqual([]);
});
