import { expect, test, type Page } from '@playwright/test';

// Card 4479: an admin writes a blog post in the rich editor, switches to the
// raw Markdown and back, and saves a draft. Seeded admin: e2e-admin@example.com
// (database/seeders/E2ESeeder.php).

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('an admin writes a post in the rich editor, edits the Markdown and saves a draft', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/login');
    await page.locator('#email').fill('e2e-admin@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/admin/blog');
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
    await page.getByRole('link', { name: 'New post' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'New post' })).toBeVisible();

    await page.getByLabel('Title', { exact: true }).fill('Ten Shows to Watch This Winter');
    await page.getByLabel('Excerpt').fill('Our winter picks.');

    // Rich editor: a heading, then a paragraph with bold text.
    const rich = page.locator('[data-testid="blog-editor-rich"]');
    await rich.click();
    await page.getByRole('button', { name: 'Heading 2' }).click();
    await page.keyboard.type('Why winter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Cosy nights call for ');
    await page.getByRole('button', { name: 'Bold' }).click();
    await page.keyboard.type('long series');
    await expect(rich.locator('h2')).toHaveText('Why winter');
    await expect(rich.locator('strong')).toHaveText('long series');

    // Markdown view shows the same content as Markdown.
    await page.getByRole('button', { name: 'Markdown', exact: true }).click();
    const markdown = page.locator('[data-testid="blog-editor-markdown"]');
    await expect(markdown).toBeVisible();
    await expect(markdown).toHaveValue(/## Why winter/);
    await expect(markdown).toHaveValue(/Cosy nights call for \*\*long series\*\*/);

    // Paste an "AI draft" section at the end, then go back to the rich editor.
    const current = await markdown.inputValue();
    await markdown.fill(`${current}\n\n### The list\n\n- Frieren\n- [Dungeon Meshi](https://anitrack.app/anime/dungeon-meshi)\n`);
    await page.getByRole('button', { name: 'Markdown', exact: true }).click();
    await expect(markdown).toHaveCount(0);
    await expect(rich.locator('h2')).toHaveText('Why winter');
    await expect(rich.locator('h3')).toHaveText('The list');
    await expect(rich.locator('li')).toHaveText(['Frieren', 'Dungeon Meshi']);
    await expect(rich.locator('a')).toHaveAttribute('href', 'https://anitrack.app/anime/dungeon-meshi');

    // An image by URL (same origin: the CSP only allows our own and AniList's
    // image hosts) and a link from the toolbar, both through prompts.
    await rich.locator('h2').click();
    await page.keyboard.press('End');
    const answers = ['/favicon.ico', 'AniTrack logo'];
    const onDialog = (dialog: import('@playwright/test').Dialog) => dialog.accept(answers.shift());
    page.on('dialog', onDialog);
    await page.getByRole('button', { name: 'Image by URL' }).click();
    await expect(rich.locator('img')).toHaveAttribute('alt', 'AniTrack logo');
    await rich.locator('h3').click();
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Home');
    answers.push('https://anitrack.app/seasonal');
    await page.getByRole('button', { name: 'Link', exact: true }).click();
    await expect(rich.locator('h3 a')).toHaveAttribute('href', 'https://anitrack.app/seasonal');
    page.off('dialog', onDialog);

    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/admin\/blog\/\d+\/edit$/);
    await expect(page.getByRole('alert').getByText('Draft saved.')).toBeVisible();
    await expect(page.locator('[data-testid="blog-status"]')).toContainText('Draft');
    await expect(page.getByLabel('Slug')).toHaveValue('ten-shows-to-watch-this-winter');

    // The server-rendered preview has everything that was written.
    const preview = page.locator('[data-testid="blog-preview"]');
    await expect(preview.locator('h2')).toHaveText('Why winter');
    await expect(preview.locator('strong')).toHaveText('long series');
    await expect(preview.locator('li')).toHaveText(['Frieren', 'Dungeon Meshi']);
    await expect(preview.locator('img')).toHaveAttribute('src', '/favicon.ico');
    await expect(preview.locator('h3 a')).toHaveAttribute('href', 'https://anitrack.app/seasonal');

    // After the reload the editor holds the saved Markdown.
    await expect(rich.locator('h3')).toHaveText('The list');

    // Publish, then check the list, then delete so other specs see no post.
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByRole('alert').getByText('Post published.')).toBeVisible();
    await expect(page.locator('[data-testid="blog-status"]')).toContainText('Published');

    await page.getByRole('link', { name: 'All posts' }).click();
    const row = page.getByRole('row', { name: /Ten Shows to Watch This Winter/ });
    await expect(row).toContainText('Published');
    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('alert').getByText('Post deleted.')).toBeVisible();
    // The seeded posts (card 4481) stay; this one is gone.
    await expect(row).toHaveCount(0);

    expect(errors).toEqual([]);
});

// Card 4480: images uploaded from the toolbar and by paste, and a cover image.
// Images are made in the page with a canvas, so no fixture files are needed.
async function pngFromCanvas(page: Page, width: number, height: number, colour: string): Promise<Buffer> {
    const dataUrl = await page.evaluate(
        ({ width, height, colour }) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = colour;
            ctx.fillRect(0, 0, width, height);
            return canvas.toDataURL('image/png');
        },
        { width, height, colour },
    );
    return Buffer.from(dataUrl.split(',')[1], 'base64');
}

test('an admin uploads images into a post and sets a cover image', async ({ page, playwright, baseURL }) => {
    const errors = collectErrors(page);

    await page.goto('/login');
    await page.locator('#email').fill('e2e-admin@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/admin/blog/create');
    await expect(page.getByRole('heading', { level: 1, name: 'New post' })).toBeVisible();
    await page.getByLabel('Title', { exact: true }).fill('Posters of the Season');

    const rich = page.locator('[data-testid="blog-editor-rich"]');
    await rich.click();
    await page.keyboard.type('Here is the poster:');

    // Toolbar upload: a 2000px-wide PNG comes back scaled to 1600px.
    const wide = await pngFromCanvas(page, 2000, 500, '#3b82f6');
    page.once('dialog', (dialog) => {
        expect(dialog.defaultValue()).toBe('winter poster');
        void dialog.accept('Winter poster in blue');
    });
    await page.locator('[data-testid="blog-editor-file"]').setInputFiles({ name: 'winter-poster.png', mimeType: 'image/png', buffer: wide });
    const firstImage = rich.locator('img').first();
    await expect(firstImage).toHaveAttribute('alt', 'Winter poster in blue');
    await expect(firstImage).toHaveAttribute('src', /^\/media\/blog\/\d{4}\/\d{2}\/[0-9a-z]{26}-1600x400\.png$/);

    // Paste an image from the clipboard.
    await rich.click();
    await page.keyboard.press('Control+End');
    const small = await pngFromCanvas(page, 300, 200, '#ef4444');
    page.once('dialog', (dialog) => void dialog.accept('A red square'));
    await rich.evaluate((el, b64) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const data = new DataTransfer();
        data.items.add(new File([bytes], 'image.png', { type: 'image/png' }));
        el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    }, small.toString('base64'));
    await expect(rich.locator('img[alt="A red square"]')).toHaveAttribute('src', /-300x200\.png$/);

    // A file type that isn't allowed is refused before upload.
    await page.locator('[data-testid="blog-editor-file"]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await expect(page.getByRole('alert').getByText('Only JPEG, PNG, WebP and GIF images can be uploaded.')).toBeVisible();

    // The Markdown holds both images with their alt text.
    await page.getByRole('button', { name: 'Markdown', exact: true }).click();
    const markdown = page.locator('[data-testid="blog-editor-markdown"]');
    await expect(markdown).toHaveValue(/!\[Winter poster in blue\]\(\/media\/blog\/[^)]+-1600x400\.png\)/);
    await expect(markdown).toHaveValue(/!\[A red square\]\(\/media\/blog\/[^)]+-300x200\.png\)/);
    await page.getByRole('button', { name: 'Markdown', exact: true }).click();

    // Cover image.
    const cover = await pngFromCanvas(page, 1200, 630, '#22c55e');
    await page.locator('[data-testid="blog-cover-file"]').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: cover });
    await expect(page.locator('[data-testid="blog-cover-preview"]')).toHaveAttribute('src', /-1200x630\.png$/);

    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/admin\/blog\/\d+\/edit$/);
    await expect(page.getByRole('alert').getByText('Draft saved.')).toBeVisible();

    // After a reload: the cover is kept, and the server-rendered preview has
    // both images with their size and lazy loading, and they really load.
    await page.reload();
    await expect(page.locator('[data-testid="blog-cover-preview"]')).toHaveAttribute('src', /-1200x630\.png$/);
    const preview = page.locator('[data-testid="blog-preview"]');
    const posterInPreview = preview.locator('img[alt="Winter poster in blue"]');
    await expect(posterInPreview).toHaveAttribute('width', '1600');
    await expect(posterInPreview).toHaveAttribute('height', '400');
    await expect(posterInPreview).toHaveAttribute('loading', 'lazy');
    await posterInPreview.scrollIntoViewIfNeeded();
    await expect.poll(() => posterInPreview.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(1600);
    await expect(preview.locator('img[alt="A red square"]')).toHaveAttribute('width', '300');

    // A guest (no session) gets the image, cacheable and without a cookie.
    const src = (await posterInPreview.getAttribute('src'))!;
    const guest = await playwright.request.newContext({ baseURL });
    const response = await guest.get(src);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    expect(response.headers()['cache-control']).toContain('immutable');
    expect(response.headers()['set-cookie']).toBeUndefined();
    await guest.dispose();

    // Remove the cover, save, and it's gone after a reload.
    await page.getByRole('button', { name: 'Remove cover' }).click();
    await expect(page.locator('[data-testid="blog-cover-preview"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('alert').getByText('Post saved.')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-testid="blog-cover-preview"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Upload cover' })).toBeVisible();

    // Delete so the other blog test sees no post.
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('alert').getByText('Post deleted.')).toBeVisible();

    expect(errors).toEqual([]);
});
