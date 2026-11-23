<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

/**
 * Card 5717: /people sorted every person by a correlated COUNT over
 * character_voice_actor (and ran an EXISTS over it again for the page
 * count): ~0.9 s live. A stored count, refreshed hourly by
 * people:refresh-role-counts, makes it an index range scan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('people', function (Blueprint $table) {
            $table->unsignedInteger('role_count')->default(0)->after('site_url');
            $table->index(['role_count', 'name_full'], 'people_role_count_name_index');
        });

        // Fill it now, so /people isn't empty until the first scheduled run.
        Artisan::call('people:refresh-role-counts');
    }

    public function down(): void
    {
        Schema::table('people', function (Blueprint $table) {
            $table->dropIndex('people_role_count_name_index');
            $table->dropColumn('role_count');
        });
    }
};
