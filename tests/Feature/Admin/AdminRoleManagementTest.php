<?php

namespace Tests\Feature\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AdminRoleManagementTest extends TestCase
{
    public function test_admin_can_view_roles_page(): void
    {
        $this->actingAsAdmin();

        $this->get('/admin/roles')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/RolesPage')
                ->has('roles', 2)
            );
    }

    public function test_non_admin_cannot_view_roles_page(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/admin/roles')->assertForbidden();
    }

    public function test_admin_can_assign_a_role_to_a_user(): void
    {
        $this->actingAsAdmin();
        $target = User::factory()->create(['username' => 'content_editor']);

        $this->postJson('/admin/roles/content-manager/users', ['username' => 'content_editor'])
            ->assertOk()
            ->assertJsonPath('username', 'content_editor');

        $this->assertTrue($target->fresh()->hasRole(Role::CONTENT_MANAGER));
    }

    public function test_assigning_the_same_role_twice_does_not_duplicate(): void
    {
        $this->actingAsAdmin();
        $target = User::factory()->create(['username' => 'content_editor']);

        $this->postJson('/admin/roles/content-manager/users', ['username' => 'content_editor'])->assertOk();
        $this->postJson('/admin/roles/content-manager/users', ['username' => 'content_editor'])->assertOk();

        $this->assertSame(1, $target->fresh()->roles()->count());
    }

    public function test_admin_cannot_assign_role_to_unknown_username(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/admin/roles/content-manager/users', ['username' => 'ghost'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('username');
    }

    public function test_admin_can_remove_a_role_from_a_user(): void
    {
        $this->actingAsAdmin();
        $target = User::factory()->create();
        $role = Role::where('slug', Role::CONTENT_MANAGER)->first();
        $role->users()->attach($target->id);

        $this->deleteJson("/admin/roles/content-manager/users/{$target->id}")
            ->assertOk();

        $this->assertFalse($target->fresh()->hasRole(Role::CONTENT_MANAGER));
    }

    public function test_non_admin_cannot_assign_roles(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $target = User::factory()->create(['username' => 'someone']);

        $this->actingAs($user)
            ->postJson('/admin/roles/content-manager/users', ['username' => 'someone'])
            ->assertForbidden();
    }

    public function test_role_middleware_allows_users_with_matching_role(): void
    {
        Route::middleware(['web', 'auth', 'role:content-manager'])
            ->get('/_test/roles-gate', fn () => response('ok'));

        $user = User::factory()->create();
        $role = Role::where('slug', Role::CONTENT_MANAGER)->first();
        $role->users()->attach($user->id);

        $this->actingAs($user)->get('/_test/roles-gate')->assertOk();
    }

    public function test_role_middleware_blocks_users_without_matching_role(): void
    {
        Route::middleware(['web', 'auth', 'role:owner'])
            ->get('/_test/roles-owner-gate', fn () => response('ok'));

        $user = User::factory()->create();

        $this->actingAs($user)->get('/_test/roles-owner-gate')->assertForbidden();
    }
}
