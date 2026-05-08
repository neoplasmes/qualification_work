import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export async function createRedisClient(
    host: string,
    port: number,
    password?: string
): Promise<RedisClient> {
    const client = createClient({
        socket: { host, port },
        password,
    });

    await client.connect();

    return client;
}
