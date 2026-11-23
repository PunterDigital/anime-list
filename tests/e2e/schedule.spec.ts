import { expect, test, type Page } from '@playwright/test';

// Card 5719: the schedule query now filters on the anime (whereHas). The
// filtering itself is covered by Pest (ScheduleSafeForWorkTest); this checks
// both weeks and the "My list" toggle still render.

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('the airing schedule renders this week and next without console errors', async ({ page }) => {
    const errors = collectErrors(page);

    for (const week of [0, 1]) {
        const response = await page.goto(`/schedule?week=${week}`);
        expect(response?.status()).toBe(200);
        await expect(page.locator('#app')).not.toBeEmpty();
    }

    // my_list is ignored for guests rather than failing.
    expect((await page.goto('/schedule?my_list=1'))?.status()).toBe(200);
    expect(errors).toEqual([]);
});
