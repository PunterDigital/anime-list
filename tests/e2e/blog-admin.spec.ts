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
    await expect(page.getByText('No posts yet.')).toBeVisible();

    expect(errors).toEqual([]);
});
