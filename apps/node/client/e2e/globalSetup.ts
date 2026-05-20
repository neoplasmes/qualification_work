import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../../../..');

export default async function globalSetup() {
    const result = spawnSync('moon', ['run', 'client:dev-compose-up'], {
        cwd: repoRoot,
        env: process.env,
        stdio: 'inherit',
    });

    if (result.status !== 0) {
        throw new Error('Failed to start client dev compose stack.');
    }
}
