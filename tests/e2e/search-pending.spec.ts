import { expect, test, type Page } from '@playwright/test';

// Card 5707: a search that finds nothing locally answers at once with
// `pending: true` while a queued job looks the text up on AniList. The
// navbar search asks again every 2 s until the titles are there.

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('the navbar search asks again while an AniList lookup is pending', async ({ page }) => {
    const errors = collectErrors(page);
    let calls = 0;

    // Stand in for the server: the first two answers say the lookup is still
    // queued, the third has the title the job stored.
    await page.route('**/api/search?*', async (route) => {
        calls++;
        const found = calls >= 3;
        await route.fulfill({
            json: {
                data: found
                    ? [{
                        id: 990001, slug: 'pending-lookup-show', anilist_id: 990001,
                        title_romaji: 'Pending Lookup Show', title_english: null,
                        format: 'TV', status: 'FINISHED', season: null, season_year: null, episodes: 12,
                        cover_image_large: null, cover_image_medium: null, cover_image_color: null,
                        average_score: null, bayesian_score: null, popularity: 1, genres: [],
                    }]
                    : [],
                query: 'pendinglookup',
                total: found ? 1 : 0,
                source: 'local',
                pending: !found,
            },
        });
    });

    await page.goto('/');
    const box = page.getByPlaceholder('Search anime...').first();
    await box.fill('pendinglookup');
    await expect(page.getByText('No results found')).toBeVisible();

    // No new typing: the refetches bring the result in.
    await expect(page.getByText('Pending Lookup Show')).toBeVisible({ timeout: 10_000 });
    expect(calls).toBe(3);

    // Once it isn't pending, nothing more is asked.
    await page.waitForTimeout(2500);
    expect(calls).toBe(3);
    expect(errors).toEqual([]);
});
