import { spawnSync } from 'node:child_process';
import path from 'node:path';

const composeFile = path.resolve(
    import.meta.dirname,
    '../docker-compose/docker-compose.yaml'
);

export default async function globalSetup() {
    const result = spawnSync(
        'docker',
        [
            'compose',
            '-f',
            composeFile,
            'up',
            '-d',
            '--renew-anon-volumes',
            '--build',
            '--wait',
            '--wait-timeout',
            '300',
        ],
        { env: { ...process.env, DOCKER_BUILDKIT: '0' }, stdio: 'inherit' }
    );

    if (result.status !== 0) {
        throw new Error('failed to start e2e compose stack');
    }
}
