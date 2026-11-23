<?php

namespace App\Console\Commands;

use App\Support\ApiTokenLifetime;
use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

class PruneUnusedApiTokens extends Command
{
    protected $signature = 'api-tokens:prune-unused';

    protected $description = 'Delete API tokens that have not been used for '.ApiTokenLifetime::INACTIVE_DAYS.' days (card 5529)';

    public function handle(): int
    {
        $deleted = ApiTokenLifetime::inactive(PersonalAccessToken::query())->delete();

        $this->info("Deleted {$deleted} unused API token(s).");

        return self::SUCCESS;
    }
}
