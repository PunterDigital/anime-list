<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Stores each person's voice-acting role count on listable anime (not adult,
 * not NSFW, not hidden) in people.role_count, for the /people index
 * (card 5717). Runs hourly; a title an admin hides drops out of the counts
 * on the next run (the person pages count live).
 */
class RefreshPersonRoleCounts extends Command
{
    protected $signature = 'people:refresh-role-counts {--chunk=5000 : People per UPDATE}';

    protected $description = 'Recount voice-acting roles per person (listable anime only) into people.role_count';

    public function handle(): int
    {
        $chunk = max(100, (int) $this->option('chunk'));
        $maxId = (int) DB::table('people')->max('id');

        // Ranges of ids keep each UPDATE short, so the table isn't locked for
        // the whole recount.
        $updated = 0;
        for ($from = 1; $from <= $maxId; $from += $chunk) {
            $updated += DB::table('people')
                ->whereBetween('id', [$from, $from + $chunk - 1])
                ->update([
                    'role_count' => DB::raw(
                        '(SELECT COUNT(*) FROM character_voice_actor'
                        .' INNER JOIN anime ON anime.id = character_voice_actor.anime_id'
                        .' WHERE character_voice_actor.person_id = people.id'
                        .' AND anime.is_adult = 0 AND anime.nsfw_at IS NULL AND anime.hidden_at IS NULL)'
                    ),
                ]);
        }

        $this->info("Recounted roles for {$updated} people.");

        return self::SUCCESS;
    }
}
