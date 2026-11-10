<?php

namespace App\Support;

/**
 * What's deployed, read from the server's git checkout. Forge deploys by pulling
 * `main` into the site folder, so `.git` names the live commit. Plain file reads,
 * no `git` process, so it works wherever PHP can read the folder.
 */
final class DeployedVersion
{
    public function __construct(private readonly string $gitDir) {}

    public static function current(): self
    {
        return new self(base_path('.git'));
    }

    /**
     * @return array{version: string, commit: string, deployed_at: string|null}
     */
    public function toArray(): array
    {
        [$commit, $refFile] = $this->resolveHead();

        return [
            'version' => $commit === null ? 'unknown' : substr($commit, 0, 7),
            'commit' => $commit ?? 'unknown',
            // When the checkout last moved: the ref file is rewritten on every pull.
            'deployed_at' => $refFile !== null && ($time = @filemtime($refFile)) !== false
                ? gmdate('Y-m-d\TH:i:s\Z', $time)
                : null,
        ];
    }

    /**
     * @return array{0: string|null, 1: string|null} the commit sha and the file it came from
     */
    private function resolveHead(): array
    {
        $headFile = $this->gitDir.'/HEAD';
        $head = is_file($headFile) ? trim((string) file_get_contents($headFile)) : '';

        if ($this->isSha($head)) {
            return [$head, $headFile];
        }

        if (! str_starts_with($head, 'ref: ')) {
            return [null, null];
        }

        $ref = trim(substr($head, 5));

        if (str_contains($ref, '..')) {
            return [null, null];
        }

        $refFile = $this->gitDir.'/'.$ref;

        if (is_file($refFile)) {
            $sha = trim((string) file_get_contents($refFile));

            return $this->isSha($sha) ? [$sha, $refFile] : [null, null];
        }

        $packed = $this->gitDir.'/packed-refs';

        if (is_file($packed)) {
            foreach (file($packed, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
                $parts = explode(' ', trim($line), 2);

                if (count($parts) === 2 && $parts[1] === $ref && $this->isSha($parts[0])) {
                    return [$parts[0], $packed];
                }
            }
        }

        return [null, null];
    }

    private function isSha(string $value): bool
    {
        return preg_match('/^[0-9a-f]{40}$/', $value) === 1;
    }
}
