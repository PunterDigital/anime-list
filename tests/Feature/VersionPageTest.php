<?php

namespace Tests\Feature;

use App\Support\DeployedVersion;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class VersionPageTest extends TestCase
{
    private function root(): string
    {
        return sys_get_temp_dir().'/anitrack-version-test';
    }

    private function fakeGitDir(): string
    {
        $dir = $this->root().'/git-'.bin2hex(random_bytes(4));
        File::ensureDirectoryExists($dir.'/refs/heads');

        return $dir;
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->root());

        parent::tearDown();
    }

    public function test_version_answers_json_with_no_session_cookie_and_no_caching(): void
    {
        $response = $this->get('/version');

        $response->assertOk()
            ->assertJsonStructure(['version', 'commit', 'deployed_at'])
            ->assertHeader('Cache-Control', 'no-store, private');

        $this->assertSame([], $response->headers->getCookies());
    }

    public function test_version_is_not_shadowed_by_the_fallback_route(): void
    {
        // GET reaches the controller; other methods fall through to the
        // `Route::any` fallback (a 404), like any unknown URL.
        $this->get('/version')->assertOk()->assertHeader('Content-Type', 'application/json');
        $this->post('/version')->assertNotFound();
    }

    public function test_a_branch_checkout_reports_the_commit_from_its_ref_file(): void
    {
        $dir = $this->fakeGitDir();
        $sha = str_repeat('a1b2c3d4e5', 4);
        File::put($dir.'/HEAD', "ref: refs/heads/main\n");
        File::put($dir.'/refs/heads/main', $sha."\n");
        touch($dir.'/refs/heads/main', 1_794_330_000);

        $this->assertSame([
            'version' => 'a1b2c3d',
            'commit' => $sha,
            'deployed_at' => '2026-11-10T17:00:00Z',
        ], (new DeployedVersion($dir))->toArray());
    }

    public function test_a_ref_that_only_lives_in_packed_refs_is_found(): void
    {
        $dir = $this->fakeGitDir();
        $sha = str_repeat('0f', 20);
        File::put($dir.'/HEAD', "ref: refs/heads/main\n");
        File::put($dir.'/packed-refs', "# pack-refs with: peeled fully-peeled sorted\n{$sha} refs/heads/main\n");

        $version = (new DeployedVersion($dir))->toArray();

        $this->assertSame('0f0f0f0', $version['version']);
        $this->assertSame($sha, $version['commit']);
    }

    public function test_a_detached_head_reports_its_own_sha(): void
    {
        $dir = $this->fakeGitDir();
        $sha = str_repeat('9', 40);
        File::put($dir.'/HEAD', $sha);

        $this->assertSame($sha, (new DeployedVersion($dir))->toArray()['commit']);
    }

    public function test_no_checkout_reports_unknown(): void
    {
        $this->assertSame([
            'version' => 'unknown',
            'commit' => 'unknown',
            'deployed_at' => null,
        ], (new DeployedVersion($this->root().'/missing'))->toArray());
    }
}
