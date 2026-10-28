import { expect, test, type Page } from '@playwright/test';

// Runs on the SSR server (Playwright project `ssr`): Laravel with INERTIA_SSR_ENABLED=true
// and the built bootstrap/ssr/ssr.js. Seeded by database/seeders/E2ESeeder.php.
const ANIME = 'Cowboy Bebop';

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

// What the server put inside #app, before any JS runs. The data-page attribute is
// left out: it holds the page props as JSON, titles included.
function appHtml(html: string): string {
    const match = html.match(/<div id="app" data-page="[^"]*">([\s\S]*)<\/div>\s*<\/body>/);
    expect(match, 'the page has a server-rendered #app').not.toBeNull();
    return match![1];
}

// Each page with a search box placeholder only it renders, plus text it must contain.
const pages = [
    { path: '/', placeholder: 'Search anime...', text: 'AniTrack' },
    { path: '/anime', placeholder: 'Search by title...', text: ANIME },
];

for (const { path, placeholder, text } of pages) {
    test(`${path} arrives rendered and hydrates without errors`, async ({ page, request }) => {
        const response = await request.get(path);
        expect(response.status()).toBe(200);
        const html = appHtml(await response.text());
        expect(html).not.toContain('[object Promise]');
        expect(html).toContain(`placeholder="${placeholder}"`);
        expect(html).toContain(text);

        const errors = collectErrors(page);
        await page.goto(path);
        await expect(page.getByPlaceholder(placeholder).first()).toBeVisible();
        expect(errors).toEqual([]);
    });
}

test('an anime page arrives with its title and synopsis', async ({ page, request }) => {
    const path = '/anime/cowboy-bebop';
    const html = appHtml(await (await request.get(path)).text());
    expect(html).toMatch(new RegExp(`<h1[^>]*>\\s*${ANIME}`));
    expect(html).toContain('A story used by the end-to-end tests');

    const errors = collectErrors(page);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: ANIME })).toBeVisible();
    expect(errors).toEqual([]);
});
