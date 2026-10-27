<script setup lang="ts">
import { computed, ref } from 'vue'
import AppLayout from '@/Layouts/AppLayout.vue'
import Button from 'primevue/button'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    apiBaseUrl: string
}>()

interface Endpoint {
    id: string
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    path: string
    title: string
    auth: 'bearer' | 'credentials' | 'none'
    description: string
    params?: Array<{ name: string; in: 'query' | 'body' | 'path'; type: string; required?: boolean; notes?: string }>
    example: string
}

interface Section {
    id: string
    title: string
    endpoints: Endpoint[]
}

const sections: Section[] = [
    {
        id: 'auth',
        title: 'Authentication',
        endpoints: [
            {
                id: 'issue-token',
                method: 'POST',
                path: '/auth/token',
                title: 'Issue a token',
                auth: 'credentials',
                description:
                    'Exchange an AniTrack email and password for a bearer token. Returns the plain-text token once — store it securely. Subject to the strict auth rate limit (5 requests / minute / IP + email).',
                params: [
                    { name: 'email', in: 'body', type: 'string', required: true },
                    { name: 'password', in: 'body', type: 'string', required: true },
                    { name: 'device_name', in: 'body', type: 'string', required: true, notes: 'Shown on your settings page so you can identify the client. Max 120 chars.' },
                ],
                example: `curl -X POST {BASE}/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"…","device_name":"My Integration"}'`,
            },
            {
                id: 'list-tokens',
                method: 'GET',
                path: '/auth/tokens',
                title: 'List tokens',
                auth: 'bearer',
                description: 'List your active API tokens (same data shown in the settings page).',
                example: `curl {BASE}/auth/tokens \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
            {
                id: 'revoke-current',
                method: 'DELETE',
                path: '/auth/token',
                title: 'Revoke the current token',
                auth: 'bearer',
                description: 'Revoke the token used on this request. Useful for client "sign out" flows.',
                example: `curl -X DELETE {BASE}/auth/token \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
            {
                id: 'revoke-specific',
                method: 'DELETE',
                path: '/auth/tokens/{id}',
                title: 'Revoke a specific token',
                auth: 'bearer',
                description: 'Revoke another token belonging to your account.',
                params: [
                    { name: 'id', in: 'path', type: 'integer', required: true },
                ],
                example: `curl -X DELETE {BASE}/auth/tokens/42 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
        ],
    },
    {
        id: 'user',
        title: 'Current User',
        endpoints: [
            {
                id: 'get-me',
                method: 'GET',
                path: '/user',
                title: 'Fetch the authenticated user',
                auth: 'bearer',
                description: 'Returns the profile of the user who owns the bearer token.',
                example: `curl {BASE}/user \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
        ],
    },
    {
        id: 'anime',
        title: 'Anime',
        endpoints: [
            {
                id: 'search',
                method: 'GET',
                path: '/anime/search',
                title: 'Search the catalogue',
                auth: 'bearer',
                description: 'Full-text search across English, Romaji and native titles. Adult titles are excluded.',
                params: [
                    { name: 'q', in: 'query', type: 'string', required: true, notes: '2–200 characters' },
                    { name: 'limit', in: 'query', type: 'integer', notes: '1–50, default 20' },
                ],
                example: `curl "{BASE}/anime/search?q=naruto&limit=5" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
            {
                id: 'anime-by-anilist',
                method: 'GET',
                path: '/anime/anilist/{anilistId}',
                title: 'Get anime by AniList ID',
                auth: 'bearer',
                description: 'Primary lookup path when you only have an AniList ID (for example, from an anilist.co page). Returns 404 if AniTrack has not yet synced that anime.',
                params: [
                    { name: 'anilistId', in: 'path', type: 'integer', required: true },
                ],
                example: `curl {BASE}/anime/anilist/101922 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
            {
                id: 'anime-by-slug',
                method: 'GET',
                path: '/anime/{slug}',
                title: 'Get anime by slug',
                auth: 'bearer',
                description: 'Full anime detail with genres, studios and external IDs.',
                params: [
                    { name: 'slug', in: 'path', type: 'string', required: true },
                ],
                example: `curl {BASE}/anime/demon-slayer-kimetsu-no-yaiba \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
        ],
    },
    {
        id: 'list',
        title: 'User List',
        endpoints: [
            {
                id: 'list-index',
                method: 'GET',
                path: '/list',
                title: 'Get your list',
                auth: 'bearer',
                description: 'Returns all list entries belonging to the token owner, most-recently-updated first.',
                params: [
                    {
                        name: 'status',
                        in: 'query',
                        type: 'string',
                        notes: 'One of watching, completed, on_hold, dropped, plan_to_watch',
                    },
                ],
                example: `curl "{BASE}/list?status=watching" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
            {
                id: 'list-show-anime',
                method: 'GET',
                path: '/list/anime/{animeId}',
                title: 'Check if an anime is on your list',
                auth: 'bearer',
                description: 'Returns the list entry for the given anime, or 404 if the user has not added it.',
                params: [
                    { name: 'animeId', in: 'path', type: 'integer', required: true },
                ],
                example: `curl {BASE}/list/anime/1234 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
            {
                id: 'list-store',
                method: 'POST',
                path: '/list',
                title: 'Add an anime to your list',
                auth: 'bearer',
                description: 'Scores are stored on a 0–100 scale. Progress is auto-completed when it reaches the anime\'s episode count.',
                params: [
                    { name: 'anime_id', in: 'body', type: 'integer', required: true },
                    { name: 'status', in: 'body', type: 'string', required: true, notes: 'watching | completed | on_hold | dropped | plan_to_watch' },
                    { name: 'score', in: 'body', type: 'integer', notes: '0–100' },
                    { name: 'progress', in: 'body', type: 'integer' },
                    { name: 'started_at', in: 'body', type: 'date' },
                    { name: 'completed_at', in: 'body', type: 'date' },
                    { name: 'notes', in: 'body', type: 'string', notes: 'Max 2000 chars' },
                    { name: 'is_private', in: 'body', type: 'boolean' },
                ],
                example: `curl -X POST {BASE}/list \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"anime_id":1234,"status":"watching","progress":3}'`,
            },
            {
                id: 'list-update',
                method: 'PATCH',
                path: '/list/{entryId}',
                title: 'Update a list entry',
                auth: 'bearer',
                description: 'Partial update — send only the fields you want to change.',
                params: [
                    { name: 'entryId', in: 'path', type: 'integer', required: true },
                    { name: 'status', in: 'body', type: 'string' },
                    { name: 'score', in: 'body', type: 'integer', notes: '0–100' },
                    { name: 'progress', in: 'body', type: 'integer' },
                    { name: 'is_rewatching', in: 'body', type: 'boolean' },
                    { name: 'rewatch_count', in: 'body', type: 'integer' },
                    { name: 'tags', in: 'body', type: 'string[]' },
                ],
                example: `curl -X PATCH {BASE}/list/987 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"progress":12,"score":85}'`,
            },
            {
                id: 'list-destroy',
                method: 'DELETE',
                path: '/list/{entryId}',
                title: 'Remove a list entry',
                auth: 'bearer',
                description: 'Soft-deletes the entry.',
                params: [
                    { name: 'entryId', in: 'path', type: 'integer', required: true },
                ],
                example: `curl -X DELETE {BASE}/list/987 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
            },
        ],
    },
]

const tocSections = computed(() => [
    { id: 'overview', title: 'Overview' },
    { id: 'authentication', title: 'Getting a Token' },
    { id: 'making-requests', title: 'Making Requests' },
    { id: 'rate-limits', title: 'Rate Limits' },
    { id: 'errors', title: 'Errors' },
    { id: 'versioning', title: 'Versioning' },
    ...sections.map(s => ({ id: s.id, title: s.title })),
])

function renderExample(ex: string): string {
    return ex.replace(/\{BASE\}/g, props.apiBaseUrl)
}

const copiedId = ref<string | null>(null)

async function copy(text: string, id: string) {
    try {
        await navigator.clipboard.writeText(text)
        copiedId.value = id
        setTimeout(() => {
            if (copiedId.value === id) copiedId.value = null
        }, 1500)
    } catch {
        // Clipboard might be blocked — fail silently.
    }
}

const methodBadge: Record<Endpoint['method'], string> = {
    GET: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
    POST: 'bg-sky-900/50 text-sky-300 border-sky-700',
    PATCH: 'bg-amber-900/50 text-amber-300 border-amber-700',
    DELETE: 'bg-rose-900/50 text-rose-300 border-rose-700',
}
</script>

<template>
    <Head title="Developers">
        <meta name="description" content="AniTrack public API documentation for third-party integrations." />
        <link rel="canonical" :href="route('developers')" />
    </Head>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <!-- Sidebar -->
        <aside class="hidden lg:block">
            <nav class="sticky top-6 space-y-1 text-sm">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    On this page
                </p>
                <a
                    v-for="item in tocSections"
                    :key="item.id"
                    :href="`#${item.id}`"
                    class="block rounded px-2 py-1 text-gray-400 transition hover:bg-gray-900 hover:text-gray-100"
                >
                    {{ item.title }}
                </a>
            </nav>
        </aside>

        <!-- Content -->
        <div class="min-w-0 space-y-12">
            <header>
                <p class="text-sm font-medium text-emerald-400">AniTrack API</p>
                <h1 class="mt-1 text-3xl font-bold">Developers</h1>
                <p class="mt-3 max-w-2xl text-gray-400">
                    The AniTrack public API lets third-party integrations read and manage your
                    list on your behalf. All endpoints are versioned and served from
                    <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">{{ apiBaseUrl }}</code>.
                </p>
            </header>

            <!-- Overview -->
            <section id="overview" class="space-y-3 scroll-mt-6">
                <h2 class="text-xl font-semibold">Overview</h2>
                <p class="text-gray-400 leading-relaxed">
                    The API uses JSON request/response bodies, bearer-token authentication, and
                    conventional HTTP status codes. Every authenticated endpoint acts as the token's
                    owner — there are no "admin" or "impersonation" flows.
                </p>
            </section>

            <!-- Getting a token -->
            <section id="authentication" class="space-y-3 scroll-mt-6">
                <h2 class="text-xl font-semibold">Getting a Token</h2>
                <p class="text-gray-400 leading-relaxed">
                    You can mint a token in two ways:
                </p>
                <ol class="ml-6 list-decimal space-y-2 text-gray-400">
                    <li>
                        From the <Link :href="route('settings')" class="text-emerald-400 hover:underline">Settings page</Link>
                        → <strong>API Tokens</strong> — recommended for personal integrations. The
                        plain-text token is shown once; copy it immediately.
                    </li>
                    <li>
                        By calling <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">POST /auth/token</code>
                        with a user's email + password — suitable for clients that need a
                        sign-in flow.
                    </li>
                </ol>
                <div class="rounded-lg border border-amber-800/50 bg-amber-950/30 p-3 text-sm text-amber-200">
                    Treat tokens like passwords. Anyone with a token can read and modify that user's
                    list. Revoke unused tokens from the settings page.
                </div>
            </section>

            <!-- Making requests -->
            <section id="making-requests" class="space-y-3 scroll-mt-6">
                <h2 class="text-xl font-semibold">Making Requests</h2>
                <p class="text-gray-400 leading-relaxed">
                    Pass the token on every request in the <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">Authorization</code>
                    header:
                </p>
                <pre class="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm text-gray-300"><code>Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
Accept: application/json</code></pre>
                <p class="text-gray-400 leading-relaxed">
                    All dates are ISO-8601 (UTC). Scores are stored on a 0–100 scale; the UI divides
                    by ten for display.
                </p>
            </section>

            <!-- Rate limits -->
            <section id="rate-limits" class="space-y-3 scroll-mt-6">
                <h2 class="text-xl font-semibold">Rate Limits</h2>
                <p class="text-gray-400 leading-relaxed">
                    Authenticated endpoints are capped at <strong>60 requests / minute</strong> per
                    token. The token-issuance endpoint is capped at
                    <strong>5 requests / minute</strong> per email and per IP to deter credential
                    stuffing. Exceeding these limits returns <code class="rounded bg-gray-900 px-1.5 py-0.5">429 Too Many Requests</code>.
                </p>
            </section>

            <!-- Errors -->
            <section id="errors" class="space-y-3 scroll-mt-6">
                <h2 class="text-xl font-semibold">Errors</h2>
                <p class="text-gray-400 leading-relaxed">
                    Errors are returned as JSON with a <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">message</code>
                    field and, for validation failures, an <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">errors</code>
                    object keyed by field name.
                </p>
                <pre class="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm text-gray-300"><code>{
  "message": "The given data was invalid.",
  "errors": {
    "status": ["The status field is required."]
  }
}</code></pre>
                <p class="text-sm text-gray-500">
                    Common codes: <code>401</code> missing / invalid token, <code>403</code> feature
                    not enabled for this account, <code>404</code> resource not found, <code>422</code>
                    validation failed, <code>429</code> rate-limited.
                </p>
            </section>

            <!-- Versioning -->
            <section id="versioning" class="space-y-3 scroll-mt-6">
                <h2 class="text-xl font-semibold">Versioning</h2>
                <p class="text-gray-400 leading-relaxed">
                    Endpoints live under <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">/api/v1</code>.
                    Breaking changes will ship under a new major version; within <code>v1</code> we
                    will only add fields, never remove or rename them.
                </p>
            </section>

            <!-- Endpoint reference -->
            <section
                v-for="group in sections"
                :id="group.id"
                :key="group.id"
                class="space-y-4 scroll-mt-6"
            >
                <h2 class="text-xl font-semibold">{{ group.title }}</h2>
                <article
                    v-for="endpoint in group.endpoints"
                    :id="endpoint.id"
                    :key="endpoint.id"
                    class="space-y-3 rounded-xl border border-gray-800 bg-gray-900/40 p-5 scroll-mt-6"
                >
                    <header class="space-y-2">
                        <h3 class="text-base font-semibold text-gray-100">
                            {{ endpoint.title }}
                        </h3>
                        <div class="flex flex-wrap items-center gap-2">
                            <span
                                class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono font-semibold"
                                :class="methodBadge[endpoint.method]"
                            >
                                {{ endpoint.method }}
                            </span>
                            <code class="font-mono text-sm text-gray-300">{{ endpoint.path }}</code>
                            <span
                                v-if="endpoint.auth === 'bearer'"
                                class="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                            >
                                Requires bearer token
                            </span>
                            <span
                                v-else-if="endpoint.auth === 'credentials'"
                                class="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                            >
                                Requires email + password
                            </span>
                        </div>
                    </header>

                    <p class="text-sm text-gray-400 leading-relaxed">
                        {{ endpoint.description }}
                    </p>

                    <div v-if="endpoint.params && endpoint.params.length > 0">
                        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Parameters
                        </p>
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase text-gray-500">
                                <tr>
                                    <th class="pb-2 pr-3 font-medium">Name</th>
                                    <th class="pb-2 pr-3 font-medium">In</th>
                                    <th class="pb-2 pr-3 font-medium">Type</th>
                                    <th class="pb-2 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-800">
                                <tr v-for="p in endpoint.params" :key="p.name">
                                    <td class="py-2 pr-3">
                                        <code class="font-mono text-emerald-300">{{ p.name }}</code>
                                        <span v-if="p.required" class="ml-1 text-rose-400">*</span>
                                    </td>
                                    <td class="py-2 pr-3 text-gray-500">{{ p.in }}</td>
                                    <td class="py-2 pr-3 text-gray-400">{{ p.type }}</td>
                                    <td class="py-2 text-gray-500">{{ p.notes ?? '' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="relative">
                        <Button
                            type="button"
                            size="small"
                            severity="secondary"
                            text
                            class="!absolute !right-2 !top-2 !text-xs"
                            :label="copiedId === endpoint.id ? 'Copied' : 'Copy'"
                            @click="copy(renderExample(endpoint.example), endpoint.id)"
                        />
                        <pre class="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 pr-16 text-sm text-gray-300"><code>{{ renderExample(endpoint.example) }}</code></pre>
                    </div>
                </article>
            </section>
        </div>
    </div>
</template>
