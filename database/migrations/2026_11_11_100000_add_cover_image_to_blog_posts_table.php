<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Card 4480: a cover image per post, also its Open Graph / Twitter
        // image. Holds a `public` disk path (`blog/2026/11/...`).
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->string('cover_image', 255)->nullable()->after('excerpt');
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn('cover_image');
        });
    }
};
