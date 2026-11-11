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

// What the server put inside #app, before any JS runs. The page props (Inertia 3's
// `<script data-page="app" type="application/json">`, titles included) are left out.
function appHtml(html: string): string {
    const match = html.match(/<div data-server-rendered="true" id="app">([\s\S]*)<\/div>\s*<\/body>/);
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

// The SSR head brings the page's own title, and the root view's fallback title stays
// out, so crawlers that don't run JS read the right one (card 4242).
for (const { path, title } of [
    { path: '/login', title: 'Login — AniTrack' },
    { path: '/anime', title: 'Browse &amp; Search Anime — AniTrack' },
]) {
    test(`${path} arrives with one title, its own`, async ({ request }) => {
        const html = await (await request.get(path)).text();
        const titles = html.match(/<title[^>]*>[^<]*<\/title>/g) ?? [];
        expect(titles).toHaveLength(1);
        expect(titles[0]).toContain(`>${title}</title>`);
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

// Card 4476: the AniTrack rating is in the server HTML in both states, and hydrates cleanly.
for (const { slug, text } of [
    { slug: 'rated-e2e-show', text: '· 10 ratings' },
    { slug: 'unrated-e2e-show', text: 'No Rating Yet' },
]) {
    test(`/anime/${slug} arrives with its AniTrack rating`, async ({ page, request }) => {
        const html = appHtml(await (await request.get(`/anime/${slug}`)).text());
        expect(html).toContain('AniTrack rating');
        expect(html).toContain(text);
        if (slug === 'rated-e2e-show') expect(html).toContain('★ 8.4');

        const errors = collectErrors(page);
        await page.goto(`/anime/${slug}`);
        await expect(page.locator('[data-test="anitrack-rating"]')).toContainText(text);
        expect(errors).toEqual([]);
    });
}

test('the sign-in link on an anime page and the login page keep the way back', async ({ page, request }) => {
    const animeHtml = appHtml(await (await request.get('/anime/cowboy-bebop')).text());
    expect(animeHtml).toMatch(/href="[^"]*\/login\?redirect=%2Fanime%2Fcowboy-bebop"/);

    const response = await request.get('/login?redirect=/anime/cowboy-bebop');
    expect(response.status()).toBe(200);
    const loginHtml = appHtml(await response.text());
    expect(loginHtml).not.toContain('[object Promise]');
    expect(loginHtml).toMatch(/<h1[^>]*>\s*Login/);
    expect(loginHtml).toMatch(/href="[^"]*\/register\?redirect=%2Fanime%2Fcowboy-bebop"/);

    const errors = collectErrors(page);
    await page.goto('/login?redirect=/anime/cowboy-bebop');
    await expect(page.getByRole('heading', { level: 1, name: 'Login' })).toBeVisible();
    expect(errors).toEqual([]);
});

// The error pages render inside the site layout (E2ESeeder turns the `error-pages` flag on).
for (const { path, status, heading, text } of [
    { path: '/no-such-page', status: 404, heading: "We couldn&#39;t find that page", text: 'Privacy Policy' },
    { path: '/anime/cowboy-bebop-the-movie', status: 404, heading: "We couldn&#39;t find that page", text: 'value="cowboy bebop the movie"' },
    { path: '/anime/hidden-e2e-show', status: 451, heading: 'This anime page is no longer available', text: 'Cowboy Bebop' },
]) {
    test(`the ${status} page for ${path} arrives rendered and hydrates without errors`, async ({ page, request }) => {
        const response = await request.get(path);
        expect(response.status()).toBe(status);
        const html = appHtml(await response.text());
        expect(html).not.toContain('[object Promise]');
        expect(html).toContain(heading);
        expect(html).toContain(text);
        expect(html).not.toContain('Hidden E2E Show');

        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error' && !/status of (404|451)/.test(msg.text())) errors.push(msg.text());
        });
        page.on('pageerror', (err) => errors.push(err.message));
        await page.goto(path);
        await expect(page.getByRole('button', { name: 'Go back' })).toBeVisible();
        expect(errors).toEqual([]);
    });
}

// Card 4481: a blog post arrives rendered, with its meta tags and BlogPosting
// JSON-LD in the first HTML, so crawlers that don't run JS see all of it.
test('a blog post arrives rendered with its meta tags and JSON-LD', async ({ page, request, baseURL }) => {
    const slug = 'welcome-to-the-anitrack-blog';
    const response = await request.get(`/blog/${slug}`);
    expect(response.status()).toBe(200);
    const full = await response.text();

    const html = appHtml(full);
    expect(html).toContain('Welcome to the AniTrack Blog</h1>');
    expect(html).toContain('<h2>What to expect</h2>');

    const head = full.slice(0, full.indexOf('</head>'));
    const url = `${baseURL}/blog/${slug}`;
    expect(head).toMatch(/<title[^>]*>Welcome to the AniTrack Blog \(SEO\) — AniTrack<\/title>/);
    expect(head).toMatch(new RegExp(`<link[^>]+rel="canonical"[^>]+href="${url}"`));
    expect(head).toMatch(/<meta[^>]+name="description"[^>]+content="Seasonal picks, guides and news from AniTrack\."/);
    expect(head).toMatch(/<meta[^>]+property="og:title"[^>]+content="Welcome to the AniTrack Blog \(SEO\)"/);
    expect(head).toMatch(/<meta[^>]+property="og:type"[^>]+content="article"/);
    expect(head).toMatch(/<meta[^>]+name="twitter:card"/);

    const blocks = [...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const posting = blocks.find((b) => b['@type'] === 'BlogPosting');
    expect(posting).toBeTruthy();
    expect(posting.headline).toBe('Welcome to the AniTrack Blog');
    expect(posting.author).toEqual({ '@type': 'Person', name: expect.any(String) });
    expect(posting.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(posting.mainEntityOfPage['@id']).toBe(url);

    const errors = collectErrors(page);
    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to the AniTrack Blog');
    expect(errors).toEqual([]);
});
