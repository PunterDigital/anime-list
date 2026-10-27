<?php

namespace Tests\Unit\Services;

use App\Exceptions\AniListApiException;
use App\Exceptions\AniListServiceUnavailableException;
use App\Services\AniListClient;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Tests\TestCase;

class AniListClientTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    protected function setUp(): void
    {
        parent::setUp();

        // The client's enforceRateLimit() relies on a Redis Lua script; stub it
        // out so the tests exercise only the request/response handling logic.
        Redis::shouldReceive('eval')->andReturn('0')->zeroOrMoreTimes();
    }

    public function test_403_response_throws_service_unavailable_and_trips_circuit_breaker(): void
    {
        $body = json_encode([
            'errors' => [[
                'message' => 'The AniList API has been temporarily disabled due to severe stability issues',
                'status' => 403,
            ]],
        ]);

        $client = $this->makeClient([
            new Response(403, [], $body),
        ]);

        try {
            $client->query('query { Viewer { id } }');
            $this->fail('Expected AniListServiceUnavailableException');
        } catch (AniListServiceUnavailableException $e) {
            $this->assertSame(403, $e->statusCode);
            $this->assertGreaterThan(0, $e->retryAfter);
            $this->assertStringContainsString('temporarily disabled', $e->getMessage());
        }

        // The circuit breaker should now be open.
        $this->assertGreaterThan(time(), (int) Cache::get('anilist:outage_until'));
    }

    public function test_circuit_breaker_short_circuits_subsequent_queries(): void
    {
        // Pre-open the breaker; Guzzle handler queue is intentionally empty so
        // the test fails loudly if a network request escapes the short-circuit.
        Cache::put('anilist:outage_until', time() + 600, 600);

        $client = $this->makeClient([]);

        $this->expectException(AniListServiceUnavailableException::class);
        $client->query('query { Viewer { id } }');
    }

    public function test_non_403_client_errors_still_throw_plain_api_exception(): void
    {
        $client = $this->makeClient([
            new Response(400, [], json_encode(['errors' => [['message' => 'bad query']]])),
        ]);

        $this->expectException(AniListApiException::class);

        try {
            $client->query('query { Viewer { id } }');
        } catch (AniListApiException $e) {
            $this->assertNotInstanceOf(AniListServiceUnavailableException::class, $e);
            // Breaker must not trip for unrelated client errors.
            $this->assertNull(Cache::get('anilist:outage_until'));
            throw $e;
        }
    }

    private function makeClient(array $responses): AniListClient
    {
        $handler = new MockHandler($responses);
        $guzzle = new Client([
            'handler' => HandlerStack::create($handler),
            'base_uri' => 'https://graphql.anilist.co',
        ]);

        return new AniListClient(
            http: $guzzle,
            requestsPerMinute: 1000,
            maxRetries: 0,
            backoffBase: 0,
            rateLimitBackoff: 0,
            serviceUnavailableBackoff: 60,
            storeRawResponses: false,
        );
    }
}
