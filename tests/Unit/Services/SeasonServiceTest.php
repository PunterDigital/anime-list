<?php

namespace Tests\Unit\Services;

use App\Services\SeasonService;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class SeasonServiceTest extends TestCase
{
    private SeasonService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SeasonService;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_january_is_winter(): void
    {
        Carbon::setTestNow('2025-01-15 12:00:00');
        $this->assertSame(['year' => 2025, 'season' => 'WINTER'], $this->service->currentSeason());
    }

    public function test_april_is_spring(): void
    {
        Carbon::setTestNow('2025-04-05 00:00:00');
        $this->assertSame(['year' => 2025, 'season' => 'SPRING'], $this->service->currentSeason());
    }

    public function test_july_is_summer(): void
    {
        Carbon::setTestNow('2025-07-20 00:00:00');
        $this->assertSame(['year' => 2025, 'season' => 'SUMMER'], $this->service->currentSeason());
    }

    public function test_october_is_fall(): void
    {
        Carbon::setTestNow('2025-10-01 00:00:00');
        $this->assertSame(['year' => 2025, 'season' => 'FALL'], $this->service->currentSeason());
    }

    public function test_december_is_fall(): void
    {
        Carbon::setTestNow('2025-12-31 23:59:59');
        $this->assertSame(['year' => 2025, 'season' => 'FALL'], $this->service->currentSeason());
    }

    public function test_adjacent_seasons_in_same_year(): void
    {
        $this->assertSame(
            [
                'previous' => ['year' => 2025, 'season' => 'WINTER'],
                'next' => ['year' => 2025, 'season' => 'SUMMER'],
            ],
            $this->service->adjacentSeasons(2025, 'SPRING'),
        );
    }

    public function test_adjacent_seasons_crosses_year_boundary_backwards(): void
    {
        $this->assertSame(
            [
                'previous' => ['year' => 2024, 'season' => 'FALL'],
                'next' => ['year' => 2025, 'season' => 'SPRING'],
            ],
            $this->service->adjacentSeasons(2025, 'WINTER'),
        );
    }

    public function test_adjacent_seasons_crosses_year_boundary_forward(): void
    {
        $this->assertSame(
            [
                'previous' => ['year' => 2025, 'season' => 'SUMMER'],
                'next' => ['year' => 2026, 'season' => 'WINTER'],
            ],
            $this->service->adjacentSeasons(2025, 'FALL'),
        );
    }

    public function test_adjacent_seasons_rejects_invalid_season(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->adjacentSeasons(2025, 'MONSOON');
    }

    public function test_is_current_season_compares_year_and_season(): void
    {
        Carbon::setTestNow('2025-05-15 00:00:00');

        $this->assertTrue($this->service->isCurrentSeason(2025, 'SPRING'));
        $this->assertFalse($this->service->isCurrentSeason(2024, 'SPRING'));
        $this->assertFalse($this->service->isCurrentSeason(2025, 'FALL'));
    }

    public function test_format_order_is_stable(): void
    {
        $this->assertSame(
            ['TV', 'TV_SHORT', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'],
            $this->service->formatOrder(),
        );
    }
}
