<?php

namespace Tests\Feature;

use App\Exceptions\AniListApiException;
use App\Exceptions\AniListRateLimitException;
use App\Jobs\ProcessMalImport;
use App\Jobs\SearchAniListForQuery;
use App\Models\Anime;
use App\Models\User;
use App\Services\AniListClient;
use App\Support\SearchCache;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Tests\TestCase;

/**
 * Card 5707: a search that finds nothing locally answers from local data and
 * queues the AniList lookup, instead of calling AniList inside the request.
 */
class SearchAniListFallbackTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    protected function setUp(): void
    {
        parent::setUp();

        Redis::shouldReceive('rpush')->zeroOrMoreTimes();
    }

    public function test_a_miss_answers_at_once_and_queues_one_lookup(): void
    {
        Queue::fake();
        // AniList is never called inside the request, however slow it is.
        $client = Mockery::mock(AniListClient::class);
        $client->shouldNotReceive('query');
        $client->shouldNotReceive('interactive');
        $this->instance(AniListClient::class, $client);

        $started = microtime(true);
        $this->getJson('/api/search?q=zzqxvbw')
            ->assertOk()
            ->assertJsonPath('total', 0)
            ->assertJsonPath('data', [])
            ->assertJsonPath('pending', true);
        $this->assertLessThan(1.0, microtime(true) - $started);

        Queue::assertPushedOn('import', SearchAniListForQuery::class, fn ($job) => $job->query === 'zzqxvbw');

        // The repeat within 10 minutes is a cache hit and queues nothing new;
        // the normalised form shares the entry.
        $this->getJson('/api/search?q=ZZQXVBW')->assertOk()->assertJsonPath('total', 0);
        Queue::assertPushed(SearchAniListForQuery::class, 1);
    }

    public function test_the_miss_is_cached_for_ten_minutes(): void
    {
        Queue::fake();

        $this->getJson('/api/search?q=nothing+here')->assertOk();

        $this->assertSame(['data' => [], 'total' => 0, 'source' => 'local'], Cache::get(SearchCache::resultKey('nothing here')));

        // After the lookup window a new miss may queue another lookup.
        $this->travel(SearchCache::LOOKUP_TTL + 1)->seconds();
        $this->getJson('/api/search?q=nothing+here')->assertOk();
        Queue::assertPushed(SearchAniListForQuery::class, 2);
    }

    public function test_the_lookup_stores_what_it_finds_and_the_next_search_shows_it(): void
    {
        Queue::fake();
        $this->getJson('/api/search?q=frierenz')->assertOk()->assertJsonPath('total', 0)->assertJsonPath('pending', true);

        $this->fakeAniList([$this->media(9001, 'Frierenz the Test')]);
        app()->call([new SearchAniListForQuery('frierenz'), 'handle']);

        $this->assertDatabaseHas('anime', ['anilist_id' => 9001]);
        $this->assertNotNull(Anime::where('anilist_id', 9001)->value('slug'));

        $this->getJson('/api/search?q=frierenz')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.title_romaji', 'Frierenz the Test')
            ->assertJsonPath('pending', false);
    }

    public function test_an_adult_only_result_keeps_the_cached_miss(): void
    {
        Queue::fake();
        $this->getJson('/api/search?q=adultonly')->assertOk();

        $this->fakeAniList([$this->media(9002, 'Adultonly Show', isAdult: true)]);
        app()->call([new SearchAniListForQuery('adultonly'), 'handle']);

        $this->assertTrue(Cache::has(SearchCache::resultKey('adultonly')));
        $this->getJson('/api/search?q=adultonly')
            ->assertOk()
            ->assertJsonPath('total', 0)
            ->assertJsonPath('pending', false);
        Queue::assertPushed(SearchAniListForQuery::class, 1);
    }

    public function test_the_lookup_releases_itself_instead_of_sleeping_on_a_rate_limit(): void
    {
        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('interactive')->andReturnSelf();
        $client->shouldReceive('query')->andThrow(new AniListRateLimitException(retryAfter: 40));
        $this->instance(AniListClient::class, $client);

        $job = (new SearchAniListForQuery('busy'))->withFakeQueueInteractions();
        $started = microtime(true);
        app()->call([$job, 'handle']);

        $this->assertLessThan(1.0, microtime(true) - $started);
        $job->assertReleased(40);
    }

    public function test_a_real_client_with_an_empty_bucket_or_a_429_does_not_sleep(): void
    {
        // Bucket empty: the Lua script answers "wait 30 s".
        Redis::shouldReceive('eval')->andReturn('30');
        $client = $this->realClient([]);

        $started = microtime(true);
        try {
            $client->interactive()->query('query { Viewer { id } }');
            $this->fail('Expected AniListRateLimitException');
        } catch (AniListRateLimitException $e) {
            $this->assertSame(30, $e->retryAfter);
        }
        $this->assertLessThan(1.0, microtime(true) - $started);
    }

    public function test_the_interactive_client_gives_up_at_once_on_a_429_or_5xx_and_sets_a_short_timeout(): void
    {
        Redis::shouldReceive('eval')->andReturn('0');
        $handler = new MockHandler([
            new Response(429, [], '{"errors":[{"message":"Too Many Requests."}]}'),
            new Response(502, [], 'bad gateway'),
        ]);
        $client = new AniListClient(
            http: new Client(['handler' => HandlerStack::create($handler), 'base_uri' => 'https://graphql.anilist.co']),
            requestsPerMinute: 85, maxRetries: 3, backoffBase: 5, rateLimitBackoff: 60,
            serviceUnavailableBackoff: 900, storeRawResponses: false,
        );
        $fast = $client->interactive();

        $started = microtime(true);
        try {
            $fast->query('query { Viewer { id } }');
            $this->fail('Expected AniListRateLimitException');
        } catch (AniListRateLimitException) {
        }
        $this->assertSame(AniListClient::INTERACTIVE_TIMEOUT, $handler->getLastOptions()['timeout']);

        $this->expectException(AniListApiException::class);
        try {
            $fast->query('query { Viewer { id } }');
        } finally {
            // No 60 s / 5 s backoff sleeps and no retries.
            $this->assertLessThan(1.0, microtime(true) - $started);
            $this->assertSame(0, $handler->count());
            $this->assertFalse($client->isInteractive());
        }
    }

    public function test_an_on_demand_title_fetch_does_not_wait_for_a_rate_limit_token(): void
    {
        Redis::shouldReceive('eval')->andReturn('45');
        $this->instance(AniListClient::class, $this->realClient([]));

        $started = microtime(true);
        $this->get('/anime/al/123456')
            ->assertRedirect(route('home'))
            ->assertSessionHas('flash.type', 'error');
        $this->assertLessThan(1.0, microtime(true) - $started);
    }

    public function test_a_small_import_with_unknown_titles_is_queued(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        Anime::factory()->create(['mal_id' => 1]);
        Cache::put("mal_import:{$user->id}:tok", [
            $this->entry(1),
            $this->entry(999_999),
        ], 3600);

        $this->actingAs($user)
            ->postJson('/import/confirm', ['token' => 'tok'])
            ->assertOk()
            ->assertJsonPath('status', 'pending');

        Queue::assertPushed(ProcessMalImport::class);
    }

    public function test_a_small_import_of_known_titles_still_runs_at_once(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        Anime::factory()->create(['mal_id' => 1]);
        Anime::factory()->create(['mal_id' => 2]);
        Cache::put("mal_import:{$user->id}:tok", [$this->entry(1), $this->entry(2)], 3600);

        $this->actingAs($user)
            ->postJson('/import/confirm', ['token' => 'tok'])
            ->assertOk()
            ->assertJsonPath('status', 'done')
            ->assertJsonPath('result.imported', 2);

        Queue::assertNotPushed(ProcessMalImport::class);
        $this->assertSame(2, $user->animeList()->count());
    }

    /** @return array<string, mixed> */
    private function entry(int $malId): array
    {
        return [
            'mal_id' => $malId,
            'title' => "MAL {$malId}",
            'status' => 'watching',
            'score' => 0,
            'progress' => 1,
            'started_at' => null,
            'completed_at' => null,
        ];
    }

    private function fakeAniList(array $media): void
    {
        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('interactive')->andReturnSelf();
        $client->shouldReceive('query')->once()->andReturn([
            'Page' => [
                'pageInfo' => ['hasNextPage' => false, 'currentPage' => 1, 'lastPage' => 1, 'total' => count($media)],
                'media' => $media,
            ],
        ]);
        $client->shouldReceive('storeRawResponse')->zeroOrMoreTimes();
        $this->instance(AniListClient::class, $client);
    }

    private function realClient(array $responses): AniListClient
    {
        return new AniListClient(
            http: new Client(['handler' => HandlerStack::create(new MockHandler($responses)), 'base_uri' => 'https://graphql.anilist.co']),
            requestsPerMinute: 85,
            maxRetries: 3,
            backoffBase: 5,
            rateLimitBackoff: 60,
            serviceUnavailableBackoff: 900,
            storeRawResponses: false,
        );
    }

    /** @return array<string, mixed> */
    private function media(int $id, string $title, bool $isAdult = false): array
    {
        return [
            'id' => $id,
            'idMal' => null,
            'title' => ['romaji' => $title, 'english' => null, 'native' => null],
            'synonyms' => [],
            'format' => 'TV',
            'status' => 'FINISHED',
            'season' => null,
            'seasonYear' => null,
            'source' => null,
            'episodes' => 12,
            'duration' => 24,
            'startDate' => null,
            'endDate' => null,
            'description' => null,
            'coverImage' => ['large' => null, 'medium' => null, 'color' => null],
            'bannerImage' => null,
            'trailer' => null,
            'averageScore' => null,
            'meanScore' => null,
            'popularity' => 100,
            'trending' => null,
            'favourites' => null,
            'isAdult' => $isAdult,
            'updatedAt' => null,
            'genres' => [],
            'studios' => ['edges' => []],
            'relations' => ['edges' => []],
            'externalLinks' => [],
            'nextAiringEpisode' => null,
            'streamingEpisodes' => [],
            'airingSchedule' => ['nodes' => []],
            'characters' => ['edges' => []],
            'recommendations' => ['edges' => []],
        ];
    }
}
