import { createHash, randomUUID } from 'node:crypto';

import type { RedisClient } from '../client/index.ts';
import { invalidateTagsScript, setTaggedScript, unlockScript } from './scripts.ts';
import { stableStringify } from './stableStringify.ts';
import type {
    Executable,
    ExecutableCacheOptions,
    RedisCacheConfig,
    RememberJsonOptions,
} from './types.ts';

/**
 * a wrapper, used for caching some functions result inside redis
 *
 * @export
 * @class
 */
export class RedisCache {
    constructor(
        private readonly redis: RedisClient,
        private readonly cfg: RedisCacheConfig
    ) {
        this.cfg = {
            ...cfg,
            namespace: cfg.namespace.replace(/[^a-zA-Z0-9:_-]/g, '_'),
        };
    }

    async rememberJson<T>(
        opts: RememberJsonOptions,
        fn: () => Promise<T> | T
    ): Promise<T> {
        const cacheKey = this.buildCacheKey(opts.key);
        const ttlMs = opts.ttlMs ?? this.cfg.defaultTtlMs;
        const lockTtlMs = opts.lockTtlMs ?? 1000;
        const tags = opts.tags ?? [];

        // ———————————————————————————————————————————————————————————————————————————————
        // ——————————— check cache; execute raw function if redis is not available ———————
        try {
            const cached = await this.getJson<T>(cacheKey);

            if (cached !== undefined) {
                return cached;
            }
        } catch {
            return fn();
        }

        // —————————————————————————————————————————————————————————
        // —————————————————— resourse acquisition —————————————————
        const lockKey = this.buildLockKey(cacheKey);
        const token = randomUUID();
        let acquired = false;

        try {
            const acquireAttemptResult = await this.redis.set(lockKey, token, {
                NX: true,
                PX: lockTtlMs,
            });

            acquired = acquireAttemptResult === 'OK';
        } catch {
            // execute function if redis is not available
            return fn();
        }

        if (!acquired) {
            //* ------------------------ caller is not owner --------------------
            //* -----------------------------------------------------------------
            const waited = await this.waitForCachedValue<T>(
                cacheKey,
                Math.min(lockTtlMs, 250)
            );

            if (waited.hit) {
                return waited.value;
            }

            return fn();
        } else {
            //* ----------------- caller has acquired the resource ---------------
            //* ------------------------------------------------------------------
            try {
                // we do NOT catch the error of original fn.
                const value = await fn();

                if (value !== undefined && value !== null) {
                    try {
                        await this.setJson(cacheKey, tags, ttlMs, value);
                    } catch (e: unknown) {
                        console.error(e);
                    }
                }

                return value;
            } finally {
                // unlock
                try {
                    await this.redis.eval(unlockScript, {
                        keys: [lockKey],
                        arguments: [token],
                    });
                } catch (e: unknown) {
                    console.error(e);
                }
            }
        }
    }

    async invalidateTags(tags: string[]): Promise<void> {
        if (tags.length === 0) {
            return;
        }

        try {
            await this.redis.eval(invalidateTagsScript, {
                keys: [...new Set(tags)].map(tag => this.buildTagKey(tag)),
                arguments: [],
            });
        } catch (e: unknown) {
            // TODO: add "logger" to this class params
            console.error(e);
        }
    }

    async invalidateKeys(keys: Array<string | unknown[]>): Promise<void> {
        if (keys.length === 0) {
            return;
        }

        try {
            const redisKeys = keys.map(key => this.buildCacheKey(key));

            // UNLINK frees memory asynchronously, what is very useful in the situation
            // where deletion of a quite large objects should be preformed.
            await this.redis.unlink(redisKeys);
        } catch (e: unknown) {
            // TODO: add "logger" to this class params
            console.error(e);
        }
    }

    wrapExecutable<I extends unknown[], O, T extends Executable<I, O>>(
        executable: T,
        opts: ExecutableCacheOptions<I>
    ): T {
        return {
            execute: (...args: I) => {
                return this.rememberJson(
                    {
                        key: opts.key(...args),
                        tags: opts.tags?.(...args),
                        ttlMs: opts.ttlMs,
                        lockTtlMs: opts.lockTtlMs,
                    },
                    () => executable.execute(...args)
                );
            },
        } as T;
    }

    // —————————————————————————————————————————————————————————
    // ——————————————————————— Keys ————————————————————————————

    private buildCacheKey(key: string | unknown[]): string {
        if (typeof key === 'string') {
            return `${this.cfg.namespace}:cache:${key}`;
        }

        const hashedKey = createHash('md5').update(stableStringify(key)).digest('hex');

        return `${this.cfg.namespace}:cache:${hashedKey}`;
    }

    private buildTagKey(tag: string): string {
        return `${this.cfg.namespace}:tag:${tag}`;
    }

    private buildLockKey(key: string): string {
        return `${this.cfg.namespace}:lock:${key}`;
    }

    // —————————————————————————————————————————————————————————
    // —————————————————————— Get/Set ——————————————————————————

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
        ttlMs: number,
        value: T
    ): Promise<void> {
        await this.redis.eval(setTaggedScript, {
            keys: [key],
            arguments: [
                JSON.stringify(value),
                String(ttlMs),
                ...tags.map(tag => this.buildTagKey(tag)),
            ],
        });
    }

    private readonly waitForCachedValueBadResult = {
        hit: false,
        value: undefined,
    } as const;
    private async waitForCachedValue<T>(
        cacheKey: string,
        maxWaitMs: number
    ): Promise<{ hit: true; value: T } | { hit: false; value: undefined }> {
        const deadline = Date.now() + maxWaitMs;

        while (Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, 25));

            try {
                const cached = await this.getJson<T>(cacheKey);

                if (cached !== undefined) {
                    return { hit: true, value: cached };
                }
            } catch {
                return this.waitForCachedValueBadResult;
            }
        }

        return this.waitForCachedValueBadResult;
    }
}
