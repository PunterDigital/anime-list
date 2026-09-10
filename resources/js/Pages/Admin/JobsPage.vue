<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { router, useForm, usePage } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminNav from '@/Components/AdminNav.vue'

defineOptions({ layout: AppLayout })

interface QueueCount {
    queue: string
    count: number
}

interface SyncRun {
    id: number
    mode: string
    label: string | null
    status: string
    stalled: boolean
    current_page: number
    last_page: number
    total_items: number
    processed_items: number
    cutoff_at: number | null
    started_at: string | null
    finished_at: string | null
    heartbeat_at: string | null
    duration_seconds: number | null
    last_error: string | null
}

interface FailedJob {
    uuid: string
    queue: string
    job_class: string | null
    exception_summary: string
    failed_at: string
}

interface AnimeRef {
    id: number
    slug: string | null
    anilist_id: number
    title: string
    cover_image_medium: string | null
    created_at?: string
    synced_at?: string
}

interface ExclusionCount {
    reason: string
    count: number
}

interface JobMetrics {
    queued_total: number
    queued_by_queue: QueueCount[]
    failed_total: number
    failed_by_queue: QueueCount[]
    failed_last_24h: number
    queue_wait_seconds: number | null
    anime_total: number
    anime_added: { last_24h: number; last_7d: number; last_30d: number }
    anime_updated: { last_24h: number; last_7d: number; last_30d: number }
    never_synced: number
    stale_sync: number
    refresh_excluded: number
    refresh_excluded_by_reason: ExclusionCount[]
    stale_after_days: number
    refresh_batch_size: number
    refresh_max_batches: number
}

const props = defineProps<{
    metrics: JobMetrics
    recentFailed: FailedJob[]
    recentlyAdded: AnimeRef[]
    recentlyUpdated: AnimeRef[]
    syncRuns: SyncRun[]
}>()

const page = usePage()
const flashMessage = computed(
    () => (page.props.flash as { message?: string } | undefined)?.message ?? null,
)
const syncError = computed(
    () => (page.props.errors as { sync?: string } | undefined)?.sync ?? null,
)

const enqueueForm = useForm({
    anilist_id: '' as string | number,
})

function submitEnqueue() {
    enqueueForm.post(route('admin.jobs.enqueue-anime'), {
        preserveScroll: true,
        onSuccess: () => enqueueForm.reset('anilist_id'),
    })
}

const dispatching = ref<string | null>(null)

function dispatchIncremental() {
    dispatching.value = 'incremental'
    router.post(
        route('admin.jobs.sync.incremental'),
        {},
        {
            preserveScroll: true,
            onFinish: () => { dispatching.value = null },
        },
    )
}

function dispatchStaleRefresh(batches: number | null = null) {
    dispatching.value = batches === null ? 'stale' : 'stale-batch'
    router.post(
        route('admin.jobs.sync.stale-refresh'),
        batches === null ? {} : { batches },
        {
            preserveScroll: true,
            onFinish: () => { dispatching.value = null },
        },
    )
}

function clearExclusions() {
    if (!window.confirm(
        `Clear the refresh exclusion on all ${props.metrics.refresh_excluded} anime? They will all be swept again on the next refresh run.`,
    )) {
        return
    }

    dispatching.value = 'exclusions'
    router.delete(route('admin.jobs.refresh-exclusions.clear'), {
        preserveScroll: true,
        onFinish: () => { dispatching.value = null },
    })
}

function refresh() {
    router.reload()
}

const retryingUuid = ref<string | null>(null)
const forgettingUuid = ref<string | null>(null)

function retryJob(uuid: string) {
    retryingUuid.value = uuid
    router.post(
        route('admin.jobs.failed.retry', { uuid }),
        {},
        {
            preserveScroll: true,
            onFinish: () => { retryingUuid.value = null },
        },
    )
}

const flushingFailed = ref(false)

function flushFailedJobs() {
    if (!window.confirm(
        `Clear all ${props.metrics.failed_total} failed job(s)? They cannot be retried afterwards.`,
    )) {
        return
    }

    flushingFailed.value = true
    router.delete(route('admin.jobs.failed.flush'), {
        preserveScroll: true,
        onFinish: () => { flushingFailed.value = false },
    })
}

function forgetJob(uuid: string) {
    forgettingUuid.value = uuid
    router.delete(route('admin.jobs.failed.forget', { uuid }), {
        preserveScroll: true,
        onFinish: () => { forgettingUuid.value = null },
    })
}

const syncRunsInProgress = computed(() =>
    props.syncRuns.some((run) => run.status === 'running' || run.status === 'paused'),
)

function runTitle(run: SyncRun): string {
    const mode = run.mode.replace(/_/g, ' ')
    return run.label ? `${mode} · ${run.label}` : mode
}

// The stale sweep walks batches of anime; the other modes walk AniList pages.
function unitFor(run: SyncRun): string {
    return run.mode === 'stale_refresh' ? 'Batch' : 'Page'
}

function processedLabel(run: SyncRun): string | null {
    if (run.total_items <= 0) return null
    return `${run.processed_items.toLocaleString()} of ${run.total_items.toLocaleString()} processed`
}

// Progress only moves while a worker is writing heartbeats, so poll for as
// long as something is actually running and stop as soon as it settles.
const POLL_MS = 5000
let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
    if (pollTimer !== null) {
        clearInterval(pollTimer)
        pollTimer = null
    }
}

function startPolling() {
    if (pollTimer !== null) return
    pollTimer = setInterval(() => {
        // Don't keep hitting the endpoint for a tab nobody is looking at.
        if (document.visibilityState !== 'visible') return
        router.reload({ only: ['metrics', 'syncRuns'] })
    }, POLL_MS)
}

function syncPolling() {
    if (syncRunsInProgress.value) {
        startPolling()
    } else {
        stopPolling()
    }
}

onMounted(syncPolling)
onBeforeUnmount(stopPolling)
watch(syncRunsInProgress, syncPolling)

function syncStatusColor(status: string): string {
    if (status === 'completed') return 'text-green-400'
    if (status === 'running') return 'text-yellow-400'
    if (status === 'paused') return 'text-orange-400'
    if (status === 'failed') return 'text-red-400'
    if (status === 'superseded') return 'text-gray-500'
    return 'text-gray-500'
}

function statusLabel(run: SyncRun): string {
    if (run.stalled) return 'stalled'
    return run.status
}

function formatDate(iso?: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function formatTimestamp(ts: number | null): string {
    if (!ts) return '—'
    return new Date(ts * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function formatDuration(seconds: number | null): string {
    if (seconds === null) return '—'
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
}

function progressPercent(run: SyncRun): number | null {
    if (run.last_page <= 0) return null
    return Math.min(100, Math.round((run.current_page / run.last_page) * 100))
}
</script>

<template>
    <Head title="Job Observability" />

    <div class="mx-auto max-w-6xl space-y-6">
        <AdminNav />

        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold">Jobs &amp; Sync</h1>
                <p class="mt-1 text-sm text-gray-400">
                    Queue depth, sync status, recent failures, and tools for refreshing anime data.
                </p>
            </div>
            <button
                type="button"
                class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 transition hover:border-gray-600 hover:text-gray-100"
                @click="refresh"
            >
                Refresh
            </button>
        </div>

        <div
            v-if="flashMessage"
            class="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-2 text-sm text-green-300"
        >
            {{ flashMessage }}
        </div>

        <div
            v-if="syncError"
            class="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-2 text-sm text-red-300"
        >
            {{ syncError }}
        </div>

        <!-- Top stats grid -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ metrics.queued_total.toLocaleString() }}</div>
                <div class="mt-1 text-xs text-gray-400">Queued jobs</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold" :class="metrics.failed_total > 0 ? 'text-red-400' : 'text-primary-400'">
                    {{ metrics.failed_total.toLocaleString() }}
                </div>
                <div class="mt-1 text-xs text-gray-400">
                    Failed total
                    <span v-if="metrics.failed_last_24h > 0" class="ml-1 text-red-400">
                        ({{ metrics.failed_last_24h }} in 24h)
                    </span>
                </div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">
                    {{ formatDuration(metrics.queue_wait_seconds) }}
                </div>
                <div class="mt-1 text-xs text-gray-400">Est. time to clear</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ metrics.never_synced.toLocaleString() }}</div>
                <div class="mt-1 text-xs text-gray-400">Never synced</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ metrics.stale_sync.toLocaleString() }}</div>
                <div class="mt-1 text-xs text-gray-400">
                    Stale (&gt;{{ metrics.stale_after_days }}d / never)
                </div>
                <div class="mt-1 text-[11px] text-gray-600">
                    {{ metrics.refresh_excluded.toLocaleString() }} excluded as settled
                </div>
            </div>
        </div>

        <!-- Throughput -->
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Anime added</h2>
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <div class="text-xl font-bold text-gray-100">{{ metrics.anime_added.last_24h.toLocaleString() }}</div>
                        <div class="text-xs text-gray-500">last 24h</div>
                    </div>
                    <div>
                        <div class="text-xl font-bold text-gray-100">{{ metrics.anime_added.last_7d.toLocaleString() }}</div>
                        <div class="text-xs text-gray-500">last 7d</div>
                    </div>
                    <div>
                        <div class="text-xl font-bold text-gray-100">{{ metrics.anime_added.last_30d.toLocaleString() }}</div>
                        <div class="text-xs text-gray-500">last 30d</div>
                    </div>
                </div>
                <div class="mt-3 text-xs text-gray-500">
                    {{ metrics.anime_total.toLocaleString() }} total in DB
                </div>
            </div>

            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Anime updated</h2>
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <div class="text-xl font-bold text-gray-100">{{ metrics.anime_updated.last_24h.toLocaleString() }}</div>
                        <div class="text-xs text-gray-500">last 24h</div>
                    </div>
                    <div>
                        <div class="text-xl font-bold text-gray-100">{{ metrics.anime_updated.last_7d.toLocaleString() }}</div>
                        <div class="text-xs text-gray-500">last 7d</div>
                    </div>
                    <div>
                        <div class="text-xl font-bold text-gray-100">{{ metrics.anime_updated.last_30d.toLocaleString() }}</div>
                        <div class="text-xs text-gray-500">last 30d</div>
                    </div>
                </div>
                <div class="mt-3 text-xs text-gray-500">Tracked via <code class="text-gray-400">synced_at</code></div>
            </div>
        </div>

        <!-- Queue breakdown -->
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Queued by queue</h2>
                <div class="space-y-2">
                    <div
                        v-for="row in metrics.queued_by_queue"
                        :key="`q-${row.queue}`"
                        class="flex items-center justify-between border-b border-gray-800/60 pb-1.5 text-sm last:border-b-0"
                    >
                        <span class="font-mono text-gray-300">{{ row.queue }}</span>
                        <span :class="row.count > 0 ? 'text-primary-300' : 'text-gray-600'">
                            {{ row.count.toLocaleString() }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Failed by queue</h2>
                <div class="space-y-2">
                    <div
                        v-for="row in metrics.failed_by_queue"
                        :key="`f-${row.queue}`"
                        class="flex items-center justify-between border-b border-gray-800/60 pb-1.5 text-sm last:border-b-0"
                    >
                        <span class="font-mono text-gray-300">{{ row.queue }}</span>
                        <span :class="row.count > 0 ? 'text-red-400' : 'text-gray-600'">
                            {{ row.count.toLocaleString() }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sync runs -->
        <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Sync runs
                <span class="ml-2 text-xs font-normal normal-case text-gray-600">
                    latest run per mode
                </span>
                <span
                    v-if="syncRunsInProgress"
                    class="ml-2 text-xs font-normal normal-case text-yellow-400"
                >
                    · live, refreshing every {{ POLL_MS / 1000 }}s
                </span>
            </h2>
            <div v-if="syncRuns.length === 0" class="py-6 text-center text-sm text-gray-500">
                No sync has run yet.
            </div>
            <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div
                    v-for="run in syncRuns"
                    :key="`sync-${run.id}`"
                    class="rounded-lg border border-gray-800 bg-gray-950 p-3"
                >
                    <div class="flex items-start justify-between gap-2">
                        <span class="text-sm font-medium capitalize text-gray-200">{{ runTitle(run) }}</span>
                        <span
                            class="shrink-0 text-xs font-medium capitalize"
                            :class="run.stalled ? 'text-orange-400' : syncStatusColor(run.status)"
                        >
                            {{ statusLabel(run) }}
                        </span>
                    </div>

                    <div class="mt-2 text-xs text-gray-500">
                        {{ unitFor(run) }} {{ run.current_page }}/{{ run.last_page || '?' }}
                        <span v-if="processedLabel(run)">
                            · {{ processedLabel(run) }}
                        </span>
                        <span v-else-if="run.processed_items">
                            · {{ run.processed_items.toLocaleString() }} items
                        </span>
                    </div>
                    <div
                        v-if="progressPercent(run) !== null"
                        class="mt-1 h-1.5 w-full overflow-hidden rounded bg-gray-800"
                    >
                        <div
                            class="h-full bg-primary-500 transition-all"
                            :style="{ width: `${progressPercent(run)}%` }"
                        />
                    </div>

                    <div class="mt-2 space-y-0.5 text-[11px] text-gray-600">
                        <div>Started {{ formatDate(run.started_at) }}</div>
                        <div v-if="run.finished_at">
                            Finished {{ formatDate(run.finished_at) }} · took
                            {{ formatDuration(run.duration_seconds) }}
                        </div>
                        <div v-else>Running for {{ formatDuration(run.duration_seconds) }}</div>
                        <div v-if="run.cutoff_at">
                            Updated-since cutoff {{ formatTimestamp(run.cutoff_at) }}
                        </div>
                    </div>

                    <!-- A completed run can still carry a message (a sweep that
                         stopped at the AniList page depth limit, say). That is a
                         notice, not a failure, so it is not dressed as one. -->
                    <div
                        v-if="run.last_error"
                        class="mt-2 break-words rounded px-2 py-1 text-[11px]"
                        :class="
                            run.status === 'completed'
                                ? 'bg-amber-950/40 text-amber-300'
                                : 'bg-red-950/40 text-red-300'
                        "
                    >
                        {{ run.last_error }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">Queue an anime refresh</h2>
                <p class="mb-3 text-xs text-gray-500">
                    Dispatches a job that fetches the AniList record and re-persists it. Useful for fixing stale entries.
                </p>
                <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="submitEnqueue">
                    <input
                        v-model="enqueueForm.anilist_id"
                        type="number"
                        min="1"
                        placeholder="AniList ID (e.g. 21)"
                        class="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                        type="submit"
                        :disabled="enqueueForm.processing || !enqueueForm.anilist_id"
                        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {{ enqueueForm.processing ? 'Queueing…' : 'Queue refresh' }}
                    </button>
                </form>
                <div v-if="enqueueForm.errors.anilist_id" class="mt-2 text-xs text-red-400">
                    {{ enqueueForm.errors.anilist_id }}
                </div>
            </div>

            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">Trigger incremental sync</h2>
                <p class="mb-3 text-xs text-gray-500">
                    Fetches anime updated on AniList since the last completed incremental run. Falls back to the last 24h if there is no prior run.
                </p>
                <button
                    type="button"
                    :disabled="dispatching === 'incremental'"
                    class="rounded-lg border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-gray-200 transition hover:border-primary-500 hover:text-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="dispatchIncremental"
                >
                    {{ dispatching === 'incremental' ? 'Dispatching…' : 'Dispatch incremental sync' }}
                </button>
            </div>
        </div>

        <!-- Stale backlog -->
        <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">Stale data backlog</h2>
            <p class="mb-4 text-xs text-gray-500">
                Walks anime whose local copy is older than {{ metrics.stale_after_days }} days, a batch per AniList
                request. Long-finished shows and entries that no longer exist upstream are flagged as settled once
                refreshed, so the backlog shrinks instead of cycling — the monthly FINISHED incremental sync still
                picks up genuine upstream edits.
            </p>

            <div class="grid gap-4 sm:grid-cols-3">
                <div class="rounded-lg border border-gray-800 bg-gray-950 p-3">
                    <div class="text-xl font-bold text-gray-100">{{ metrics.stale_sync.toLocaleString() }}</div>
                    <div class="text-xs text-gray-500">awaiting refresh</div>
                </div>
                <div class="rounded-lg border border-gray-800 bg-gray-950 p-3">
                    <div class="text-xl font-bold text-gray-100">{{ metrics.refresh_excluded.toLocaleString() }}</div>
                    <div class="text-xs text-gray-500">excluded as settled</div>
                </div>
                <div class="rounded-lg border border-gray-800 bg-gray-950 p-3">
                    <div
                        v-for="row in metrics.refresh_excluded_by_reason"
                        :key="`ex-${row.reason}`"
                        class="flex items-center justify-between text-xs"
                    >
                        <span class="font-mono text-gray-400">{{ row.reason }}</span>
                        <span class="text-gray-300">{{ row.count.toLocaleString() }}</span>
                    </div>
                    <div
                        v-if="metrics.refresh_excluded_by_reason.length === 0"
                        class="text-xs text-gray-600"
                    >
                        Nothing excluded yet
                    </div>
                </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    :disabled="dispatching !== null || metrics.stale_sync === 0"
                    class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="dispatchStaleRefresh(1)"
                >
                    {{ dispatching === 'stale-batch' ? 'Dispatching…' : `Run one batch (${metrics.refresh_batch_size})` }}
                </button>
                <button
                    type="button"
                    :disabled="dispatching !== null || metrics.stale_sync === 0"
                    class="rounded-lg border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-gray-300 transition hover:border-primary-500 hover:text-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="dispatchStaleRefresh()"
                >
                    {{ dispatching === 'stale' ? 'Dispatching…' : `Run full sweep (up to ${metrics.refresh_max_batches * metrics.refresh_batch_size})` }}
                </button>
                <button
                    type="button"
                    :disabled="dispatching !== null || metrics.refresh_excluded === 0"
                    class="rounded-lg border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-600 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="clearExclusions"
                >
                    {{ dispatching === 'exclusions' ? 'Clearing…' : 'Clear exclusions' }}
                </button>
            </div>
            <p class="mt-2 text-[11px] text-gray-600">
                One batch is a single AniList request covering {{ metrics.refresh_batch_size }} anime. Each run picks
                up where the last left off, so you can step through the backlog a batch at a time — the counter above
                drops as they are refreshed or flagged.
            </p>
            <p v-if="syncRunsInProgress" class="mt-2 text-[11px] text-gray-600">
                A sync is already in progress; a refresh sweep will queue behind it on the sync worker.
            </p>
        </div>

        <!-- Recent failed jobs -->
        <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-400">
                    Recent failures
                    <span class="ml-2 text-xs font-normal normal-case text-gray-600">
                        {{ recentFailed.length }} of {{ metrics.failed_total.toLocaleString() }} shown
                    </span>
                </h2>
                <button
                    v-if="metrics.failed_total > 0"
                    type="button"
                    :disabled="flushingFailed"
                    class="rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-700 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="flushFailedJobs"
                >
                    {{ flushingFailed ? 'Clearing…' : `Clear all (${metrics.failed_total.toLocaleString()})` }}
                </button>
            </div>
            <div v-if="recentFailed.length === 0" class="py-6 text-center text-sm text-gray-500">
                No recent failures.
            </div>
            <div v-else class="space-y-2">
                <div
                    v-for="job in recentFailed"
                    :key="job.uuid"
                    class="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm"
                >
                    <div class="flex flex-wrap items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-xs text-gray-400">{{ job.queue }}</span>
                                <span class="text-gray-200">{{ job.job_class ?? 'unknown' }}</span>
                            </div>
                            <div class="mt-1 break-words text-xs text-red-300">{{ job.exception_summary }}</div>
                            <div class="mt-1 text-[11px] text-gray-500">
                                {{ formatDate(job.failed_at) }} · <span class="font-mono">{{ job.uuid }}</span>
                            </div>
                        </div>
                        <div class="flex shrink-0 gap-2">
                            <button
                                type="button"
                                class="rounded bg-primary-600/20 px-2.5 py-1 text-xs text-primary-300 transition hover:bg-primary-600/30 disabled:opacity-50"
                                :disabled="retryingUuid === job.uuid"
                                @click="retryJob(job.uuid)"
                            >
                                {{ retryingUuid === job.uuid ? 'Retrying…' : 'Retry' }}
                            </button>
                            <button
                                type="button"
                                class="rounded bg-gray-800 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-gray-700 disabled:opacity-50"
                                :disabled="forgettingUuid === job.uuid"
                                @click="forgetJob(job.uuid)"
                            >
                                {{ forgettingUuid === job.uuid ? 'Removing…' : 'Forget' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent activity -->
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Recently added anime</h2>
                <div v-if="recentlyAdded.length === 0" class="py-4 text-center text-sm text-gray-500">
                    Nothing new yet.
                </div>
                <ul v-else class="space-y-2">
                    <li
                        v-for="anime in recentlyAdded"
                        :key="`a-${anime.id}`"
                        class="flex items-center justify-between gap-3 text-sm"
                    >
                        <div class="flex min-w-0 items-center gap-2">
                            <img
                                v-if="anime.cover_image_medium"
                                :src="anime.cover_image_medium"
                                :alt="anime.title"
                                class="h-9 w-7 flex-shrink-0 rounded object-cover"
                            />
                            <div class="min-w-0">
                                <div class="truncate text-gray-200">{{ anime.title }}</div>
                                <div class="text-[11px] text-gray-500">AniList #{{ anime.anilist_id }}</div>
                            </div>
                        </div>
                        <span class="shrink-0 text-xs text-gray-500">{{ formatDate(anime.created_at) }}</span>
                    </li>
                </ul>
            </div>

            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Recently synced anime</h2>
                <div v-if="recentlyUpdated.length === 0" class="py-4 text-center text-sm text-gray-500">
                    No sync activity yet.
                </div>
                <ul v-else class="space-y-2">
                    <li
                        v-for="anime in recentlyUpdated"
                        :key="`u-${anime.id}`"
                        class="flex items-center justify-between gap-3 text-sm"
                    >
                        <div class="flex min-w-0 items-center gap-2">
                            <img
                                v-if="anime.cover_image_medium"
                                :src="anime.cover_image_medium"
                                :alt="anime.title"
                                class="h-9 w-7 flex-shrink-0 rounded object-cover"
                            />
                            <div class="min-w-0">
                                <div class="truncate text-gray-200">{{ anime.title }}</div>
                                <div class="text-[11px] text-gray-500">AniList #{{ anime.anilist_id }}</div>
                            </div>
                        </div>
                        <span class="shrink-0 text-xs text-gray-500">{{ formatDate(anime.synced_at) }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
