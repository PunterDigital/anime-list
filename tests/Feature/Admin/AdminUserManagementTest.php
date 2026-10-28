<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    public function test_admin_can_toggle_admin_flag_on_another_user(): void
    {
        $this->actingAsAdmin();
        $target = User::factory()->create(['is_admin' => false]);

        $this->patch("/admin/users/{$target->id}/toggle-admin")->assertRedirect();

        $this->assertTrue($target->fresh()->is_admin);

        $this->patch("/admin/users/{$target->id}/toggle-admin")->assertRedirect();
        $this->assertFalse($target->fresh()->is_admin);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = $this->actingAsAdmin();

        $this->delete("/admin/users/{$admin->id}")->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'deleted_at' => null]);
    }

    public function test_admin_can_delete_another_user(): void
    {
        $this->actingAsAdmin();
        $target = User::factory()->create();

        $this->delete("/admin/users/{$target->id}")->assertRedirect();

        $this->assertSoftDeleted('users', ['id' => $target->id]);
    }

    public function test_admin_user_listing_filters_by_search(): void
    {
        $this->actingAsAdmin();
        User::factory()->create(['username' => 'alice_target']);
        User::factory()->create(['username' => 'bob_other']);

        $response = $this->get('/admin/users?search=alice');

        $response->assertOk();
        $response->assertSee('alice_target');
        $response->assertDontSee('bob_other');
    }

    public function test_admin_user_search_returns_matching_users(): void
    {
        // The search also matches email, and factory names/emails are random
        // ("Natalia", "kalista@..."), so every user that must not match gets fixed values.
        $this->actingAsAdmin(['username' => 'staff_admin', 'name' => 'Staff Admin', 'email' => 'staff@example.com']);
        User::factory()->create(['username' => 'alice_alpha', 'name' => 'Alice Alpha']);
        User::factory()->create(['username' => 'alicia_beta', 'name' => 'Alicia Beta']);
        User::factory()->create(['username' => 'bob_other', 'name' => 'Bob Other', 'email' => 'bob@example.com']);

        $response = $this->getJson('/admin/users/search?q=ali');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonFragment(['username' => 'alice_alpha']);
        $response->assertJsonFragment(['username' => 'alicia_beta']);
        $response->assertJsonMissing(['username' => 'bob_other']);
    }

    public function test_admin_user_search_matches_display_name(): void
    {
        $this->actingAsAdmin();
        User::factory()->create(['username' => 'target_user', 'name' => 'Zelda Hero']);

        $response = $this->getJson('/admin/users/search?q=zelda');

        $response->assertOk();
        $response->assertJsonFragment(['username' => 'target_user']);
    }

    public function test_admin_user_search_returns_empty_for_blank_query(): void
    {
        $this->actingAsAdmin();
        User::factory()->count(3)->create();

        $this->getJson('/admin/users/search?q=')->assertOk()->assertExactJson(['data' => []]);
        $this->getJson('/admin/users/search')->assertOk()->assertExactJson(['data' => []]);
    }

    public function test_admin_user_search_limits_results(): void
    {
        $this->actingAsAdmin();
        User::factory()->count(12)->create(['name' => 'Common Name']);

        $response = $this->getJson('/admin/users/search?q=Common');

        $response->assertOk();
        $this->assertCount(10, $response->json('data'));
    }

    public function test_non_admin_cannot_use_user_search(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/admin/users/search?q=a')
            ->assertForbidden();
    }
}
