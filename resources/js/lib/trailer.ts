// Card 5704: the anime page's trailer. AniList gives a YouTube or Dailymotion
// id, stored as a watch URL (AnimeData::buildTrailerUrl).

export interface Trailer {
    site: 'youtube' | 'dailymotion'
    id: string
    /** Player URL that starts playing at once (only loaded after a click). */
    embedUrl: string
    /** Still image for the facade; Dailymotion's isn't on a host the CSP allows. */
    thumbnailUrl: string | null
}

const VIDEO_ID = /^[A-Za-z0-9_-]{1,64}$/

export function parseTrailer(url: string | null | undefined): Trailer | null {
    if (!url) return null

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return null
    }

    const host = parsed.hostname.replace(/^www\.|^m\./, '')

    if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
        const id = host === 'youtu.be'
            ? parsed.pathname.slice(1)
            : parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop() ?? ''
        if (!VIDEO_ID.test(id)) return null

        return {
            site: 'youtube',
            id,
            // youtube-nocookie: no YouTube cookies until the visitor plays it.
            embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
            thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        }
    }

    if (host === 'dailymotion.com') {
        const id = parsed.pathname.split('/').pop() ?? ''
        if (!VIDEO_ID.test(id)) return null

        return {
            site: 'dailymotion',
            id,
            embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`,
            thumbnailUrl: null,
        }
    }

    return null
}
