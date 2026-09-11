<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>{{ config('app.name', 'AniTrack') }}</title>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32.png">
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon/favicon-48.png">
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon/favicon-128.png">
        <link rel="apple-touch-icon" sizes="128x128" href="/favicon/favicon-128.png">
        @if (config('adsense.client'))
            <meta name="google-adsense-account" content="{{ config('adsense.client') }}">
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={{ config('adsense.client') }}" crossorigin="anonymous" nonce="{{ app('csp-nonce') }}"></script>
        @endif
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-4K6RNYTM27" nonce="{{ app('csp-nonce') }}"></script>
        <script nonce="{{ app('csp-nonce') }}">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-4K6RNYTM27');gtag('config','AW-18128258525');</script>
        <script type="application/ld+json" nonce="{{ app('csp-nonce') }}">{!! json_encode(['@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => 'AniTrack', 'url' => config('app.url')], JSON_UNESCAPED_SLASHES) !!}</script>
        @routes(nonce: app('csp-nonce'))
        @vite(['resources/js/app.ts'])
        @inertiaHead
    </head>
    <body class="antialiased bg-gray-950 text-gray-100">
        @inertia
    </body>
</html>
