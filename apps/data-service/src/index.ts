import { createRedisClient } from '@qualification-work/microservice-utils/redis';

import { createApp } from '@/adapters/createApp';

import { loadConfig } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';

const config = loadConfig();

const pool = await createPool(config.postgresConnectionString);
const redis = await createRedisClient(config.redis);

const app = createApp(pool, redis, config);

app.listen({ port: config.port, host: '0.0.0.0' }).then(() => {
    console.log(`data-service runs on port ${config.port}`);
});
