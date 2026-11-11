import { expect, test, type Page } from '@playwright/test';

// Seeded by database/seeders/E2ESeeder.php: the `error-pages` flag is on for everyone,
// and hidden-e2e-show is hidden (451) with Cowboy Bebop and Mob Psycho 100 as its
// recommendations.

// The browser logs the error status of the page itself; anything else is a real error.
function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error' && !/status of (404|451)/.test(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

// The Inertia page object from a server-rendered response (Inertia 3 puts it in a script tag).
type InertiaPage = {
    component: string;
    props: { status: number; auth: { user: { email: string } | null } };
};

function inertiaPage(html: string): InertiaPage {
    const json = html.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    expect(json, 'Inertia page data in the response').toBeTruthy();
    return JSON.parse(json!);
}

// API requests send no Sec-Fetch-Site header, so like curl they need a CSRF token wherever
// the app checks one. A browser form POST is same-origin and would pass the check anyway.
test('POST, PUT and DELETE to an unknown URL show the 404 page, not 419 (card 4488)', async ({ request }) => {
    for (const method of ['post', 'put', 'delete'] as const) {
        const response = await request[method]('/no-such-page', { form: { anything: 'x' } });
        expect(response.status(), `${method.toUpperCase()} /no-such-page`).toBe(404);
        const page = inertiaPage(await response.text());
        expect(page.component).toBe('ErrorPage');
        expect(page.props.status).toBe(404);
        expect(page.props.auth.user).toBeNull();
    }
});

test('a real form still needs its CSRF token', async ({ request }) => {
    const response = await request.post('/login', { form: { email: 'e2e@example.com', password: 'wrong' } });
    expect(response.status()).toBe(419);
    expect(inertiaPage(await response.text()).props.status).toBe(419);
});

test('a 404 page keeps the site layout and offers a way out', async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);

    await expect(page.getByRole('heading', { level: 1, name: "We couldn't find that page" })).toBeVisible();
    // The navbar and footer are there.
    await expect(page.getByRole('link', { name: 'Seasonal' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go back' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Popular pages' }).getByRole('link', { name: 'Top rated' }).click();
    await expect(page).toHaveURL(/\/top$/);
    expect(errors).toEqual([]);
});

test('a missing anime URL fills in a search from the link', async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto('/anime/cowboy-bebop-the-movie');
    expect(response?.status()).toBe(404);

    const search = page.getByRole('searchbox', { name: 'Search anime' });
    await expect(search).toHaveValue('cowboy bebop the movie');
    await search.fill('cowboy');
    await page.getByRole('search').getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/anime\?filter%5Bsearch%5D=cowboy/);
    await expect(page.getByRole('link', { name: 'Cowboy Bebop' }).first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('a hidden anime suggests other anime and never shows its own', async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto('/anime/hidden-e2e-show');
    expect(response?.status()).toBe(451);

    await expect(page.getByRole('heading', { level: 1, name: 'This anime page is no longer available' })).toBeVisible();
    const alternatives = page.locator('[data-test="error-alternatives"]');
    await expect(alternatives.getByRole('link')).toHaveCount(2);
    await expect(alternatives.getByRole('link').first()).toContainText('Cowboy Bebop');
    await expect(page.getByText('Hidden E2E Show')).toHaveCount(0);
    await expect(page.getByText('Hidden synopsis')).toHaveCount(0);

    await alternatives.getByRole('link').first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Cowboy Bebop' })).toBeVisible();
    expect(errors).toEqual([]);
});

test('a signed-in user stays signed in on a 404 page', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/login');
    await page.locator('#email').fill('e2e@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page.getByRole('link', { name: 'My List' })).toBeVisible();

    const response = await page.goto('/definitely/not/here');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('link', { name: 'My List' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toHaveCount(0);

    // With the session cookie but no CSRF token: a POST to an unknown URL is a 404 for
    // the signed-in user, and a real route still refuses it.
    const post = await page.request.post('/definitely/not/here', { form: { anything: 'x' } });
    expect(post.status()).toBe(404);
    expect(inertiaPage(await post.text()).props.auth.user?.email).toBe('e2e@example.com');
    expect((await page.request.post('/logout')).status()).toBe(419);
    expect(errors).toEqual([]);
});
