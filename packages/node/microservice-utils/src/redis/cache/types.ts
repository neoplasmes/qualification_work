import type { RedisClient } from '../client/index.ts';

export type RedisCacheClient = Pick<RedisClient, 'get' | 'set' | 'del' | 'eval'> & {
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
