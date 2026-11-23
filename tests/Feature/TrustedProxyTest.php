<?php

namespace Tests\Feature;

use App\Http\Controllers\AnimeController;
use App\Services\AniListClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Mockery;
use Tests\TestCase;

/**
 * Card 5703: Cloudflare's edges are trusted proxies (config/trustedproxy.php),
 * so $request->ip() is the visitor behind them; nobody else can set it.
 */
class TrustedProxyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::get('/_test/client', fn (Request $request) => [
            'ip' => $request->ip(),
            'secure' => $request->isSecure(),
        ]);
    }

    public function test_a_request_from_cloudflare_gets_the_visitors_address_and_scheme(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '162.158.10.20'])
            ->withHeaders(['X-Forwarded-For' => '203.0.113.5', 'X-Forwarded-Proto' => 'https'])
            ->getJson('/_test/client')
            ->assertExactJson(['ip' => '203.0.113.5', 'secure' => true]);

        $this->withServerVariables(['REMOTE_ADDR' => '2606:4700::1'])
            ->withHeaders(['X-Forwarded-For' => '2001:db8::7'])
            ->getJson('/_test/client')
            ->assertJson(['ip' => '2001:db8::7']);
    }

    public function test_an_address_the_visitor_put_in_front_of_cloudflares_is_skipped(): void
    {
        // Cloudflare appends the real client to whatever X-Forwarded-For the visitor sent.
        $this->withServerVariables(['REMOTE_ADDR' => '172.64.1.2'])
            ->withHeaders(['X-Forwarded-For' => '10.0.0.1, 203.0.113.5'])
            ->getJson('/_test/client')
            ->assertJson(['ip' => '203.0.113.5']);
    }

    public function test_any_other_address_ignores_forwarded_headers(): void
    {
        foreach (['198.51.100.9', '127.0.0.1', '2001:db8::1'] as $remote) {
            $this->withServerVariables(['REMOTE_ADDR' => $remote])
                ->withHeaders(['X-Forwarded-For' => '203.0.113.5', 'X-Forwarded-Proto' => 'https'])
                ->getJson('/_test/client')
                ->assertExactJson(['ip' => $remote, 'secure' => false]);
        }
    }

    public function test_visitors_behind_one_cloudflare_edge_get_their_own_anilist_fetch_limit(): void
    {
        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('interactive')->andReturnSelf();
        $client->shouldReceive('query')->andReturn(['Media' => null]);
        $this->instance(AniListClient::class, $client);

        $edge = ['REMOTE_ADDR' => '162.158.10.20'];

        for ($i = 1; $i <= AnimeController::ANILIST_FETCHES_PER_IP; $i++) {
            $this->withServerVariables($edge)->withHeaders(['X-Forwarded-For' => '203.0.113.5'])
                ->get(route('anime.show.anilist', ['anilistId' => 910000 + $i]))
                ->assertNotFound();
        }

        $this->withServerVariables($edge)->withHeaders(['X-Forwarded-For' => '203.0.113.5'])
            ->get(route('anime.show.anilist', ['anilistId' => 910099]))
            ->assertRedirect(route('home'));

        // Another visitor on the same edge isn't limited by the first one.
        $this->withServerVariables($edge)->withHeaders(['X-Forwarded-For' => '203.0.113.6'])
            ->get(route('anime.show.anilist', ['anilistId' => 910100]))
            ->assertNotFound();
    }
}
