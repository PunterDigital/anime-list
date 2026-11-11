<?php

namespace App\Support;

use League\CommonMark\GithubFlavoredMarkdownConverter;

/**
 * Renders blog Markdown to HTML (card 4479). Raw HTML in the source is
 * stripped and javascript:/vbscript:/data: links are dropped, so a post
 * (pasted from an AI draft or anywhere else) can't run scripts on the site.
 */
class BlogMarkdown
{
    public static function toHtml(string $markdown): string
    {
        $converter = new GithubFlavoredMarkdownConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
            'max_nesting_level' => 50,
        ]);

        return (string) $converter->convert($markdown);
    }
}
