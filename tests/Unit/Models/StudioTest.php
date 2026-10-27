<?php

namespace Tests\Unit\Models;

use App\Models\Anime;
use App\Models\Studio;
use Tests\TestCase;

class StudioTest extends TestCase
{
    public function test_it_uses_slug_as_route_key_name(): void
    {
        $this->assertSame('slug', (new Studio)->getRouteKeyName());
    }

    public function test_it_generates_slug_from_name_on_create(): void
    {
        $studio = Studio::factory()->create(['name' => 'Studio Ghibli']);

        $this->assertSame('studio-ghibli', $studio->slug);
    }

    public function test_it_generates_unique_slugs_on_collision(): void
    {
        Studio::factory()->create(['name' => 'MAPPA']);
        $second = Studio::factory()->create(['name' => 'MAPPA']);

        $this->assertSame('mappa-2', $second->slug);
    }

    public function test_it_regenerates_slug_when_name_changes(): void
    {
        $studio = Studio::factory()->create(['name' => 'Old Name']);

        $studio->update(['name' => 'New Name']);

        $this->assertSame('new-name', $studio->slug);
    }

    public function test_anime_relation_exposes_is_main_pivot(): void
    {
        $studio = Studio::factory()->create();
        $anime = Anime::factory()->create();
        $studio->anime()->attach($anime->id, ['is_main' => true]);

        $this->assertTrue((bool) $studio->anime->first()->pivot->is_main);
    }
}
