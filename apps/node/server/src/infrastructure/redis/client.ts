import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export async function createRedisClient(): Promise<RedisClient> {
    const { REDIS_HOST, REDIS_PORT } = process.env;

    let url: string;

    if (REDIS_HOST && REDIS_PORT) {
        url = `redis://${REDIS_HOST}:${REDIS_PORT}`;
    } else {
        throw new Error('REDIS_URL env variable has not been found');
    }

    const client = createClient({ url });
    await client.connect();

    return client;
}
