<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('anime', function (Blueprint $table) {
            // Set when an admin takes a title page down, for example after a
            // copyright takedown request. A hidden page returns 451 and is
            // left out of every public listing, search and the sitemap.
            $table->timestamp('hidden_at')->nullable()->after('refresh_exclusion_reason');
            $table->text('hidden_reason')->nullable()->after('hidden_at');

            $table->index('hidden_at');
        });
    }

    public function down(): void
    {
        Schema::table('anime', function (Blueprint $table) {
            $table->dropIndex(['hidden_at']);
            $table->dropColumn(['hidden_at', 'hidden_reason']);
        });
    }
};
