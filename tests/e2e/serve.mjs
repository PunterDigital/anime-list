// Playwright webServer: a fresh SQLite database, migrated and seeded with
// E2ESeeder, served by `php artisan serve`. The env overrides in
// playwright.config.ts beat `.env`, so a real database is never touched.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const db = process.env.DB_DATABASE;
if (!db || !db.includes('e2e')) {
    throw new Error(`Refusing to reset DB_DATABASE=${db}: expected the throwaway E2E SQLite file`);
}

mkdirSync(dirname(db), { recursive: true });
rmSync(db, { force: true });
writeFileSync(db, '');

// A stale hot file makes every page load from a dead Vite dev server.
if (existsSync('public/hot')) rmSync('public/hot');

const php = process.env.PHP_BINARY || 'php';
const artisan = (args, opts = {}) => spawnSync(php, ['artisan', ...args], { stdio: 'inherit', ...opts });

for (const args of [
    ['config:clear'],
    ['migrate:fresh', '--force', '--seeder=Database\\Seeders\\E2ESeeder', '--seed'],
]) {
    const r = artisan(args);
    if (r.status !== 0) process.exit(r.status ?? 1);
}

const server = spawn(php, ['artisan', 'serve', '--host=127.0.0.1', `--port=${process.env.E2E_PORT}`], {
    stdio: 'inherit',
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.kill(sig));
server.on('exit', (code) => process.exit(code ?? 0));
