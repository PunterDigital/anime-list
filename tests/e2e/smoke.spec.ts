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
    const addButton = page.getByRole('button', { name: 'Add to List' });
    await addButton.click();

    // Card 4272: the local Dialog, Select, Slider and Toast. The dialog is a
    // titled modal; Escape closes it and focus goes back to the button.
    const dialog = page.getByRole('dialog', { name: 'Add to List' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(addButton).toBeFocused();

    await addButton.click();
    const status = dialog.getByRole('combobox', { name: 'Status' });
    await expect(status).toHaveText('Plan to Watch');
    await status.focus();
    await page.keyboard.press('Home'); // closed: Home does nothing
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('Watching');
    // Escape on an open list closes the list, not the dialog.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(dialog).toBeVisible();

    const score = dialog.getByRole('slider', { name: 'Score' });
    await expect(score).toHaveAttribute('aria-valuenow', '0');
    await score.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await expect(score).toHaveAttribute('aria-valuenow', '9');
    await expect(dialog.getByText('Score: 9')).toBeVisible();

    await dialog.getByRole('button', { name: 'Save' }).click();
    const toast = page.getByRole('alert').filter({ hasText: 'Added to List' });
    await expect(toast).toContainText('Watching');
    await toast.getByRole('button', { name: 'Close' }).click();
    await expect(toast).toHaveCount(0);

    await page.goto('/list');
    await expect(page.getByText(ANIME).first()).toBeVisible();

    // Card 4272: the local form controls that replaced PrimeVue's keep their
    // keyboard and screen-reader behaviour. Here, not in a spec of its own:
    // another sign-in would hit throttle:auth (5 a minute).
    await page.goto('/settings');
    const name = page.locator('label:text-is("Name") + input');
    await expect(name).toHaveValue('New Viewer');
    await expect(name).toHaveAttribute('type', 'text');
    const bio = page.locator('label:text-is("Bio") + textarea');
    await bio.fill('Watching everything.');

    // The switch is a focusable checkbox with role="switch": Space toggles it.
    const listSwitch = page.getByRole('switch');
    await expect(listSwitch).toHaveCount(1);
    await expect(listSwitch).toHaveAttribute('aria-checked', 'false');
    await listSwitch.focus();
    await page.keyboard.press('Space');
    await expect(listSwitch).toHaveAttribute('aria-checked', 'true');

    // Show/hide password is a labelled button that says whether it is on.
    const current = page.locator('label:text-is("Current Password") + div input');
    await current.fill('secret-value');
    await expect(current).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).first().focus();
    await page.keyboard.press('Enter');
    await expect(current).toHaveAttribute('type', 'text');
    const hide = page.getByRole('button', { name: 'Hide password' });
    await expect(hide).toHaveAttribute('aria-pressed', 'true');
    await hide.click();
    await expect(current).toHaveAttribute('type', 'password');

    // The timezone select has a filter box: typing narrows the list, the
    // arrows still move through it and Enter picks.
    const timezone = page.getByRole('combobox', { name: 'Timezone' });
    await timezone.click();
    const filter = page.getByRole('searchbox', { name: 'Filter options' });
    await expect(filter).toBeFocused();
    await filter.fill('europe/pra');
    await expect(page.getByRole('option')).toHaveText(['Europe/Prague']);
    await page.keyboard.press('Enter');
    await expect(timezone).toHaveText('Europe/Prague');
    await timezone.click();
    await page.getByRole('searchbox', { name: 'Filter options' }).fill('no such zone');
    await expect(page.getByRole('option')).toHaveText('No results found');
    await page.keyboard.press('Escape');
    await expect(timezone).toBeFocused();

    // Saving goes through the button and keeps the bio, the switch and the timezone.
    const saved = page.waitForResponse((r) => r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save Profile' }).click();
    expect((await saved).status()).toBeLessThan(400);
    await page.reload();
    await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('combobox', { name: 'Timezone' })).toHaveText('Europe/Prague');
    await expect(page.locator('label:text-is("Bio") + textarea')).toHaveValue('Watching everything.');
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
