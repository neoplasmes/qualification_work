import { InitUserCommand } from '@/core/commands';

import { createApp } from '@/adapters/createApp';
import { PgUserRepo } from '@/adapters/driven/repos';
import { RedisUserEventsConsumer } from '@/adapters/driving/consumer';

import { loadConfig } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';
import { createRedisClient } from '@/infrastructure/redis';

const config = loadConfig();
const pool = await createPool(config.postgresConnectionString);
const redis = await createRedisClient(config.redis);

const initUserRepo = new PgUserRepo(pool);
const initUserCommand = new InitUserCommand(initUserRepo);
const userEventsConsumer = new RedisUserEventsConsumer(
    redis,
    initUserCommand,
    initUserRepo
);
await userEventsConsumer.start();

const app = createApp(pool, config);

const server = await app.listen({ port: config.port, host: '0.0.0.0' });
console.log(`server runs on port ${config.port}`);

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`server received ${signal}, shutting down`);

    await userEventsConsumer.stop();
    await redis.close();

    await new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close(error => {
            if (error) {
                reject(error);

                return;
            }

            resolve();
        });
    });

    await pool.end();
}

process.once('SIGINT', signal => {
    void shutdown(signal);
});

process.once('SIGTERM', signal => {
    void shutdown(signal);
});
