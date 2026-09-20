<?php

namespace Tests\Feature;

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use App\Models\User;
use App\Services\FeatureFlagService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactFormTest extends TestCase
{
    private const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    protected function setUp(): void
    {
        parent::setUp();

        app(FeatureFlagService::class)->setGlobalStatus('company-pages', 'everyone');

        config([
            'turnstile.site_key' => 'site-key-for-tests',
            'turnstile.secret_key' => 'secret-key-for-tests',
            'contact.to' => 'inbox@example.test',
        ]);

        Mail::fake();
        Http::preventStrayRequests();
    }

    /**
     * @return array<string, string>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Ayaka',
            'email' => 'ayaka@example.test',
            'subject' => 'Feature idea',
            'message' => 'It would be great to have custom list tags.',
        ], $overrides);
    }

    private function fakeTurnstile(bool $success): void
    {
        Http::fake([self::VERIFY_URL => Http::response(['success' => $success])]);
    }

    public function test_guests_see_the_captcha_and_signed_in_users_do_not(): void
    {
        $this->get('/contact')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ContactPage')
                ->where('requiresCaptcha', true)
                ->where('turnstileSiteKey', 'site-key-for-tests')
                ->where('prefill.name', '')
            );

        $user = User::factory()->create(['name' => 'Ren', 'email' => 'ren@example.test']);

        $this->actingAs($user)
            ->get('/contact')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('requiresCaptcha', false)
                ->where('turnstileSiteKey', null)
                ->where('prefill.name', 'Ren')
                ->where('prefill.email', 'ren@example.test')
            );
    }

    public function test_site_key_is_withheld_when_turnstile_is_not_configured(): void
    {
        config(['turnstile.secret_key' => '']);

        $this->get('/contact')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('requiresCaptcha', true)
                ->where('turnstileSiteKey', null)
            );
    }

    public function test_guest_submission_without_a_captcha_token_is_rejected(): void
    {
        $this->from('/contact')
            ->post('/contact', $this->payload())
            ->assertRedirect('/contact')
            ->assertSessionHasErrors('turnstile_token');

        $this->assertDatabaseCount('contact_messages', 0);
        Mail::assertNothingOutgoing();
    }

    public function test_guest_submission_with_a_rejected_captcha_token_is_refused(): void
    {
        $this->fakeTurnstile(false);

        $this->from('/contact')
            ->post('/contact', $this->payload(['turnstile_token' => 'bad-token']))
            ->assertRedirect('/contact')
            ->assertSessionHasErrors('turnstile_token');

        $this->assertDatabaseCount('contact_messages', 0);
        Mail::assertNothingOutgoing();
    }

    public function test_guest_submission_with_a_valid_captcha_token_is_stored_and_emailed(): void
    {
        $this->fakeTurnstile(true);

        $this->post('/contact', $this->payload(['turnstile_token' => 'good-token']))
            ->assertRedirect('/contact')
            ->assertSessionHas('status', 'success');

        Http::assertSent(fn ($request) => $request->url() === self::VERIFY_URL
            && $request['secret'] === 'secret-key-for-tests'
            && $request['response'] === 'good-token');

        $this->assertDatabaseHas('contact_messages', [
            'user_id' => null,
            'name' => 'Ayaka',
            'email' => 'ayaka@example.test',
            'subject' => 'Feature idea',
        ]);

        Mail::assertQueued(ContactMessageReceived::class, function (ContactMessageReceived $mail) {
            return $mail->hasTo('inbox@example.test')
                && $mail->hasReplyTo('ayaka@example.test')
                && $mail->contactMessage->subject === 'Feature idea';
        });
    }

    public function test_signed_in_users_skip_the_captcha_entirely(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/contact', $this->payload())
            ->assertRedirect('/contact')
            ->assertSessionHas('status', 'success');

        Http::assertNothingSent();

        $this->assertDatabaseHas('contact_messages', [
            'user_id' => $user->id,
            'subject' => 'Feature idea',
        ]);

        Mail::assertQueued(ContactMessageReceived::class);
    }

    public function test_honeypot_submissions_look_successful_but_are_dropped(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/contact', $this->payload(['website' => 'https://spam.example']))
            ->assertRedirect('/contact')
            ->assertSessionHas('status', 'success');

        $this->assertDatabaseCount('contact_messages', 0);
        Mail::assertNothingOutgoing();
    }

    public function test_message_fields_are_validated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/contact')
            ->post('/contact', [
                'name' => '',
                'email' => 'not-an-email',
                'subject' => '',
                'message' => 'short',
            ])
            ->assertRedirect('/contact')
            ->assertSessionHasErrors(['name', 'email', 'subject', 'message']);

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_messages_are_stored_without_email_when_no_recipient_is_configured(): void
    {
        config(['contact.to' => null]);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/contact', $this->payload())
            ->assertSessionHas('status', 'success');

        $this->assertSame(1, ContactMessage::count());
        Mail::assertNothingOutgoing();
    }

    public function test_the_form_is_unreachable_while_the_flag_is_off(): void
    {
        app(FeatureFlagService::class)->setGlobalStatus('company-pages', 'nobody');
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/contact', $this->payload())
            ->assertNotFound();

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_submissions_are_rate_limited(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($user)->post('/contact', $this->payload())->assertRedirect('/contact');
        }

        $this->actingAs($user)->post('/contact', $this->payload())->assertStatus(429);
    }
}
