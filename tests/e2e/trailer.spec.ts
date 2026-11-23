import { expect, test, type Page } from '@playwright/test';

// Card 5704: the trailer tab shows a thumbnail and a play button, and YouTube's
// player loads only when it's pressed. Seeded by E2ESeeder (TRAILER_SLUG).
const PATH = '/anime/trailer-e2e-show';
const VIDEO_ID = 'e2eTrailer1';

// A 1x1 PNG, so the spec never fetches a real thumbnail.
const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
);

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('the trailer loads YouTube only after play is pressed', async ({ page }) => {
    const errors = collectErrors(page);
    const youtube: string[] = [];

    // Answer YouTube's hosts here: nothing reaches YouTube, and every request is seen.
    await page.route(/^https:\/\/([a-z0-9-]+\.)*(youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com)\//, (route) => {
        const url = route.request().url();
        youtube.push(url);
        if (url.startsWith('https://i.ytimg.com/')) {
            return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
        }
        return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>player</title><p>Player</p>' });
    });

    await page.goto(PATH);
    await expect(page.getByRole('heading', { name: 'Trailer E2E Show' }).first()).toBeVisible();

    const play = page.getByRole('button', { name: 'Play the Trailer E2E Show trailer' });
    await expect(play).toBeVisible();
    await expect(play.locator('img')).toHaveAttribute('src', `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`);
    await expect(play.locator('img')).toHaveAttribute('loading', 'lazy');
    await expect(page.locator('[data-ui="trailer-player"]')).toHaveCount(0);

    // Only the thumbnail so far: no player, no youtube.com, no youtube-nocookie.com.
    await page.waitForLoadState('networkidle');
    expect(youtube.filter((u) => !u.startsWith('https://i.ytimg.com/'))).toEqual([]);

    // Keyboard: Tab to the button and press Enter.
    await play.focus();
    await page.keyboard.press('Enter');

    const player = page.locator('[data-ui="trailer-player"]');
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute('src', `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`);
    await expect(player).toHaveAttribute('allow', /autoplay/);
    await expect(player).toBeFocused();
    await expect.poll(() => youtube.some((u) => u.startsWith(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`))).toBe(true);
    await expect(play).toHaveCount(0);

    expect(errors).toEqual([]);
});
