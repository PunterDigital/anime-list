<?php

namespace Tests\Feature\Api\V1;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use Illuminate\Support\Facades\Hash;
use Laravel\Pennant\Feature;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Disable Scout indexing during tests — Anime uses the Searchable trait
        // and tests create records without a running Scout engine.
        config()->set('scout.driver', 'null');
    }

    private function enabledUser(): User
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret1234'),
        ]);

        Feature::for($user)->activate('public-api');

        return $user;
    }

    public function test_token_issuance_rejects_bad_credentials(): void
    {
        User::factory()->create([
            'email' => 'alice@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        $this->postJson('/api/v1/auth/token', [
            'email' => 'alice@example.com',
            'password' => 'wrong',
            'device_name' => 'Chrome Extension',
        ])->assertStatus(422);
    }

    public function test_token_issuance_rejects_users_without_feature_flag(): void
    {
        User::factory()->create([
            'email' => 'bob@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        $this->postJson('/api/v1/auth/token', [
            'email' => 'bob@example.com',
            'password' => 'correct-password',
            'device_name' => 'Chrome Extension',
        ])->assertStatus(403);
    }

    public function test_token_issuance_returns_plain_text_token_for_enabled_users(): void
    {
        $user = $this->enabledUser();

        $response = $this->postJson('/api/v1/auth/token', [
            'email' => $user->email,
            'password' => 'secret1234',
            'device_name' => 'Chrome Extension',
        ])->assertCreated();

        $response->assertJsonStructure(['token', 'token_id', 'device_name', 'user' => ['id', 'email']]);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_endpoints_require_bearer_token(): void
    {
        $this->getJson('/api/v1/user')->assertStatus(401);
        $this->getJson('/api/v1/list')->assertStatus(401);
        $this->getJson('/api/v1/anime/search?q=naruto')->assertStatus(401);
    }

    /**
     * Card 5528: /api/v1 skips CSRF, so a signed-in session cookie alone must not count.
     */
    public function test_a_signed_in_session_without_a_token_is_refused(): void
    {
        $user = $this->enabledUser();
        $anime = Anime::factory()->create();
        $entry = UserAnimeList::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('Chrome Extension')->accessToken;

        $this->actingAs($user)->getJson('/api/v1/user')->assertStatus(401);
        $this->actingAs($user)->postJson('/api/v1/list', ['anime_id' => $anime->id, 'status' => 'watching'])->assertStatus(401);
        $this->actingAs($user)->deleteJson("/api/v1/list/{$entry->id}")->assertStatus(401);
        $this->actingAs($user)->deleteJson("/api/v1/auth/tokens/{$token->id}")->assertStatus(401);

        $this->assertSame(0, UserAnimeList::query()->where('anime_id', $anime->id)->count());
        $this->assertModelExists($entry);
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_endpoints_require_feature_flag_even_with_valid_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('integration')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/user')
            ->assertStatus(403);
    }

    public function test_authenticated_user_can_fetch_their_profile(): void
    {
        $user = $this->enabledUser();
        $token = $user->createToken('integration')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/user')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', $user->email);
    }

    public function test_search_returns_matching_anime(): void
    {
        $user = $this->enabledUser();
        $token = $user->createToken('integration')->plainTextToken;

        Anime::factory()->create(['title_romaji' => 'Naruto Shippuden']);
        Anime::factory()->create(['title_romaji' => 'One Piece']);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/anime/search?q=naruto')
            ->assertOk();

        $response->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.title_romaji', 'Naruto Shippuden');
    }

    public function test_anime_lookup_by_anilist_id(): void
    {
        $user = $this->enabledUser();
        $token = $user->createToken('integration')->plainTextToken;

        $anime = Anime::factory()->create(['anilist_id' => 4242]);

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/anime/anilist/4242')
            ->assertOk()
            ->assertJsonPath('id', $anime->id)
            ->assertJsonPath('anilist_id', 4242);

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/anime/anilist/9999')
            ->assertNotFound();
    }

    public function test_list_crud_lifecycle(): void
    {
        $user = $this->enabledUser();
        $token = $user->createToken('integration')->plainTextToken;
        $anime = Anime::factory()->create(['episodes' => 12]);

        // Empty list
        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/list')
            ->assertOk()
            ->assertJsonPath('total', 0);

        // Add an entry
        $create = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/list', [
                'anime_id' => $anime->id,
                'status' => UserAnimeList::STATUS_WATCHING,
                'progress' => 3,
            ])
            ->assertCreated()
            ->assertJsonPath('status', 'watching');

        $entryId = $create->json('id');

        // Show by anime
        $this->withHeader('Authorization', "Bearer $token")
            ->getJson("/api/v1/list/anime/{$anime->id}")
            ->assertOk()
            ->assertJsonPath('id', $entryId);

        // Update — bumping progress to the last episode should auto-complete
        $this->withHeader('Authorization', "Bearer $token")
            ->patchJson("/api/v1/list/{$entryId}", [
                'progress' => 12,
            ])
            ->assertOk()
            ->assertJsonPath('status', UserAnimeList::STATUS_COMPLETED);

        // Delete
        $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson("/api/v1/list/{$entryId}")
            ->assertStatus(204);

        $this->assertSoftDeleted('user_anime_lists', ['id' => $entryId]);
    }

    public function test_users_cannot_mutate_entries_they_do_not_own(): void
    {
        $owner = $this->enabledUser();
        $intruder = $this->enabledUser();

        $anime = Anime::factory()->create();
        $entry = UserAnimeList::create([
            'user_id' => $owner->id,
            'anime_id' => $anime->id,
            'status' => UserAnimeList::STATUS_WATCHING,
        ]);

        $token = $intruder->createToken('integration')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->patchJson("/api/v1/list/{$entry->id}", ['status' => UserAnimeList::STATUS_DROPPED])
            ->assertStatus(403);

        $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson("/api/v1/list/{$entry->id}")
            ->assertStatus(403);
    }

    public function test_token_revocation_invalidates_the_bearer_token(): void
    {
        $user = $this->enabledUser();
        $token = $user->createToken('integration')->plainTextToken;

        $this->assertSame(1, $user->tokens()->count());

        $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson('/api/v1/auth/token')
            ->assertStatus(204);

        $this->assertSame(0, $user->tokens()->count());
    }
}
