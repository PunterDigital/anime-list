import { expect, test, type Page } from '@playwright/test';

// Card 4476. Seeded by database/seeders/E2ESeeder.php: the `anitrack-rating` flag is on
// for everyone, ten users scored rated-e2e-show (six 8s, four 9s: 8.4) and nine scored
// unrated-e2e-show (plus one entry without a score, which doesn't count).

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('an anime scored by ten users shows the AniTrack rating next to the score', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/anime/rated-e2e-show');
    await expect(page.getByRole('heading', { level: 1, name: 'Rated E2E Show' })).toBeVisible();

    const rating = page.locator('[data-test="anitrack-rating"]');
    await expect(rating).toContainText('AniTrack rating');
    await expect(rating).toContainText('★ 8.4');
    await expect(rating).toContainText('· 10 ratings');
    // It sits right after the existing score in the info grid.
    await expect(rating.locator('xpath=preceding-sibling::div[1]')).toContainText('Score');
    // Only the average and the count: nobody's name or own score.
    await expect(rating).not.toContainText('E2E Rater');
    expect(errors).toEqual([]);
});

test('an anime scored by fewer than ten users shows No Rating Yet', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/anime/unrated-e2e-show');
    await expect(page.getByRole('heading', { level: 1, name: 'Unrated E2E Show' })).toBeVisible();

    const rating = page.locator('[data-test="anitrack-rating"]');
    await expect(rating).toContainText('AniTrack rating');
    await expect(rating).toContainText('No Rating Yet');
    await expect(rating).not.toContainText('ratings');
    expect(errors).toEqual([]);
});

test('cards on the browse page leave the AniTrack rating out', async ({ page }) => {
    await page.goto('/anime');
    await expect(page.getByRole('link', { name: 'Rated E2E Show' }).first()).toBeVisible();
    await expect(page.getByText('AniTrack rating')).toHaveCount(0);
});
