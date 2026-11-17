<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Card 4533: laragear/webauthn's credential table. Its usable rows were copied
 * to `passkeys` by card 4237's migration, and passkey sign-in has been
 * confirmed on production since, so the old table goes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('webauthn_credentials');
    }

    public function down(): void
    {
        // The rows are gone and nothing reads the table any more, so there is
        // nothing to bring back.
    }
};
