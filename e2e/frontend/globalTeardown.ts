import { spawnSync } from 'node:child_process';
import path from 'node:path';

const composeFile = path.resolve(
    import.meta.dirname,
    '../docker-compose/docker-compose.yaml'
);

export default async function globalTeardown() {
    spawnSync('docker', ['compose', '-f', composeFile, 'down', '-v'], {
        env: process.env,
        stdio: 'inherit',
    });
}
