export type RedisCacheConfig = {
    namespace: string;
    defaultTtlMs: number;
};

export type RememberJsonOptions = {
    key: string | unknown[];
    tags?: string[];
    ttlMs?: number;
    lockTtlMs?: number;
};

export type Executable<I extends unknown[] = unknown[], O = unknown> = {
    execute(...args: I): O | Promise<O>;
};

export type ExecutableCacheOptions<I extends unknown[]> = {
    key: (...args: I) => string | unknown[];
    tags?: (...args: I) => string[];
    ttlMs?: number;
    lockTtlMs?: number;
};
