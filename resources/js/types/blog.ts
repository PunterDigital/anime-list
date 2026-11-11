// Card 4481: the public blog pages' props (BlogController).

export interface BlogCover {
    url: string
    width: number | null
    height: number | null
}

export interface BlogPostCard {
    title: string
    slug: string
    excerpt: string | null
    cover: BlogCover | null
    published_at: string | null
    /** Formatted on the server, so SSR and the browser agree. */
    published_label: string | null
    author: string | null
}

export interface BlogPostFull extends BlogPostCard {
    body_html: string
    updated_at: string | null
}

export interface BlogIndexSeo {
    title: string
    description: string
    url: string
    feed: string
}

export interface BlogPostSeo extends BlogIndexSeo {
    image: string | null
    published_time: string | null
    modified_time: string | null
    noindex: boolean
}
