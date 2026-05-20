import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../../../..');

export default async function globalTeardown() {
    spawnSync('moon', ['run', 'client:dev-compose-down'], {
        cwd: repoRoot,
        env: process.env,
        stdio: 'inherit',
    });
}
