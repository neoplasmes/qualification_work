import { fileURLToPath } from 'node:url';

import {
    analyticsChartEventSchema,
    consumerGroups,
    dataDatasetEventSchema,
    dlqTopic,
    identityOrgEventSchema,
    topics,
} from '@qualification-work/contracts';
import {
    EventConsumer,
    ensureTopics,
} from '@qualification-work/microservice-utils/kafka';
import { runMigrations } from '@qualification-work/microservice-utils/postgres';
import {
    RedisCache,
    createRedisClient,
} from '@qualification-work/microservice-utils/redis';

import { createApp } from '@/adapters/createApp';
import {
    createChartRefsHandler,
    createDatasetRefsHandler,
    createOrgCleanupHandler,
} from '@/adapters/driving/consumer';

import { loadConfig } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';

const config = loadConfig();

const pool = await createPool(config.postgresConnectionString);
await runMigrations(pool, fileURLToPath(new URL('../migrations', import.meta.url)));

const redis = await createRedisClient(config.redis);
const cache = new RedisCache(redis, { namespace: 'server', defaultTtlMs: 60_000 });

await ensureTopics(
    config.kafka.brokers,
    [
        topics.identityOrg,
        topics.dataDataset,
        topics.analyticsChart,
        dlqTopic(topics.identityOrg.name),
        dlqTopic(topics.dataDataset.name),
        dlqTopic(topics.analyticsChart.name),
    ],
    config.kafka.replicationFactor
);

const consumerBase = {
    brokers: config.kafka.brokers,
    clientId: 'server',
    processedTable: 'dashboards.processed_events',
};
const consumers = [
    new EventConsumer(pool, {
        ...consumerBase,
        groupId: consumerGroups.serverOrgCleanup,
        topic: topics.identityOrg.name,
        schema: identityOrgEventSchema,
        handler: createOrgCleanupHandler(cache),
    }),
    new EventConsumer(pool, {
        ...consumerBase,
        groupId: consumerGroups.serverDatasetRefs,
        topic: topics.dataDataset.name,
        schema: dataDatasetEventSchema,
        handler: createDatasetRefsHandler(cache),
    }),
    new EventConsumer(pool, {
        ...consumerBase,
        groupId: consumerGroups.serverChartRefs,
        topic: topics.analyticsChart.name,
        schema: analyticsChartEventSchema,
        handler: createChartRefsHandler(cache),
    }),
];
await Promise.all(consumers.map(consumer => consumer.start()));

const app = createApp(pool, cache, config);

const server = await app.listen({ port: config.port, host: '0.0.0.0' });
console.log(`server runs on port ${config.port}`);

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`server received ${signal}, shutting down`);

    await Promise.all(consumers.map(consumer => consumer.stop()));
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
