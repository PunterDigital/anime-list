export interface PaginatedResponse<T> {
    data: T[]
    meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
    links: {
        first: string | null
        last: string | null
        prev: string | null
        next: string | null
    }
}

export interface ApiResponse<T> {
    data: T
}

export interface ApiError {
    message: string
    errors?: Record<string, string[]>
}

export interface SearchResponse {
    data: import('./anime').AnimeCard[]
    query: string
    total: number
    /** True while an AniList lookup for this text is queued (card 5707). */
    pending?: boolean
}
