import { expect, test, type Page } from '@playwright/test';

// Card 4481: the public blog. Seeded by database/seeders/E2ESeeder.php: the
// `blog` flag is on for everyone, with one published post and one draft.
const POST = 'welcome-to-the-anitrack-blog';
const DRAFT = 'unfinished-draft';

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('a guest finds the blog in the footer, opens a post and sees its SEO tags', async ({ page, baseURL }) => {
    const errors = collectErrors(page);

    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Blog', exact: true }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();

    const list = page.locator('[data-test="blog-list"]');
    await expect(list.getByRole('heading', { level: 2, name: 'Welcome to the AniTrack Blog' })).toBeVisible();
    await expect(list).toContainText('What we will write about here.');
    await expect(list).not.toContainText('Unfinished Draft');

    await list.getByRole('link', { name: 'Welcome to the AniTrack Blog' }).click();
    await expect(page).toHaveURL(new RegExp(`/blog/${POST}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to the AniTrack Blog');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const body = page.locator('[data-test="blog-body"]');
    await expect(body.locator('h2')).toHaveText('What to expect');
    await expect(body.locator('h3')).toHaveText('Staying in touch');
    await expect(page.locator('[data-test="blog-preview-banner"]')).toHaveCount(0);

    // Head tags (Inertia's Head marks its own with data-inertia).
    await expect(page).toHaveTitle('Welcome to the AniTrack Blog (SEO) — AniTrack');
    const url = `${baseURL}/blog/${POST}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', url);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Seasonal picks, guides and news from AniTrack.');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', url);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', `${baseURL}/blog/feed.xml`);

    expect(errors).toEqual([]);
});

test('drafts are 404 for guests; the feed and the sitemap list the published post', async ({ request, baseURL }) => {
    expect((await request.get(`/blog/${DRAFT}`)).status()).toBe(404);

    const feed = await request.get('/blog/feed.xml');
    expect(feed.status()).toBe(200);
    expect(feed.headers()['content-type']).toContain('application/rss+xml');
    const xml = await feed.text();
    expect(xml).toContain(`<link>${baseURL}/blog/${POST}</link>`);
    expect(xml).not.toContain(DRAFT);

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain(`<loc>${baseURL}/blog/${POST}</loc>`);
    expect(sitemap).not.toContain(DRAFT);
});

test('an admin previews a draft with a banner and noindex', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/login');
    await page.locator('#email').fill('e2e-admin@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto(`/blog/${DRAFT}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unfinished Draft');
    await expect(page.locator('[data-test="blog-preview-banner"]')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');

    expect(errors).toEqual([]);
});
