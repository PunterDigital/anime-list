<?php

namespace App\Http\Requests;

use App\Models\UserAnimeList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateListEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $entry = $this->route('entry');

        return $entry instanceof UserAnimeList
            && $this->user()?->id === $entry->user_id;
    }

    public function rules(): array
    {
        $entry = $this->route('entry');
        $maxEpisodes = $entry instanceof UserAnimeList ? $entry->anime?->episodes : null;

        $progressRules = ['nullable', 'integer', 'min:0'];
        if ($maxEpisodes !== null) {
            $progressRules[] = "max:{$maxEpisodes}";
        }

        return [
            'status' => ['sometimes', 'string', Rule::in(UserAnimeList::STATUSES)],
            'score' => ['nullable', 'integer', 'min:0', 'max:10'],
            'progress' => $progressRules,
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_private' => ['boolean'],
            'is_rewatching' => ['boolean'],
            'rewatch_count' => ['nullable', 'integer', 'min:0'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        $entry = $this->route('entry');
        $maxEpisodes = $entry instanceof UserAnimeList ? $entry->anime?->episodes : null;

        return [
            'progress.max' => $maxEpisodes !== null
                ? "Progress cannot exceed the total of {$maxEpisodes} episodes."
                : 'Progress cannot exceed the total number of episodes.',
        ];
    }
}
