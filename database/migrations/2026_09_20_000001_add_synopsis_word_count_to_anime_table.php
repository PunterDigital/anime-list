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
            $table->unsignedInteger('synopsis_word_count')->default(0)->after('synopsis');
            $table->index('synopsis_word_count');
        });

        // Backfill from the existing synopsis text. Group rows by their
        // computed count so each distinct value is written with one UPDATE.
        DB::table('anime')
            ->select(['id', 'synopsis'])
            ->orderBy('id')
            ->chunkById(500, function ($rows) {
                $idsByCount = [];
                foreach ($rows as $row) {
                    $idsByCount[Anime::countSynopsisWords($row->synopsis)][] = $row->id;
                }

                foreach ($idsByCount as $count => $ids) {
                    if ($count === 0) {
                        continue; // already the column default
                    }

                    DB::table('anime')->whereIn('id', $ids)->update(['synopsis_word_count' => $count]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('anime', function (Blueprint $table) {
            $table->dropIndex(['synopsis_word_count']);
            $table->dropColumn('synopsis_word_count');
        });
    }
};
