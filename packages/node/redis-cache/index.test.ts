import { describe, expect, it } from 'vitest';

import { buildCacheKey, createRedisCache } from './index.ts';

type SetOptions = { NX?: boolean; PX?: number };

class FakeRedis {
    private readonly values = new Map<string, { value: string; expiresAt: number | null }>();
    private readonly sets = new Map<string, Set<string>>();

    async get(key: string): Promise<string | null> {
        const entry = this.values.get(key);
        if (!entry) {
            return null;
        }

        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this.values.delete(key);

            return null;
        }

        return entry.value;
    }

    async set(key: string, value: string, opts?: SetOptions): Promise<'OK' | null> {
        if (opts?.NX && this.hasLiveValue(key)) {
            return null;
        }

        this.values.set(key, {
            value,
            expiresAt: opts?.PX ? Date.now() + opts.PX : null,
        });

        return 'OK';
    }

    async del(keys: string | string[]): Promise<number> {
        const list = Array.isArray(keys) ? keys : [keys];
        let count = 0;

        for (const key of list) {
            if (this.values.delete(key) || this.sets.delete(key)) {
                count += 1;
            }
        }

        return count;
    }

    async unlink(keys: string | string[]): Promise<number> {
        return this.del(keys);
    }

    async eval(script: string, options: { keys: string[]; arguments: string[] }) {
        if (script.includes('SMEMBERS')) {
            let deleted = 0;

            for (const tagKey of options.keys) {
                const members = this.sets.get(tagKey) ?? new Set<string>();
                for (const key of members) {
                    if (this.values.delete(key)) {
                        deleted += 1;
                    }
                }
                this.sets.delete(tagKey);
            }

            return deleted;
        }

        if (script.includes("redis.call('GET', KEYS[1]) == ARGV[1]")) {
            const current = await this.get(options.keys[0]);
            if (current === options.arguments[0]) {
                return this.del(options.keys[0]);
            }

            return 0;
        }

        const [value, ttl, ...tagKeys] = options.arguments;
        this.values.set(options.keys[0], {
            value,
            expiresAt: Date.now() + Number(ttl) * 1000,
        });

        for (const tagKey of tagKeys) {
            const set = this.sets.get(tagKey) ?? new Set<string>();
            set.add(options.keys[0]);
            this.sets.set(tagKey, set);
        }

        return 1;
    }

    private hasLiveValue(key: string): boolean {
        const entry = this.values.get(key);
        if (!entry) {
            return false;
        }

        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this.values.delete(key);

            return false;
        }

        return true;
    }
}

describe('redis-cache', () => {
    it('builds deterministic stable keys', () => {
        expect(buildCacheKey([{ b: 2, a: 1 }])).toBe(
            buildCacheKey([{ a: 1, b: 2 }])
        );
    });

    it('returns cached json values', async () => {
        const cache = createRedisCache(new FakeRedis() as never, {
            namespace: 'test',
            defaultTtlSeconds: 60,
        });
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
        const cache = createRedisCache(new FakeRedis() as never, {
            namespace: 'test',
            defaultTtlSeconds: 60,
        });

        await cache.rememberJson({ key: ['a'], tags: ['tag'] }, () => 1);
        await cache.rememberJson({ key: ['b'], tags: ['tag'] }, () => 2);
        await cache.invalidateTags(['tag']);

        const value = await cache.rememberJson({ key: ['a'], tags: ['tag'] }, () => 3);

        expect(value).toBe(3);
    });

    it('coalesces concurrent misses with a lock', async () => {
        const cache = createRedisCache(new FakeRedis() as never, {
            namespace: 'test',
            defaultTtlSeconds: 60,
        });
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
