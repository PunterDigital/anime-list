<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('anime', function (Blueprint $table) {
            // Set when an admin marks a title NSFW that AniList does not flag
            // as adult (card 4198). Its own column, so an AniList refresh
            // (which writes is_adult) never clears it. An NSFW title is left
            // out of search and listings, and guests get a sign-in page.
            $table->timestamp('nsfw_at')->nullable()->after('hidden_reason');

            $table->index('nsfw_at');
        });
    }

    public function down(): void
    {
        Schema::table('anime', function (Blueprint $table) {
            $table->dropIndex(['nsfw_at']);
            $table->dropColumn('nsfw_at');
        });
    }
};
