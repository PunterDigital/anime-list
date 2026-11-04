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

// No SSR on this server: the root view's fallback title is the only one, and the
// page sets its own after it loads (card 4242).
test('without SSR a page has the fallback title until it sets its own', async ({ page, request }) => {
    const html = await (await request.get('/login')).text();
    // The fallback is config('app.name'), which differs between .env files.
    const titles = html.match(/<title[^>]*>[^<]*<\/title>/g) ?? [];
    expect(titles).toHaveLength(1);
    expect(titles[0]).toMatch(/^<title data-inertia>[^<]+<\/title>$/);

    await page.goto('/login');
    await expect(page).toHaveTitle('Login — AniTrack');
});

test('browse and open an anime detail page', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/anime');
    await page.getByRole('link', { name: ANIME }).first().click();
    await expect(page.getByRole('heading', { name: ANIME }).first()).toBeVisible();
    await expect(page.getByText('to track this anime')).toBeVisible();
    expect(errors).toEqual([]);
});

test('the synopsis keeps its formatting tags but none of their attributes', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/anime');
    await page.getByRole('link', { name: ANIME }).first().click();

    const synopsis = page.locator('section', { hasText: 'Synopsis' }).locator('.prose').first();
    await expect(synopsis.locator('i', { hasText: ANIME })).toBeVisible();
    const attributes = await synopsis.evaluate((el) =>
        Array.from(el.querySelectorAll('p, i')).flatMap((tag) => tag.getAttributeNames()),
    );
    expect(attributes).toEqual([]);

    await synopsis.locator('p').first().click();
    expect(await page.evaluate(() => (window as unknown as { synopsisClicked?: boolean }).synopsisClicked)).toBeUndefined();
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

test('signing in from an anime page comes back to that anime page', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/anime');
    await page.getByRole('link', { name: ANIME }).first().click();
    await expect(page.getByText('to track this anime')).toBeVisible();
    const animePath = new URL(page.url()).pathname;
    expect(animePath).toMatch(/^\/anime\/[^/]+$/);

    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/login\?redirect=/);
    await page.locator('#email').fill('e2e@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page).toHaveURL((url) => url.pathname === animePath);
    await expect(page.getByRole('heading', { name: ANIME }).first()).toBeVisible();
    await expect(page.getByText('to track this anime')).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('signing up via the login page from an anime page comes back to that anime page', async ({ page }) => {
    const errors = collectErrors(page);
    const id = Date.now();
    await page.goto('/anime');
    await page.getByRole('link', { name: ANIME }).first().click();
    await expect(page.getByText('to track this anime')).toBeVisible();
    const animePath = new URL(page.url()).pathname;
    expect(animePath).toMatch(/^\/anime\/[^/]+$/);

    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/login\?redirect=/);
    await page.getByRole('link', { name: 'Sign up', exact: true }).click();
    await expect(page).toHaveURL(/\/register\?redirect=/);
    await page.locator('#name').fill('Returning Viewer');
    await page.locator('#username').fill(`returner${id}`);
    await page.locator('#email').fill(`returner${id}@example.com`);
    await page.locator('#password').fill('a-long-test-password-1');
    await page.locator('#password_confirmation').fill('a-long-test-password-1');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL((url) => url.pathname === animePath);
    await expect(page.getByRole('button', { name: 'Add to List' })).toBeVisible();
    expect(errors).toEqual([]);
});

test('an off-site redirect on the login page is ignored', async ({ page }) => {
    await page.goto('/login?redirect=//example.com/');
    await expect(page.getByRole('link', { name: 'Sign up', exact: true })).toHaveAttribute('href', /\/register$/);
});
