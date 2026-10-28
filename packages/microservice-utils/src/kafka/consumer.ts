import {
    Consumer,
    Producer,
    stringDeserializers,
    stringSerializers,
    type MessagesStream,
} from '@platformatic/kafka';
import type { Pool, PoolClient } from 'pg';
import type { z } from 'zod';

import { dlqTopic } from '@qualification-work/contracts';

// optional callback that runs after the transaction is committed, e.g. cache invalidation
export type AfterCommit = () => Promise<void>;

export type EventHandler<E> = (
    client: PoolClient,
    event: E
) => Promise<AfterCommit | void>;

export type EventConsumerOptions<S extends z.ZodType<{ eventId: string }>> = {
    brokers: string[];
    clientId: string;
    groupId: string;
    topic: string;
    schema: S;
    // schema-qualified processed events table, e.g. dashboards.processed_events
    processedTable: string;
    handler: EventHandler<z.infer<S>>;
};

const maxRetryDelayMs = 30_000;

/**
 * at-least-once consumer made idempotent by processed_events inside the handler transaction
 * messages failing the schema go to the dlq, transient failures are retried in place
 */
export class EventConsumer<S extends z.ZodType<{ eventId: string }>> {
    private readonly consumer: Consumer<string, string, string, string>;
    private readonly dlq: Producer<string, string, string, string>;
    private stream: MessagesStream<string, string, string, string> | null = null;
    private loop: Promise<void> | null = null;
    private stopped = false;

    constructor(
        private readonly pool: Pool,
        private readonly options: EventConsumerOptions<S>
    ) {
        this.consumer = new Consumer({
            clientId: options.clientId,
            groupId: options.groupId,
            bootstrapBrokers: options.brokers,
            deserializers: stringDeserializers,
        });
        this.dlq = new Producer({
            clientId: `${options.clientId}-dlq`,
            bootstrapBrokers: options.brokers,
            serializers: stringSerializers,
            acks: -1,
        });
    }

    async start(): Promise<void> {
        this.stream = await this.consumer.consume({
            topics: [this.options.topic],
            autocommit: false,
            mode: 'committed',
            fallbackMode: 'earliest',
        });

        this.loop = (async () => {
            for await (const message of this.stream!) {
                if (this.stopped) {
                    return;
                }

                const parsed = this.parse(message.value);
                if (parsed.success) {
                    await this.processWithRetry(parsed.data);
                } else {
                    await this.dlq.send({
                        messages: [
                            {
                                topic: dlqTopic(this.options.topic).name,
                                key: message.key,
                                value: message.value,
                                headers: {
                                    error: parsed.error,
                                    consumer: this.options.groupId,
                                    'original-offset': message.offset.toString(),
                                },
                            },
                        ],
                    });
                    console.error(
                        `${this.options.groupId}: message ${message.offset} sent to dlq: ${parsed.error}`
                    );
                }

                await message.commit();
            }
        })();
    }

    async stop(): Promise<void> {
        this.stopped = true;
        await this.stream?.close();
        await this.loop?.catch(() => {});
        await this.consumer.close(true);
        await this.dlq.close();
    }

    private parse(
        value: string
    ): { success: true; data: z.infer<S> } | { success: false; error: string } {
        try {
            const result = this.options.schema.safeParse(JSON.parse(value));

            return result.success
                ? { success: true, data: result.data }
                : { success: false, error: result.error.message };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    private async processWithRetry(event: z.infer<S>): Promise<void> {
        for (let attempt = 0; ; attempt += 1) {
            try {
                const client = await this.pool.connect();
                let afterCommit: AfterCommit | void = undefined;

                try {
                    await client.query('BEGIN');

                    const { rowCount } = await client.query(
                        `INSERT INTO ${this.options.processedTable} (event_id, consumer)
                        VALUES ($1, $2)
                        ON CONFLICT DO NOTHING`,
                        [event.eventId, this.options.groupId]
                    );
                    if (rowCount) {
                        afterCommit = await this.options.handler(client, event);
                    }

                    await client.query('COMMIT');
                } catch (error) {
                    await client.query('ROLLBACK').catch(() => {});

                    throw error;
                } finally {
                    client.release();
                }

                await afterCommit?.().catch(error =>
                    console.error(`${this.options.groupId}: after commit failed`, error)
                );

                return;
            } catch (error) {
                if (this.stopped) {
                    throw error;
                }

                const delay = Math.min(100 * 2 ** attempt, maxRetryDelayMs);
                console.error(
                    `${this.options.groupId}: event ${event.eventId} failed, retry in ${delay}ms`,
                    error
                );
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}
