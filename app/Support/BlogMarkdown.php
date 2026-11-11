<?php

namespace App\Support;

use League\CommonMark\Environment\Environment;
use League\CommonMark\Event\DocumentParsedEvent;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\MarkdownConverter;

/**
 * Renders blog Markdown to HTML (card 4479). Raw HTML in the source is
 * stripped and javascript:/vbscript:/data: links are dropped, so a post
 * (pasted from an AI draft or anywhere else) can't run scripts on the site.
 *
 * Images load lazily, and uploaded ones (card 4480, `/media/blog/...`) get
 * their width and height from the stored name, so the page doesn't jump
 * while they load.
 */
class BlogMarkdown
{
    public static function toHtml(string $markdown): string
    {
        $environment = new Environment([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
            'max_nesting_level' => 50,
        ]);
        $environment->addExtension(new CommonMarkCoreExtension);
        $environment->addExtension(new GithubFlavoredMarkdownExtension);
        $environment->addEventListener(DocumentParsedEvent::class, [self::class, 'decorateImages']);

        return (string) (new MarkdownConverter($environment))->convert($markdown);
    }

    /** @internal CommonMark event listener */
    public static function decorateImages(DocumentParsedEvent $event): void
    {
        foreach ($event->getDocument()->iterator() as $node) {
            if (! $node instanceof Image) {
                continue;
            }

            $attributes = [
                'loading' => 'lazy',
                'decoding' => 'async',
            ];

            $size = BlogImages::dimensionsFromUrl($node->getUrl());
            if ($size !== null) {
                $attributes['width'] = (string) $size[0];
                $attributes['height'] = (string) $size[1];
            }

            foreach ($attributes as $name => $value) {
                $node->data->set('attributes/'.$name, $value);
            }
        }
    }
}
