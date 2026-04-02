import { createApp } from '@/implementation/createApp';
import { createPool } from '@/infrastructure/postgres';
import { createRedisClient } from '@/infrastructure/redis';

const pepper = process.env.PEPPER;
if (!pepper) {
    throw new Error('PEPPER env переменная не задана');
}

const pool = await createPool();
const redis = await createRedisClient();

const app = createApp(pool, redis, pepper);

app.listen({ port: 4000, host: '0.0.0.0' }).then(() => {
    console.log('server runs on port 4000');
});
