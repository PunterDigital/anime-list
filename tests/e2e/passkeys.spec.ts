import { expect, test, type Page } from '@playwright/test';

// Card 4237: passkeys on laravel/passkeys, driven with Chrome's CDP virtual
// authenticator. WebAuthn refuses an IP address as RP ID, so these tests use
// http://localhost (playwright.config.ts sets WEBAUTHN_ID / WEBAUTHN_ORIGINS
// for it) instead of the suite's 127.0.0.1.
const port = Number(process.env.E2E_PORT ?? 8765);
test.use({ baseURL: `http://localhost:${port}` });

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

async function virtualAuthenticator(page: Page) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
        options: {
            protocol: 'ctap2',
            transport: 'internal',
            hasResidentKey: true,
            hasUserVerification: true,
            isUserVerified: true,
            automaticPresenceSimulation: true,
        },
    });
    return { cdp, authenticatorId };
}

test('add a passkey, sign in with it, then remove it', async ({ page }) => {
    const errors = collectErrors(page);
    const { cdp, authenticatorId } = await virtualAuthenticator(page);

    await page.goto('/login');
    await page.locator('#email').fill('e2e@example.com');
    await page.locator('#password').fill('e2e-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/settings');
    await page.getByPlaceholder('e.g. YubiKey 5C, MacBook Touch ID').fill('E2E key');

    // Adding a passkey needs the current password (card 5529): a wrong one adds nothing.
    const passkeyPassword = page.getByLabel('Current password for the new passkey');
    await passkeyPassword.fill('not-the-password');
    await page.getByRole('button', { name: 'Add passkey' }).click();
    await expect(page.getByText('The password is incorrect.')).toBeVisible();
    expect((await cdp.send('WebAuthn.getCredentials', { authenticatorId })).credentials).toHaveLength(0);

    await passkeyPassword.fill('e2e-password');
    await page.getByRole('button', { name: 'Add passkey' }).click();
    await expect(page.getByText('E2E key')).toBeVisible();

    const { credentials } = await cdp.send('WebAuthn.getCredentials', { authenticatorId });
    expect(credentials).toHaveLength(1);

    // Sign out by dropping the session, then sign back in with the new passkey.
    await page.context().clearCookies();
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/settings');
    await expect(page.locator('input[type="email"]')).toHaveValue('e2e@example.com');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText('No passkeys yet.', { exact: false })).toBeVisible();

    // The removed passkey no longer signs in.
    await page.context().clearCookies();
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
    await expect(page.getByText('Passkey not recognized. It may have been removed from your account.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // The failed sign-in answers 422, which Chrome logs as a console error.
    expect(errors.filter((e) => !e.includes('422'))).toEqual([]);
});
