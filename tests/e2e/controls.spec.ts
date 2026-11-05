import { expect, test, type Page } from '@playwright/test';

// Card 4272: the local Select that replaced PrimeVue's keeps its keyboard and
// screen-reader behaviour. Guest pages only: the signed-in controls (Dialog,
// Slider, Toast) are covered in smoke.spec.ts, so no extra sign-in hits
// throttle:auth.

const query = (page: Page) => decodeURIComponent(new URL(page.url()).search);

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('the browse filters are comboboxes you can use with the keyboard', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/anime');

    const format = page.getByRole('combobox', { name: 'Format' });
    await expect(format).toHaveText('Any');
    await expect(format).toHaveAttribute('aria-expanded', 'false');

    // ArrowDown opens the list; Escape closes it and keeps focus.
    await format.focus();
    await page.keyboard.press('ArrowDown');
    await expect(format).toHaveAttribute('aria-expanded', 'true');
    const list = page.getByRole('listbox');
    await expect(list.getByRole('option')).toHaveText(['TV', 'TV Short', 'Movie', 'OVA', 'ONA', 'Special', 'Music']);
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(format).toBeFocused();

    // Arrows move the active option, Enter picks it and applies the filter.
    await page.keyboard.press('Enter');
    await expect(format).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(format).toHaveAttribute('aria-activedescendant', /option-2$/);
    await page.keyboard.press('Enter');
    await expect.poll(() => query(page)).toContain('filter[format]=MOVIE');
    await expect(page.getByRole('combobox', { name: 'Format' })).toHaveText('Movie');

    // The picked option is marked selected when it opens again.
    await page.getByRole('combobox', { name: 'Format' }).click();
    await expect(page.getByRole('option', { name: 'Movie' })).toHaveAttribute('aria-selected', 'true');
    // A click outside closes it.
    await page.mouse.click(1100, 600);
    await expect(page.getByRole('listbox')).toHaveCount(0);

    // The clear button (and Delete on the combobox) goes back to "Any".
    await page.getByRole('button', { name: 'Clear selection' }).click();
    await expect.poll(() => query(page)).not.toContain('format');
    await expect(page.getByRole('combobox', { name: 'Format' })).toHaveText('Any');

    // Sort has no clear button; a mouse pick works too.
    const sort = page.getByRole('combobox', { name: 'Sort by' });
    await sort.click();
    await page.getByRole('option', { name: 'Score' }).click();
    await expect.poll(() => query(page)).toContain('sort=-average_score');
    await expect(sort).toHaveText('Score');

    expect(errors).toEqual([]);
});
