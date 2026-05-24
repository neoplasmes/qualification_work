import { createHash, randomUUID } from 'node:crypto';

import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export type RedisConfig = {
    host: string;
    port: number;
    password?: string;
    db?: number;
};

export async function createRedisClient(config: RedisConfig): Promise<RedisClient> {
    const client = createClient({
        socket: { host: config.host, port: config.port },
        password: config.password,
        database: config.db ?? 0,
    });

    await client.connect();

    return client;
}

type RedisCacheClient = Pick<RedisClient, 'get' | 'set' | 'del' | 'eval'> & {
    unlink?: RedisClient['unlink'];
};

export type RedisCacheOptions = {
    namespace: string;
    defaultTtlSeconds: number;
};

export type RememberJsonOptions = {
    key: string | unknown[];
    tags?: string[];
    ttlSeconds?: number;
    lockTtlMs?: number;
};

export type Executable<I extends unknown[] = unknown[], O = unknown> = {
    execute(...args: I): O | Promise<O>;
};

export type ExecutableCacheSpec<I extends unknown[]> = {
    key: (...args: I) => string | unknown[];
    tags?: (...args: I) => string[];
    ttlSeconds?: number | ((...args: I) => number);
    lockTtlMs?: number;
};

export type RedisCache = {
    rememberJson<T>(
        options: RememberJsonOptions,
        producer: () => Promise<T> | T
    ): Promise<T>;
    invalidateTags(tags: string[]): Promise<void>;
    invalidateKeys(keys: Array<string | unknown[]>): Promise<void>;
    wrapExecutable<I extends unknown[], O, T extends Executable<I, O>>(
        executable: T,
        spec: ExecutableCacheSpec<I>
    ): T;
};

const SET_TAGGED_SCRIPT = `
redis.call('SET', KEYS[1], ARGV[1], 'EX', tonumber(ARGV[2]))
local tagTtl = tonumber(ARGV[2]) + 60
for i = 3, #ARGV do
    redis.call('SADD', ARGV[i], KEYS[1])
    redis.call('EXPIRE', ARGV[i], tagTtl)
end
return 1
`;

const INVALIDATE_TAGS_SCRIPT = `
local deleted = 0
for i = 1, #KEYS do
    local members = redis.call('SMEMBERS', KEYS[i])
    for j = 1, #members do
        redis.call('UNLINK', members[j])
        deleted = deleted + 1
    end
    redis.call('DEL', KEYS[i])
end
return deleted
`;

const UNLOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
`;

export function buildCacheKey(parts: unknown[]): string {
    return createHash('sha256').update(stableStringify(parts)).digest('hex');
}

export function createRedisCache(
    redis: RedisCacheClient,
    options: RedisCacheOptions
): RedisCache {
    const defaultTtlSeconds = options.defaultTtlSeconds;
    const namespace = sanitizeNamespace(options.namespace);

    const cacheKey = (key: string | unknown[]) =>
        `${namespace}:cache:${typeof key === 'string' ? key : buildCacheKey(key)}`;
    const tagKey = (tag: string) => `${namespace}:tag:${tag}`;
    const lockKey = (key: string) => `${namespace}:lock:${key}`;

    async function getJson<T>(key: string): Promise<T | undefined> {
        const raw = await redis.get(key);

        if (raw === null) {
            return undefined;
        }

        return JSON.parse(raw) as T;
    }

    async function setJson<T>(
        key: string,
        tags: string[],
        ttlSeconds: number,
        value: T
    ): Promise<void> {
        await redis.eval(SET_TAGGED_SCRIPT, {
            keys: [key],
            arguments: [JSON.stringify(value), String(ttlSeconds), ...tags.map(tagKey)],
        });
    }

    async function rememberJson<T>(
        rememberOptions: RememberJsonOptions,
        producer: () => Promise<T> | T
    ): Promise<T> {
        const key = cacheKey(rememberOptions.key);
        const ttlSeconds = rememberOptions.ttlSeconds ?? defaultTtlSeconds;
        const lockTtlMs = rememberOptions.lockTtlMs ?? 1000;
        const tags = rememberOptions.tags ?? [];

        try {
            const cached = await getJson<T>(key);
            if (cached !== undefined) {
                return cached;
            }
        } catch {
            return producer();
        }

        const lock = lockKey(key);
        const token = randomUUID();
        let locked = false;

        try {
            const result = await redis.set(lock, token, { NX: true, PX: lockTtlMs });
            locked = result === 'OK';
        } catch {
            return producer();
        }

        if (!locked) {
            const waited = await waitForCachedValue<T>(key, Math.min(lockTtlMs, 250));
            if (waited.hit) {
                return waited.value;
            }

            return producer();
        }

        try {
            const value = await producer();

            if (value !== undefined && value !== null) {
                try {
                    await setJson(key, tags, ttlSeconds, value);
                } catch {
                    // Cache writes must never break a successful source-of-truth read.
                }
            }

            return value;
        } finally {
            try {
                await redis.eval(UNLOCK_SCRIPT, {
                    keys: [lock],
                    arguments: [token],
                });
            } catch {
                // cache locks are best-effort; the PX ttl is the final cleanup.
            }
        }
    }

    async function waitForCachedValue<T>(
        key: string,
        maxWaitMs: number
    ): Promise<{ hit: true; value: T } | { hit: false }> {
        const deadline = Date.now() + maxWaitMs;

        while (Date.now() < deadline) {
            await sleep(25);

            try {
                const cached = await getJson<T>(key);
                if (cached !== undefined) {
                    return { hit: true, value: cached };
                }
            } catch {
                return { hit: false };
            }
        }

        return { hit: false };
    }

    async function invalidateTags(tags: string[]): Promise<void> {
        if (tags.length === 0) {
            return;
        }

        try {
            await redis.eval(INVALIDATE_TAGS_SCRIPT, {
                keys: [...new Set(tags)].map(tagKey),
                arguments: [],
            });
        } catch {
            // fail-open: invalidation misses are bounded by TTL.
        }
    }

    async function invalidateKeys(keys: Array<string | unknown[]>): Promise<void> {
        if (keys.length === 0) {
            return;
        }

        try {
            const redisKeys = keys.map(cacheKey);
            if (redis.unlink) {
                await redis.unlink(redisKeys);
            } else {
                await redis.del(redisKeys);
            }
        } catch {
            // fail-open: invalidation misses are bounded by TTL.
        }
    }

    function wrapExecutable<I extends unknown[], O, T extends Executable<I, O>>(
        executable: T,
        spec: ExecutableCacheSpec<I>
    ): T {
        return {
            execute: (...args: I) => {
                const ttlSeconds =
                    typeof spec.ttlSeconds === 'function'
                        ? spec.ttlSeconds(...args)
                        : spec.ttlSeconds;

                return rememberJson(
                    {
                        key: spec.key(...args),
                        tags: spec.tags?.(...args),
                        ttlSeconds,
                        lockTtlMs: spec.lockTtlMs,
                    },
                    () => executable.execute(...args)
                );
            },
        } as T;
    }

    return {
        rememberJson,
        invalidateTags,
        invalidateKeys,
        wrapExecutable,
    };
}

function sanitizeNamespace(namespace: string): string {
    return namespace.replace(/[^a-zA-Z0-9:_-]/g, '_');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
        .join(',')}}`;
}
