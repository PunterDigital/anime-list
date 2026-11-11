import { expect, test, type Page } from '@playwright/test';

// Card 4237: passkeys on laravel/passkeys, driven with Chrome's CDP virtual
// authenticator. WebAuthn refuses an IP address as RP ID, so these tests use
// http://localhost (playwright.config.ts sets WEBAUTHN_ID / WEBAUTHN_ORIGINS
// for it) instead of the suite's 127.0.0.1.
const port = Number(process.env.E2E_PORT ?? 8765);
test.use({ baseURL: `http://localhost:${port}` });

// Seeded by database/seeders/E2ESeeder.php (seedLegacyPasskey): a laragear-era
// passkey copied to `passkeys` by App\Support\LegacyPasskeys. This is the
// private half of that throwaway test key (PKCS#8, P-256); it signs nothing
// outside this suite.
const LEGACY = {
    email: 'e2e-legacy-passkey@example.com',
    credentialId: '_JTjK-fK6TE2NI77Mj8BFUmBk4D18Sg97vlLV-cxxL0',
    // Laragear sent the UUID hex as user.id and SimpleWebAuthn base64url-decoded
    // it, so the authenticator holds base64url_decode('693d1b8f…').
    userHandleHex: '693d1b8f955849aabef1ab5395fd411e',
    privateKey:
        'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgT5qZnVRBAFNkDWX1wRxrvOnyJHIunOBx2RsY7N2sGq+hRANCAAQS8Oba9mVrwbRzx6wKtrbd7YTDasW6/KaCjCwvVrFTSBMDWK2r3tgx+CuuKweoTdNZcHu75jn2rE8BzrdpO4lZ',
};

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

/** Standard base64 (CDP's encoding for credential ids and user handles). */
const fromBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('base64');

test('a passkey from before the move to laravel/passkeys still signs in', async ({ page }) => {
    const errors = collectErrors(page);
    const { cdp, authenticatorId } = await virtualAuthenticator(page);
    await cdp.send('WebAuthn.addCredential', {
        authenticatorId,
        credential: {
            credentialId: fromBase64Url(LEGACY.credentialId),
            isResidentCredential: true,
            rpId: 'localhost',
            privateKey: LEGACY.privateKey,
            userHandle: fromBase64Url(LEGACY.userHandleHex),
            signCount: 0,
        },
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.locator('input[type="email"]')).toHaveValue(LEGACY.email);
    await expect(page.getByText('Old laptop')).toBeVisible();

    const { credentials } = await cdp.send('WebAuthn.getCredentials', { authenticatorId });
    expect(credentials[0].signCount).toBe(1);
    expect(errors).toEqual([]);
});

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
