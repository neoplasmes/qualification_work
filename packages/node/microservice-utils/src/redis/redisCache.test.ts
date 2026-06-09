import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createRedisCache, createRedisClient, type RedisClient } from './index.ts';

const redisPort = 6379;
const redisImage = 'redis:8.6-alpine';

let container: StartedTestContainer | undefined;
let redis: RedisClient | undefined;

beforeAll(async () => {
    container = await new GenericContainer(redisImage)
        .withExposedPorts(redisPort)
        .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
        .start();

    redis = await createRedisClient({
        host: container.getHost(),
        port: container.getMappedPort(redisPort),
    });
}, 60_000);

beforeEach(async () => {
    await redis?.sendCommand(['FLUSHDB']);
});

afterAll(async () => {
    redis?.destroy();
    await container?.stop();
});

function createTestCache() {
    if (!redis) {
        throw new Error('Redis test container is not started');
    }

    return createRedisCache(redis, {
        namespace: 'test',
        defaultTtlSeconds: 60,
    });
}

describe('redis cache', () => {
    it('uses stable object cache keys', async () => {
        const cache = createTestCache();
        let calls = 0;

        const first = await cache.rememberJson({ key: [{ b: 2, a: 1 }] }, () => {
            calls += 1;

            return { ok: true };
        });
        const second = await cache.rememberJson({ key: [{ a: 1, b: 2 }] }, () => {
            calls += 1;

            return { ok: false };
        });

        expect(first).toEqual({ ok: true });
        expect(second).toEqual({ ok: true });
        expect(calls).toBe(1);
    });

    it('returns cached json values', async () => {
        const cache = createTestCache();
        let calls = 0;

        const first = await cache.rememberJson({ key: ['k'], tags: ['tag'] }, () => {
            calls += 1;

            return { ok: true };
        });
        const second = await cache.rememberJson({ key: ['k'], tags: ['tag'] }, () => {
            calls += 1;

            return { ok: false };
        });

        expect(first).toEqual({ ok: true });
        expect(second).toEqual({ ok: true });
        expect(calls).toBe(1);
    });

    it('invalidates all entries under a tag', async () => {
        const cache = createTestCache();

        await cache.rememberJson({ key: ['a'], tags: ['tag'] }, () => 1);
        await cache.rememberJson({ key: ['b'], tags: ['tag'] }, () => 2);
        await cache.invalidateTags(['tag']);

        const value = await cache.rememberJson({ key: ['a'], tags: ['tag'] }, () => 3);

        expect(value).toBe(3);
    });

    it('coalesces concurrent misses with a lock', async () => {
        const cache = createTestCache();
        let calls = 0;

        const producer = async () => {
            calls += 1;
            await new Promise(resolve => setTimeout(resolve, 50));

            return { calls };
        };

        const [a, b] = await Promise.all([
            cache.rememberJson({ key: ['slow'], lockTtlMs: 500 }, producer),
            cache.rememberJson({ key: ['slow'], lockTtlMs: 500 }, producer),
        ]);

        expect(a).toEqual({ calls: 1 });
        expect(b).toEqual({ calls: 1 });
        expect(calls).toBe(1);
    });
});
