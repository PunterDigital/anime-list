<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\EnsureIsAdmin;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class EnsureIsAdminTest extends TestCase
{
    public function test_it_aborts_with_403_for_guests(): void
    {
        $request = Request::create('/admin');

        try {
            (new EnsureIsAdmin)->handle($request, fn () => new Response('ok'));
            $this->fail('Expected HttpException to be thrown.');
        } catch (HttpException $e) {
            $this->assertSame(403, $e->getStatusCode());
        }
    }

    public function test_it_aborts_with_403_for_non_admin_users(): void
    {
        $request = Request::create('/admin');
        $request->setUserResolver(fn () => User::factory()->create(['is_admin' => false]));

        try {
            (new EnsureIsAdmin)->handle($request, fn () => new Response('ok'));
            $this->fail('Expected HttpException to be thrown.');
        } catch (HttpException $e) {
            $this->assertSame(403, $e->getStatusCode());
        }
    }

    public function test_it_passes_through_for_admin_users(): void
    {
        $request = Request::create('/admin');
        $request->setUserResolver(fn () => User::factory()->admin()->create());

        $response = (new EnsureIsAdmin)->handle($request, fn () => new Response('ok'));

        $this->assertSame('ok', $response->getContent());
    }
}
