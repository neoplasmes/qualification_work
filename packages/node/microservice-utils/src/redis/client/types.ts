import type { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export type RedisConfig = {
    host: string;
    port: number;
    password?: string;
    db?: number;
};
