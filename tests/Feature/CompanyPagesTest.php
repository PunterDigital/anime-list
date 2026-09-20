<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\FeatureFlagService;
use Illuminate\Support\Facades\Cache;
use Laravel\Pennant\Feature;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class CompanyPagesTest extends TestCase
{
    /**
     * @return array<string, array{string, string}>
     */
    public static function pages(): array
    {
        return [
            'about' => ['/about', 'AboutPage'],
            'how it works' => ['/how-it-works', 'HowItWorksPage'],
            'contact' => ['/contact', 'ContactPage'],
        ];
    }

    #[DataProvider('pages')]
    public function test_pages_are_hidden_while_the_flag_is_off(string $path): void
    {
        $this->get($path)->assertNotFound();

        $this->actingAs(User::factory()->create())
            ->get($path)
            ->assertNotFound();
    }

    #[DataProvider('pages')]
    public function test_pages_render_when_the_flag_is_on_for_everyone(string $path, string $component): void
    {
        app(FeatureFlagService::class)->setGlobalStatus('company-pages', 'everyone');

        $this->get($path)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component($component));
    }

    #[DataProvider('pages')]
    public function test_pages_render_for_a_user_with_an_individual_override(string $path, string $component): void
    {
        $user = User::factory()->create();
        Feature::for($user)->activate('company-pages');

        $this->actingAs($user)
            ->get($path)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component($component));

        // The override is per-user; guests are still locked out.
        auth()->logout();
        $this->get($path)->assertNotFound();
    }

    public function test_business_information_is_shared_with_every_page(): void
    {
        config(['business.name' => 'Example Operator', 'business.vat_number' => 'CZ123']);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('business.name', 'Example Operator')
                ->where('business.vat_number', 'CZ123')
                ->has('business.address.street')
                ->has('business.address.district')
                ->has('business.address.postcode')
                ->has('business.address.country')
                ->has('business.business_number')
            );
    }

    public function test_sitemap_lists_company_pages_only_when_public(): void
    {
        Cache::flush();
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertDontSee(route('about'))
            ->assertDontSee(route('how-it-works'))
            ->assertDontSee(route('contact'));

        app(FeatureFlagService::class)->setGlobalStatus('company-pages', 'everyone');
        Cache::flush();

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee(route('about'))
            ->assertSee(route('how-it-works'))
            ->assertSee(route('contact'));
    }

    public function test_the_content_security_policy_allows_turnstile(): void
    {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        $this->assertMatchesRegularExpression('/script-src[^;]*https:\/\/challenges\.cloudflare\.com/', $csp);
        $this->assertMatchesRegularExpression('/frame-src[^;]*https:\/\/challenges\.cloudflare\.com/', $csp);
    }
}
