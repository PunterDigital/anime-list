<?php

use App\Support\LegacyPasskeys;
use Illuminate\Database\Migrations\Migration;

/**
 * Card 4237: copy laragear/webauthn passkeys into laravel/passkeys' table, so
 * existing passkeys keep working. Rows that can't be converted are logged and
 * printed; those users sign in with their password and add a new passkey.
 */
return new class extends Migration
{
    public function up(): void
    {
        $result = LegacyPasskeys::copyAll();

        if (app()->runningInConsole() && ($result['copied'] > 0 || $result['skipped'] !== [])) {
            fwrite(STDOUT, "  Passkeys copied from webauthn_credentials: {$result['copied']}\n");

            foreach ($result['skipped'] as $reason) {
                fwrite(STDOUT, "  Passkey skipped: {$reason}\n");
            }
        }
    }

    public function down(): void
    {
        // The source table is untouched, so there is nothing to undo here:
        // rolling back the passkeys table migration drops the copies.
    }
};
