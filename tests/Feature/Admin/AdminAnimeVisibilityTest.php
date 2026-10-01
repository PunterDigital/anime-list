<?php

namespace Tests\Feature\Admin;

use App\Models\Anime;
use Tests\TestCase;

class AdminAnimeVisibilityTest extends TestCase
{
    public function test_admin_can_hide_a_page_with_a_reason(): void
    {
        $this->actingAsAdmin();
        $anime = Anime::factory()->create();

        $this->patch("/admin/anime/{$anime->id}/visibility", [
            'shown' => false,
            'hidden_reason' => 'DMCA takedown request',
        ])->assertRedirect(route('admin.anime.edit', $anime));

        $anime->refresh();
        $this->assertTrue($anime->isHidden());
        $this->assertSame('DMCA takedown request', $anime->hidden_reason);
    }

    public function test_hiding_a_page_needs_a_reason(): void
    {
        $this->actingAsAdmin();
        $anime = Anime::factory()->create();

        $this->patch("/admin/anime/{$anime->id}/visibility", ['shown' => false])
            ->assertSessionHasErrors('hidden_reason');

        $this->assertFalse($anime->fresh()->isHidden());
    }

    public function test_admin_can_show_a_hidden_page_again(): void
    {
        $this->actingAsAdmin();
        $anime = Anime::factory()->create(['hidden_at' => now(), 'hidden_reason' => 'Takedown']);

        $this->patch("/admin/anime/{$anime->id}/visibility", ['shown' => true])->assertRedirect();

        $anime->refresh();
        $this->assertFalse($anime->isHidden());
        $this->assertNull($anime->hidden_reason);
    }

    public function test_hidden_page_returns_451(): void
    {
        $anime = Anime::factory()->create(['hidden_at' => now(), 'hidden_reason' => 'Takedown']);

        $this->get("/anime/{$anime->slug}")->assertStatus(451);
    }

    public function test_hidden_anime_is_left_out_of_the_visible_scope(): void
    {
        $shown = Anime::factory()->create();
        Anime::factory()->create(['hidden_at' => now()]);

        $this->assertSame([$shown->id], Anime::query()->visible()->pluck('id')->all());
    }
}
