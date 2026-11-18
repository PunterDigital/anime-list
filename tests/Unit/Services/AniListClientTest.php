<?php

namespace Tests\Unit\Services;

use App\Exceptions\AniListApiException;
use App\Exceptions\AniListServiceUnavailableException;
use App\Services\AniListClient;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\ConnectTimeoutException;
use GuzzleHttp\Exception\NetworkTimeoutException;
use GuzzleHttp\Exception\ResponseTimeoutException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\DataProvider;
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

    /**
     * Guzzle 8 throws a read timeout as NetworkTimeoutException and a timeout
     * after the headers as ResponseTimeoutException; neither is a
     * ConnectException any more. All of them must still be retried.
     *
     * @return array<string, array{callable(Request): \Throwable}>
     */
    public static function transientTransportErrors(): array
    {
        return [
            'connect failure' => [fn (Request $r) => new ConnectException('cURL error 7: Failed to connect', $r)],
            'connect timeout' => [fn (Request $r) => new ConnectTimeoutException('cURL error 28: Connection timed out', $r)],
            'read timeout' => [fn (Request $r) => new NetworkTimeoutException('cURL error 28: Operation timed out', $r)],
            'timeout mid-body' => [fn (Request $r) => new ResponseTimeoutException('cURL error 28: Operation timed out', $r, new Response(200))],
        ];
    }

    #[DataProvider('transientTransportErrors')]
    public function test_transient_transport_errors_are_retried(callable $makeError): void
    {
        $request = new Request('POST', 'https://graphql.anilist.co');

        $client = $this->makeClient([
            $makeError($request),
            new Response(200, [], json_encode(['data' => ['Viewer' => ['id' => 1]]])),
        ], maxRetries: 1);

        $this->assertSame(['Viewer' => ['id' => 1]], $client->query('query { Viewer { id } }'));
    }

    #[DataProvider('transientTransportErrors')]
    public function test_transient_transport_errors_give_up_after_max_retries(callable $makeError): void
    {
        $request = new Request('POST', 'https://graphql.anilist.co');

        $client = $this->makeClient([$makeError($request), $makeError($request)], maxRetries: 1);

        try {
            $client->query('query { Viewer { id } }');
            $this->fail('Expected AniListApiException');
        } catch (AniListApiException $e) {
            $this->assertSame(0, $e->statusCode);
            $this->assertStringContainsString('Connection failed after 1 retries', $e->getMessage());
        }
    }

    private function makeClient(array $responses, int $maxRetries = 0): AniListClient
    {
        $handler = new MockHandler($responses);
        $guzzle = new Client([
            'handler' => HandlerStack::create($handler),
            'base_uri' => 'https://graphql.anilist.co',
        ]);

        return new AniListClient(
            http: $guzzle,
            requestsPerMinute: 1000,
            maxRetries: $maxRetries,
            backoffBase: 0,
            rateLimitBackoff: 0,
            serviceUnavailableBackoff: 60,
            storeRawResponses: false,
        );
    }
}
