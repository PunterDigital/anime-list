<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\FeatureFlagService;
use Tests\TestCase;

class FeatureFlagServiceTest extends TestCase
{
    private FeatureFlagService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new FeatureFlagService;
    }

    public function test_it_returns_false_by_default_when_no_overrides_exist(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($this->service->active('playlists', $user));
        $this->assertFalse($this->service->active('playlists', null));
    }

    public function test_global_everyone_override_activates_flag_for_all(): void
    {
        $this->service->setGlobalStatus('playlists', 'everyone');

        $user = User::factory()->create();

        $this->assertTrue($this->service->active('playlists', $user));
        $this->assertTrue($this->service->active('playlists', null));
    }

    public function test_global_nobody_override_deactivates_flag_for_all(): void
    {
        $this->service->setGlobalStatus('playlists', 'nobody');

        $user = User::factory()->create();

        $this->assertFalse($this->service->active('playlists', $user));
    }

    public function test_setting_global_status_to_default_removes_global_record(): void
    {
        $this->service->setGlobalStatus('playlists', 'everyone');
        $this->service->setGlobalStatus('playlists', 'default');

        $this->assertFalse($this->service->active('playlists', null));
    }

    public function test_activating_a_flag_for_a_user_overrides_default(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $this->service->activateForUser('playlists', $alice);

        $this->assertTrue($this->service->active('playlists', $alice));
        $this->assertFalse($this->service->active('playlists', $bob));
    }

    public function test_user_override_beats_global_nobody_override(): void
    {
        $this->service->setGlobalStatus('playlists', 'nobody');

        $user = User::factory()->create();
        $this->service->activateForUser('playlists', $user);

        $this->assertTrue($this->service->active('playlists', $user));
    }

    public function test_forget_for_user_restores_default_resolution(): void
    {
        $user = User::factory()->create();

        $this->service->activateForUser('playlists', $user);
        $this->assertTrue($this->service->active('playlists', $user));

        $this->service->forgetForUser('playlists', $user);
        $this->assertFalse($this->service->active('playlists', $user));
    }

    public function test_setting_global_everyone_wipes_user_specific_overrides(): void
    {
        $user = User::factory()->create();
        $this->service->activateForUser('playlists', $user);

        $this->service->setGlobalStatus('playlists', 'nobody');

        // Once global is set, all user overrides are cleared; global nobody applies.
        $this->assertFalse($this->service->active('playlists', $user));
    }

    public function test_all_for_user_returns_resolved_state_for_every_defined_flag(): void
    {
        $user = User::factory()->create();
        $this->service->activateForUser('playlists', $user);

        $all = $this->service->allForUser($user);

        $this->assertArrayHasKey('playlists', $all);
        $this->assertArrayHasKey('studio-pages', $all);
        $this->assertArrayHasKey('voice-actor-pages', $all);
        $this->assertTrue($all['playlists']);
        $this->assertFalse($all['studio-pages']);
    }
}
