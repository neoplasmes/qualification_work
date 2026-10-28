import { Producer, stringSerializers } from '@platformatic/kafka';
import type { Pool, PoolClient } from 'pg';

import type { EventEnvelope } from '@qualification-work/contracts';

export type OutboxRelayOptions = {
    // schema-qualified outbox table, e.g. data.outbox
    table: string;
    brokers: string[];
    clientId: string;
    intervalMs?: number;
    batchSize?: number;
};

type OutboxRow = {
    id: string;
    topic: string;
    key: string;
    payload: EventEnvelope;
};

// published rows are kept for a week to simplify debugging
const retentionInterval = '7 days';
const cleanupEveryTicks = 3000;

/**
 * writes an event into the outbox inside the caller transaction
 *
 * @param client
 * @param table
 * @param topic
 * @param event
 * @returns
 */
export async function writeOutbox(
    client: PoolClient,
    table: string,
    topic: string,
    event: EventEnvelope
): Promise<void> {
    await client.query(
        `INSERT INTO ${table} (event_id, topic, key, payload) VALUES ($1, $2, $3, $4)`,
        [event.eventId, topic, event.aggregateId, event]
    );
}

/**
 * delivers outbox rows to kafka in id order
 * an advisory lock keeps a single active relay across replicas, which preserves per-key order
 */
export class OutboxRelay {
    private readonly producer: Producer<string, string, string, string>;
    private readonly intervalMs: number;
    private readonly batchSize: number;
    private timer: NodeJS.Timeout | null = null;
    private running: Promise<unknown> | null = null;
    private ticks = 0;

    constructor(
        private readonly pool: Pool,
        private readonly options: OutboxRelayOptions
    ) {
        this.producer = new Producer({
            clientId: options.clientId,
            bootstrapBrokers: options.brokers,
            serializers: stringSerializers,
            idempotent: true,
            acks: -1,
        });
        this.intervalMs = options.intervalMs ?? 200;
        this.batchSize = options.batchSize ?? 500;
    }

    start(): void {
        const loop = () => {
            this.running = this.tick()
                .catch(error => console.error('outbox relay tick failed', error))
                .finally(() => {
                    if (this.timer !== null) {
                        this.timer = setTimeout(loop, this.intervalMs);
                    }
                });
        };

        this.timer = setTimeout(loop, 0);
    }

    async stop(): Promise<void> {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        await this.running;
        await this.producer.close();
    }

    /**
     * publishes one batch, returns the number of delivered rows
     *
     * @returns
     */
    async tick(): Promise<number> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // xact lock is released on commit, so it also works behind pgbouncer transaction mode
            const { rows: lock } = await client.query<{ locked: boolean }>(
                `SELECT pg_try_advisory_xact_lock(hashtext($1)) AS locked`,
                [this.options.table]
            );
            if (!lock[0].locked) {
                await client.query('COMMIT');

                return 0;
            }

            const { rows } = await client.query<OutboxRow>(
                `SELECT id, topic, key, payload FROM ${this.options.table}
                WHERE published_at IS NULL
                ORDER BY id
                LIMIT $1`,
                [this.batchSize]
            );

            if (rows.length > 0) {
                await this.producer.send({
                    messages: rows.map(row => ({
                        topic: row.topic,
                        key: row.key,
                        value: JSON.stringify(row.payload),
                        headers: { 'event-type': row.payload.type },
                    })),
                });

                await client.query(
                    `UPDATE ${this.options.table} SET published_at = now() WHERE id = ANY($1::bigint[])`,
                    [rows.map(row => row.id)]
                );
            }

            this.ticks += 1;
            if (this.ticks % cleanupEveryTicks === 0) {
                await client.query(
                    `DELETE FROM ${this.options.table}
                    WHERE published_at < now() - interval '${retentionInterval}'`
                );
            }

            await client.query('COMMIT');

            return rows.length;
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});

            throw error;
        } finally {
            client.release();
        }
    }
}
