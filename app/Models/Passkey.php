<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Passkeys\Passkey as BasePasskey;

/**
 * laravel/passkeys' model (card 4237), registered in AppServiceProvider. Users
 * are soft-deleted, and the package's relation would then return null: its
 * PasskeyVerified event needs a user, so a deleted account's passkey turned
 * sign-in into a 500. The relation includes deleted users and
 * `PasskeyController` refuses them.
 */
class Passkey extends BasePasskey
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')->withTrashed();
    }
}
