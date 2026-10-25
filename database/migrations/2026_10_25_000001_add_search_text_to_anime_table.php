<?php

use App\Models\Anime;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('anime', function (Blueprint $table) {
            // Every title folded to lower case with punctuation and accents
            // removed, so "komi cant communicate" finds "Komi Can't Communicate".
            $table->text('search_text')->nullable()->after('title_synonyms');
        });

        DB::table('anime')
            ->select(['id', 'title_romaji', 'title_english', 'title_native', 'title_synonyms'])
            ->orderBy('id')
            ->chunkById(500, function ($rows) {
                DB::transaction(function () use ($rows) {
                    foreach ($rows as $row) {
                        DB::table('anime')->where('id', $row->id)->update([
                            'search_text' => Anime::buildSearchText(
                                $row->title_romaji,
                                $row->title_english,
                                $row->title_native,
                                $row->title_synonyms,
                            ),
                        ]);
                    }
                });
            });
    }

    public function down(): void
    {
        Schema::table('anime', function (Blueprint $table) {
            $table->dropColumn('search_text');
        });
    }
};
