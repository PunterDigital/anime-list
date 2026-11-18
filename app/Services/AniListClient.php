<?php

namespace App\Services;

use App\Exceptions\AniListApiException;
use App\Exceptions\AniListRateLimitException;
use App\Exceptions\AniListServiceUnavailableException;
use App\Models\RawApiResponse;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\NetworkException;
use GuzzleHttp\Exception\ResponseTransferException;
use GuzzleHttp\Exception\ServerException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class AniListClient
{
    private const CIRCUIT_BREAKER_KEY = 'anilist:outage_until';

    public function __construct(
        private readonly Client $http,
        private readonly int $requestsPerMinute,
        private readonly int $maxRetries,
        private readonly int $backoffBase,
        private readonly int $rateLimitBackoff,
        private readonly int $serviceUnavailableBackoff,
        private readonly bool $storeRawResponses,
    ) {}

    /**
     * Execute a GraphQL query against the AniList API.
     */
    public function query(string $query, array $variables = []): array
    {
        $this->assertCircuitClosed();

        return $this->executeWithRetry(function () use ($query, $variables) {
            $this->enforceRateLimit();

            $response = $this->http->post('', [
                'json' => [
                    'query' => $query,
                    'variables' => $variables,
                ],
            ]);

            $body = $response->getBody()->getContents();
            $data = json_decode($body, true);

            if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
                Log::error('AniList API returned non-JSON response', [
                    'json_error' => json_last_error_msg(),
                    'body_preview' => mb_substr($body, 0, 500),
                ]);
                throw new AniListApiException(
                    statusCode: $response->getStatusCode(),
                    message: 'AniList API returned non-JSON response: '.json_last_error_msg(),
                );
            }

            if (isset($data['errors']) && ! empty($data['errors'])) {
                Log::warning('AniList GraphQL errors', ['errors' => $data['errors']]);
                throw new AniListApiException(
                    statusCode: 200,
                    errors: $data['errors'],
                    message: $data['errors'][0]['message'] ?? 'GraphQL error',
                );
            }

            if (! isset($data['data'])) {
                Log::error('AniList API response missing "data" key', [
                    'response_keys' => array_keys($data ?? []),
                ]);
                throw new AniListApiException(
                    statusCode: 200,
                    message: 'AniList API response missing "data" key',
                );
            }

            return $data['data'];
        });
    }

    /**
     * Fetch all pages of a paginated query, yielding each page's data.
     *
     * @return \Generator<int, array>
     */
    public function paginatedQuery(
        string $query,
        array $variables = [],
        int $startPage = 1,
        int $perPage = 50,
    ): \Generator {
        $page = $startPage;

        do {
            $vars = array_merge($variables, [
                'page' => $page,
                'perPage' => $perPage,
            ]);

            $data = $this->query($query, $vars);
            $pageData = $data['Page'] ?? [];
            $pageInfo = $pageData['pageInfo'] ?? [];

            yield $page => $pageData;

            $page++;
        } while ($pageInfo['hasNextPage'] ?? false);
    }

    /**
     * Store a raw API response for later reprocessing.
     */
    public function storeRawResponse(string $endpoint, string $externalId, array $responseData): void
    {
        if (! $this->storeRawResponses) {
            return;
        }

        try {
            RawApiResponse::create([
                'source' => 'anilist',
                'endpoint' => $endpoint,
                'external_id' => $externalId,
                'response_body' => json_encode($responseData),
                'fetched_at' => now(),
                'is_processed' => false,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to store raw API response (non-fatal)', [
                'endpoint' => $endpoint,
                'external_id' => $externalId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Enforce rate limit using an atomic Redis Lua token bucket.
     */
    private function enforceRateLimit(): void
    {
        $script = <<<'LUA'
            local key = KEYS[1]
            local rpm = tonumber(ARGV[1])
            local tps = rpm / 60.0
            local now = tonumber(ARGV[2])

            local tokens = tonumber(redis.call('hget', key, 'tokens')) or rpm
            local last = tonumber(redis.call('hget', key, 'last_refill')) or now

            local elapsed = now - last
            tokens = math.min(rpm, tokens + elapsed * tps)

            if tokens < 1.0 then
                local wait = (1.0 - tokens) / tps
                return tostring(wait)
            end

            redis.call('hmset', key, 'tokens', tokens - 1, 'last_refill', now)
            redis.call('expire', key, 120)
            return "0"
        LUA;

        $wait = (float) Redis::eval($script, 1, 'anilist:rate_limit',
            $this->requestsPerMinute, microtime(true));

        if ($wait > 0) {
            $waitMicroseconds = (int) ($wait * 1_000_000);
            Log::debug('AniList rate limit: sleeping', ['wait_ms' => (int) ($wait * 1000)]);
            usleep($waitMicroseconds);
            $this->enforceRateLimit();
        }
    }

    /**
     * Execute a callable with retry logic and exponential backoff.
     */
    private function executeWithRetry(callable $fn): array
    {
        $attempt = 0;

        while (true) {
            try {
                return $fn();
            } catch (ClientException $e) {
                $status = $e->getResponse()->getStatusCode();

                if ($status === 429) {
                    $attempt++;
                    if ($attempt > $this->maxRetries) {
                        throw new AniListRateLimitException(
                            retryAfter: $this->rateLimitBackoff,
                            message: "Rate limit exceeded after {$this->maxRetries} retries",
                        );
                    }

                    $delay = $this->rateLimitBackoff * (2 ** ($attempt - 1));
                    Log::warning('AniList 429 rate limit hit', ['attempt' => $attempt, 'backoff_seconds' => $delay]);
                    sleep($delay);

                    continue;
                }

                if ($status === 403) {
                    throw $this->tripCircuitBreaker($e);
                }

                throw new AniListApiException(
                    statusCode: $status,
                    message: $e->getMessage(),
                );
            } catch (ServerException $e) {
                $attempt++;
                if ($attempt > $this->maxRetries) {
                    throw new AniListApiException(
                        statusCode: $e->getResponse()->getStatusCode(),
                        message: "Server error after {$this->maxRetries} retries: {$e->getMessage()}",
                    );
                }

                $delay = $this->backoffBase * (2 ** ($attempt - 1));
                Log::warning('AniList server error', ['attempt' => $attempt, 'status' => $e->getResponse()->getStatusCode(), 'backoff_seconds' => $delay]);
                sleep($delay);
            } catch (NetworkException|ResponseTransferException $e) {
                // Guzzle 8 splits what Guzzle 7 threw as ConnectException: a read
                // timeout is now a NetworkTimeoutException, and a timeout or broken
                // body after the headers arrived is a ResponseTransferException.
                // All of them are transient, so retry them like connect failures.
                $attempt++;
                if ($attempt > $this->maxRetries) {
                    throw new AniListApiException(
                        statusCode: 0,
                        message: "Connection failed after {$this->maxRetries} retries: {$e->getMessage()}",
                    );
                }

                $delay = $this->backoffBase * (2 ** ($attempt - 1));
                Log::warning('AniList connection error', ['attempt' => $attempt, 'backoff_seconds' => $delay]);
                sleep($delay);
            }
        }
    }

    /**
     * Short-circuit outbound requests while AniList is known to be down.
     * Prevents queued jobs from hammering the API during a prolonged outage.
     */
    private function assertCircuitClosed(): void
    {
        $openUntil = (int) Cache::get(self::CIRCUIT_BREAKER_KEY, 0);
        if ($openUntil <= time()) {
            return;
        }

        throw new AniListServiceUnavailableException(
            statusCode: 503,
            retryAfter: max(1, $openUntil - time()),
            message: 'AniList API circuit breaker open after recent outage',
        );
    }

    /**
     * Open the circuit breaker and convert the upstream 403 into a dedicated
     * exception so callers can back off instead of retrying immediately.
     */
    private function tripCircuitBreaker(ClientException $e): AniListServiceUnavailableException
    {
        $retryAfter = $this->serviceUnavailableBackoff;
        Cache::put(self::CIRCUIT_BREAKER_KEY, time() + $retryAfter, $retryAfter);

        $body = (string) $e->getResponse()->getBody();
        $decoded = json_decode($body, true);
        $errors = is_array($decoded['errors'] ?? null) ? $decoded['errors'] : [];
        $upstreamMessage = $errors[0]['message'] ?? null;

        Log::warning('AniList API returned 403, tripping circuit breaker', [
            'retry_after_s' => $retryAfter,
            'upstream_message' => $upstreamMessage,
            'body_preview' => mb_substr($body, 0, 500),
        ]);

        return new AniListServiceUnavailableException(
            statusCode: 403,
            retryAfter: $retryAfter,
            errors: $errors,
            message: $upstreamMessage
                ? "AniList API temporarily unavailable: {$upstreamMessage}"
                : 'AniList API temporarily unavailable (HTTP 403).',
        );
    }
}
