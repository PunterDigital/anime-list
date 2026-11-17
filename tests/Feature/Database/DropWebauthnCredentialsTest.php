<?php

namespace Tests\Feature\Database;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Card 4533: laragear/webauthn's table is dropped once its passkeys live in
 * `passkeys`.
 */
class DropWebauthnCredentialsTest extends TestCase
{
    public function test_a_fresh_database_has_no_webauthn_credentials_table(): void
    {
        $this->assertFalse(Schema::hasTable('webauthn_credentials'));
        $this->assertTrue(Schema::hasTable('passkeys'));
    }

    public function test_the_migration_drops_the_table_production_still_has(): void
    {
        Schema::create('webauthn_credentials', function (Blueprint $table) {
            $table->string('id', 510)->primary();
            $table->text('public_key');
        });
        DB::table('webauthn_credentials')->insert(['id' => 'old', 'public_key' => 'pem']);

        $migration = require database_path('migrations/2026_11_17_120000_drop_webauthn_credentials_table.php');
        $migration->up();

        $this->assertFalse(Schema::hasTable('webauthn_credentials'));
    }
}
