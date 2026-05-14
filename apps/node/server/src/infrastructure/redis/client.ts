import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export async function createRedisClient(config: {
    host: string;
    port: number;
    password?: string;
    db?: number;
}): Promise<RedisClient> {
    const client = createClient({
        socket: { host: config.host, port: config.port },
        password: config.password,
        database: config.db ?? 0,
    });
    await client.connect();

    return client;
}
