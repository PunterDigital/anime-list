<?php

namespace App\Rules;

use App\Services\TurnstileVerifier;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidTurnstileToken implements ValidationRule
{
    public function __construct(
        private readonly ?string $ip = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! app(TurnstileVerifier::class)->verify($value, $this->ip)) {
            $fail('The captcha check failed. Please try again.');
        }
    }
}
