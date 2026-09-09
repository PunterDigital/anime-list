<?php

return [
    'endpoint' => env('ANILIST_API_URL', 'https://graphql.anilist.co'),

    'rate_limit' => [
        'requests_per_minute' => (int) env('ANILIST_RATE_LIMIT', 85),
    ],

    'http' => [
        'connect_timeout' => 30,
        'timeout' => 60,
    ],

    'retry' => [
        'max_attempts' => 3,
        'backoff_base_seconds' => 5,
        'rate_limit_backoff_seconds' => 60,
        // Backoff for AniList service-unavailable responses (HTTP 403
        // "temporarily disabled" or sustained 5xx). Also doubles as the
        // circuit-breaker TTL so queued jobs stop hitting the endpoint.
        'service_unavailable_backoff_seconds' => 900,
    ],

    'sync' => [
        'per_page' => 50,
        /*
         * AniList serves only the first 5,000 entries of any result set and
         * answers a deeper page with a 400 "Page depth exceeds maximum
         * allowed for API requests". Sweeps stop or re-window at this bound
         * instead of walking into it.
         */
        'max_page_depth' => (int) env('ANILIST_MAX_PAGE_DEPTH', 5000),
        'store_raw_responses' => (bool) env('ANILIST_STORE_RAW', true),
    ],

    /*
     * Backfill sweep for anime whose local copy has gone stale. Most of the
     * catalogue is long-finished and never changes upstream, so those rows are
     * flagged out of the sweep once refreshed rather than being re-fetched
     * forever; the monthly FINISHED incremental sync still picks up genuine
     * upstream edits.
     */
    'refresh' => [
        // An anime is stale once its last successful sync is this old.
        'stale_after_days' => (int) env('ANILIST_REFRESH_STALE_AFTER_DAYS', 30),
        // Anime per AniList request during the stale sweep.
        'batch_size' => (int) env('ANILIST_REFRESH_BATCH_SIZE', 50),
        // Upper bound on batches per sweep, so one run cannot monopolise the
        // sync queue or the AniList rate limit budget.
        'max_batches_per_run' => (int) env('ANILIST_REFRESH_MAX_BATCHES', 200),
        // A finished or cancelled show whose last episode aired at least this
        // long ago is flagged out of future stale sweeps.
        'exclude_finished_after_days' => (int) env('ANILIST_REFRESH_EXCLUDE_FINISHED_AFTER_DAYS', 180),
    ],
];
