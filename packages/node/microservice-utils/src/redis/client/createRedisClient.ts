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
