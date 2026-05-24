import { createApp } from '@/adapters/createApp';

import { loadConfig } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';
import { createRedisClient } from '@/infrastructure/redis';

const config = loadConfig();

const pool = await createPool(config.postgresConnectionString);
const redis = await createRedisClient(
    config.redis.host,
    config.redis.port,
    config.redis.password
);

const app = createApp(pool, redis, config);

app.listen({ port: config.port, host: '0.0.0.0' }).then(() => {
    console.log(`data-service runs on port ${config.port}`);
});
