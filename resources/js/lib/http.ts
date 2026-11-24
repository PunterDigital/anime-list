/**
 * A small fetch wrapper with the slice of axios' API the app used (card 5710):
 * axios was 21 KB gzipped of JS on Home, the anime page and My List for a few
 * JSON calls.
 *
 * Like axios with Laravel it sends `X-Requested-With`, `Accept: application/json`
 * and the `X-XSRF-TOKEN` header from the `XSRF-TOKEN` cookie (same-origin
 * requests only), sends plain objects as JSON and FormData as is, and rejects
 * a non-2xx answer with an HttpError whose `response` has `status` and the
 * parsed `data`, so `isHttpError(e) && e.response.data.message` keeps working.
 */

type Params = Record<string, string | number | boolean | null | undefined>

export interface HttpOptions {
    params?: Params
    signal?: AbortSignal
    headers?: Record<string, string>
}

export interface HttpResponse<T> {
    data: T
    status: number
}

export class HttpError extends Error {
    readonly response: {
        status: number
        // The body as the server sent it (JSON when it says so), like axios'.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(status: number, data: any) {
        super(`Request failed with status code ${status}`)
        this.name = 'HttpError'
        this.response = { status, data }
    }
}

export function isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError
}

function xsrfToken(): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : null
}

function buildUrl(url: string, params?: Params): URL {
    const base = typeof window === 'undefined' ? 'http://localhost' : window.location.href
    const target = new URL(url, base)
    for (const [key, value] of Object.entries(params ?? {})) {
        if (value === null || value === undefined) continue
        target.searchParams.append(key, String(value))
    }
    return target
}

async function request<T>(method: string, url: string, body?: unknown, options: HttpOptions = {}): Promise<HttpResponse<T>> {
    const target = buildUrl(url, options.params)
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
    }

    const sameOrigin = typeof window === 'undefined' || target.origin === window.location.origin
    const token = sameOrigin ? xsrfToken() : null
    if (token) headers['X-XSRF-TOKEN'] = token

    let payload: BodyInit | undefined
    if (body instanceof FormData) {
        payload = body
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
        payload = JSON.stringify(body)
    }

    const response = await fetch(target, {
        method,
        headers,
        body: payload,
        signal: options.signal,
        credentials: 'same-origin',
    })

    const text = response.status === 204 ? '' : await response.text()
    const isJson = (response.headers.get('Content-Type') ?? '').includes('json')
    let data: unknown = text
    if (text !== '' && isJson) {
        try {
            data = JSON.parse(text)
        } catch {
            data = text
        }
    } else if (text === '') {
        data = null
    }

    if (!response.ok) {
        throw new HttpError(response.status, data)
    }

    return { data: data as T, status: response.status }
}

export const http = {
    get: <T = unknown>(url: string, options?: HttpOptions) => request<T>('GET', url, undefined, options),
    delete: <T = unknown>(url: string, options?: HttpOptions) => request<T>('DELETE', url, undefined, options),
    post: <T = unknown>(url: string, body?: unknown, options?: HttpOptions) => request<T>('POST', url, body, options),
    put: <T = unknown>(url: string, body?: unknown, options?: HttpOptions) => request<T>('PUT', url, body, options),
    patch: <T = unknown>(url: string, body?: unknown, options?: HttpOptions) => request<T>('PATCH', url, body, options),
}
