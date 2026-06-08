import { createHash, randomUUID } from 'node:crypto';

import { invalidateTagsScript, setTaggedScript, unlockScript } from './scripts.ts';
import type {
    Executable,
    ExecutableCacheSpec,
    RedisCache,
    RedisCacheClient,
    RedisCacheOptions,
    RememberJsonOptions,
} from './types.ts';

export function createRedisCache(
    redis: RedisCacheClient,
    options: RedisCacheOptions
): RedisCache {
    return new RedisCacheImpl(redis, options);
}

class RedisCacheImpl implements RedisCache {
    private readonly defaultTtlSeconds: number;
    private readonly namespace: string;

    constructor(
        private readonly redis: RedisCacheClient,
        options: RedisCacheOptions
    ) {
        this.defaultTtlSeconds = options.defaultTtlSeconds;
        this.namespace = sanitizeNamespace(options.namespace);
    }

    rememberJson = async <T>(
        rememberOptions: RememberJsonOptions,
        producer: () => Promise<T> | T
    ): Promise<T> => {
        const key = this.cacheKey(rememberOptions.key);
        const ttlSeconds = rememberOptions.ttlSeconds ?? this.defaultTtlSeconds;
        const lockTtlMs = rememberOptions.lockTtlMs ?? 1000;
        const tags = rememberOptions.tags ?? [];

        try {
            const cached = await this.getJson<T>(key);
            if (cached !== undefined) {
                return cached;
            }
        } catch {
            return producer();
        }

        const lock = this.lockKey(key);
        const token = randomUUID();
        let locked = false;

        try {
            const result = await this.redis.set(lock, token, {
                NX: true,
                PX: lockTtlMs,
            });
            locked = result === 'OK';
        } catch {
            return producer();
        }

        if (!locked) {
            const waited = await this.waitForCachedValue<T>(
                key,
                Math.min(lockTtlMs, 250)
            );
            if (waited.hit) {
                return waited.value;
            }

            return producer();
        }

        try {
            const value = await producer();

            if (value !== undefined && value !== null) {
                try {
                    await this.setJson(key, tags, ttlSeconds, value);
                } catch {
                    // Cache writes must never break a successful source-of-truth read.
                }
            }

            return value;
        } finally {
            try {
                await this.redis.eval(unlockScript, {
                    keys: [lock],
                    arguments: [token],
                });
            } catch {
                // Cache locks are best-effort; the PX ttl is the final cleanup.
            }
        }
    };

    invalidateTags = async (tags: string[]): Promise<void> => {
        if (tags.length === 0) {
            return;
        }

        try {
            await this.redis.eval(invalidateTagsScript, {
                keys: [...new Set(tags)].map(tag => this.tagKey(tag)),
                arguments: [],
            });
        } catch {
            // fail-open: invalidation misses are bounded by TTL.
        }
    };

    invalidateKeys = async (keys: Array<string | unknown[]>): Promise<void> => {
        if (keys.length === 0) {
            return;
        }

        try {
            const redisKeys = keys.map(key => this.cacheKey(key));
            if (this.redis.unlink) {
                await this.redis.unlink(redisKeys);
            } else {
                await this.redis.del(redisKeys);
            }
        } catch {
            // fail-open: invalidation misses are bounded by TTL.
        }
    };

    wrapExecutable = <I extends unknown[], O, T extends Executable<I, O>>(
        executable: T,
        spec: ExecutableCacheSpec<I>
    ): T =>
        ({
            execute: (...args: I) => {
                const ttlSeconds =
                    typeof spec.ttlSeconds === 'function'
                        ? spec.ttlSeconds(...args)
                        : spec.ttlSeconds;

                return this.rememberJson(
                    {
                        key: spec.key(...args),
                        tags: spec.tags?.(...args),
                        ttlSeconds,
                        lockTtlMs: spec.lockTtlMs,
                    },
                    () => executable.execute(...args)
                );
            },
        }) as T;

    private cacheKey(key: string | unknown[]): string {
        return `${this.namespace}:cache:${
            typeof key === 'string' ? key : buildCacheKey(key)
        }`;
    }

    private tagKey(tag: string): string {
        return `${this.namespace}:tag:${tag}`;
    }

    private lockKey(key: string): string {
        return `${this.namespace}:lock:${key}`;
    }

    private async getJson<T>(key: string): Promise<T | undefined> {
        const raw = await this.redis.get(key);

        if (raw === null) {
            return undefined;
        }

        return JSON.parse(raw) as T;
    }

    private async setJson<T>(
        key: string,
        tags: string[],
        ttlSeconds: number,
        value: T
    ): Promise<void> {
        await this.redis.eval(setTaggedScript, {
            keys: [key],
            arguments: [
                JSON.stringify(value),
                String(ttlSeconds),
                ...tags.map(tag => this.tagKey(tag)),
            ],
        });
    }

    private async waitForCachedValue<T>(
        key: string,
        maxWaitMs: number
    ): Promise<{ hit: true; value: T } | { hit: false }> {
        const deadline = Date.now() + maxWaitMs;

        while (Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, 25));

            try {
                const cached = await this.getJson<T>(key);
                if (cached !== undefined) {
                    return { hit: true, value: cached };
                }
            } catch {
                return { hit: false };
            }
        }

        return { hit: false };
    }
}

function buildCacheKey(parts: unknown[]): string {
    return createHash('sha256').update(stableStringify(parts)).digest('hex');
}

function sanitizeNamespace(namespace: string): string {
    return namespace.replace(/[^a-zA-Z0-9:_-]/g, '_');
}

function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`;
    }

    if (value instanceof Date) {
        return JSON.stringify(value.toISOString());
    }

    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b)
    );

    return `{${entries
        .map(
            ([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`
        )
        .join(',')}}`;
}
