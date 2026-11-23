<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Card 5717: Anime::nextAiringEpisode is now a one-of-many (the earliest
 * future airing per anime), which groups airing_schedules by anime_id over
 * airs_at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('airing_schedules', function (Blueprint $table) {
            $table->index(['anime_id', 'airs_at'], 'airing_schedules_anime_airs_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('airing_schedules', function (Blueprint $table) {
            $table->dropIndex('airing_schedules_anime_airs_at_index');
        });
    }
};
