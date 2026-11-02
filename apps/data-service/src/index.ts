import { fileURLToPath } from 'node:url';

import {
    consumerGroups,
    dlqTopic,
    identityOrgEventSchema,
    topics,
} from '@qualification-work/contracts';
import {
    EventConsumer,
    OutboxRelay,
    ensureTopics,
} from '@qualification-work/microservice-utils/kafka';
import { runMigrations } from '@qualification-work/microservice-utils/postgres';
import { createRedisClient } from '@qualification-work/microservice-utils/redis';

import { createAppWithCleanup } from '@/adapters/createApp';
import { createOrgCleanupHandler } from '@/adapters/driving/consumer';

import { loadConfig } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';

const config = loadConfig();

const pool = await createPool(config.postgresConnectionString);
await runMigrations(pool, fileURLToPath(new URL('../migrations', import.meta.url)));

const redis = await createRedisClient(config.redis);

const { app, cache, stop } = createAppWithCleanup(pool, redis, config);

await ensureTopics(
    config.kafka.brokers,
    [
        topics.dataDataset,
        topics.analyticsChart,
        topics.identityOrg,
        dlqTopic(topics.identityOrg.name),
    ],
    config.kafka.replicationFactor
);

const outboxRelay = new OutboxRelay(pool, {
    table: 'data.outbox',
    brokers: config.kafka.brokers,
    clientId: 'data-service-outbox',
});
outboxRelay.start();

const orgCleanupConsumer = new EventConsumer(pool, {
    brokers: config.kafka.brokers,
    clientId: 'data-service',
    groupId: consumerGroups.dataServiceOrgCleanup,
    topic: topics.identityOrg.name,
    schema: identityOrgEventSchema,
    processedTable: 'data.processed_events',
    handler: createOrgCleanupHandler(cache),
});
await orgCleanupConsumer.start();

const server = await app.listen({ port: config.port, host: '0.0.0.0' });
console.log(`data-service runs on port ${config.port}`);

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`data-service received ${signal}, shutting down`);

    stop();
    await orgCleanupConsumer.stop();
    await outboxRelay.stop();
    await redis.close();

    await new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close(error => (error ? reject(error) : resolve()));
    });

    await pool.end();
}

process.once('SIGINT', signal => {
    void shutdown(signal);
});

process.once('SIGTERM', signal => {
    void shutdown(signal);
});
