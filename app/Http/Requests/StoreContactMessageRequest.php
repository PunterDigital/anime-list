<?php

namespace App\Http\Requests;

use App\Rules\ValidTurnstileToken;
use Illuminate\Foundation\Http\FormRequest;

class StoreContactMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            // Honeypot: a hidden field real visitors never fill in.
            'website' => ['nullable', 'string', 'max:255'],
        ];

        if ($this->requiresCaptcha()) {
            $rules['turnstile_token'] = ['required', 'string', new ValidTurnstileToken($this->ip())];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'turnstile_token.required' => 'Please complete the captcha check.',
        ];
    }

    /**
     * Signed-in users have already proven they are a person when they
     * registered, so only anonymous visitors face the captcha.
     */
    public function requiresCaptcha(): bool
    {
        return $this->user() === null;
    }

    public function isHoneypotTripped(): bool
    {
        return trim((string) $this->input('website', '')) !== '';
    }
}
