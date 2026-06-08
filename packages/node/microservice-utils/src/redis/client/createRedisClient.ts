import { createClient } from 'redis';

import type { RedisClient, RedisConfig } from './types.ts';

export async function createRedisClient(config: RedisConfig): Promise<RedisClient> {
    const client = createClient({
        socket: { host: config.host, port: config.port },
        password: config.password,
        database: config.db ?? 0,
    });

    await client.connect();

    return client;
}
