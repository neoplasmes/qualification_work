import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

function buildConnectionString(): string {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

    if (REDIS_HOST && REDIS_PORT && REDIS_PASSWORD) {
        return `redis://:${encodeURIComponent(REDIS_PASSWORD)}@${REDIS_HOST}:${REDIS_PORT}`;
    }

    throw new Error(
        'REDIS_URL or REDIS_HOST/REDIS_PORT/REDIS_PASSWORD env variables have not been found'
    );
}

export async function createRedisClient(): Promise<RedisClient> {
    const url = buildConnectionString();
    const client = createClient({ url });
    await client.connect();

    return client;
}
