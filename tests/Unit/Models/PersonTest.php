<?php

namespace Tests\Unit\Models;

use App\Models\Person;
use Carbon\CarbonInterface;
use Tests\TestCase;

class PersonTest extends TestCase
{
    public function test_it_uses_slug_as_route_key_name(): void
    {
        $this->assertSame('slug', (new Person)->getRouteKeyName());
    }

    public function test_it_generates_slug_from_name_full_on_create(): void
    {
        $person = Person::factory()->create(['name_full' => 'Yuki Kaji']);

        $this->assertSame('yuki-kaji', $person->slug);
    }

    public function test_it_generates_unique_slugs_on_collision(): void
    {
        Person::factory()->create(['name_full' => 'Same Name']);
        $second = Person::factory()->create(['name_full' => 'Same Name']);

        $this->assertSame('same-name-2', $second->slug);
    }

    public function test_it_casts_birthdate_to_date(): void
    {
        $person = Person::factory()->create(['birthdate' => '1990-01-15']);

        $this->assertInstanceOf(CarbonInterface::class, $person->birthdate);
        $this->assertSame('1990-01-15', $person->birthdate->toDateString());
    }
}
