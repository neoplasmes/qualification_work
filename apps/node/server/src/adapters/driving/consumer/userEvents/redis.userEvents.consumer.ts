import type { InitUserCommand } from '@/core/commands';

import type { ReconciliationRepo } from '@/adapters/driven/repos/user/_reconciliation.repo';

import type { RedisClient } from '@/infrastructure/redis';

export type UserEventsConsumerOptions = Partial<{
    streamName: string;
    groupName: string;
    consumerName: string;
    /**
     * max number of events to read at once
     */
    readCount: number;
    /**
     * keep-alive time
     */
    blockTime: number;
    /**
     * polling of uncommited "isInitializing" in postgres or whatever  database
     */
    reconcileIntervalTime: number;
    /**
     * max amount of polled uncommited "isInitializing"
     */
    reconcileBatchSize: number;
}>;

const defaultOptions: Required<UserEventsConsumerOptions> = {
    //* BE CAREFULL: THERE IS A COPY OF THIS IN APPS/GO/AUTH
    streamName: 'auth:user-events',
    groupName: 'server:init-user',
    consumerName: 'server',
    //? make higher?
    readCount: 25,
    blockTime: 1000,
    //? make higher?
    reconcileBatchSize: 25,
    reconcileIntervalTime: 5000,
};

// TODO: more reliable workaround for internal redis package types
type StreamMessage = {
    id: string;
    message: Record<string, string>;
};
type StreamReadResponse = Array<{ name: string; messages: StreamMessage[] }> | null;

export class RedisUserEventsConsumer {
    private readonly options: Required<UserEventsConsumerOptions>;

    private running = false;
    private eventLoop: Promise<void> | null = null;

    /**
     * interval for the polling of uncommited users' registration events
     *
     * @private
     * @type {(ReturnType<typeof setInterval> | null)}
     */
    private interval: ReturnType<typeof setInterval> | null = null;
    private isReconciling = false;

    constructor(
        private readonly redis: RedisClient,
        private readonly initUser: InitUserCommand,
        private readonly reconciliationRepo: ReconciliationRepo,
        options: UserEventsConsumerOptions = {}
    ) {
        this.options = { ...defaultOptions, ...options };
    }

    async start(): Promise<void> {
        if (this.running) {
            return;
        }

        this.running = true;
        await this.createGroup();
        await this.reconcile();

        this.interval = setInterval(() => {
            this.reconcile().catch(error => {
                console.error('init user reconciliation failed', error);
            });
        }, this.options.reconcileIntervalTime);

        this.eventLoop = this.consumeLoop();
    }

    async stop(): Promise<void> {
        this.running = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        await this.eventLoop;
        this.eventLoop = null;
    }

    private async consumeLoop(): Promise<void> {
        while (this.running) {
            try {
                // reads old unprocessed messages
                await this.processStreams(await this.readGroup('0'));
                // reads new messages
                await this.processStreams(
                    await this.readGroup('>', this.options.blockTime)
                );
            } catch (error) {
                if (!this.running) {
                    return;
                }

                if (error instanceof Error && error.message.includes('NOGROUP')) {
                    await this.createGroup();

                    continue;
                }

                // TODO: implement a logger like in apps/go/auth??
                console.error('user events consumer failed', error);
            }
        }
    }

    /**
     * XGROUP guarantees that every message will be processed only once and by only one of
     * the consumers on the group. This is crucial for application scaling
     *
     * @private
     * @async
     * @returns {Promise<void>}
     */
    private async createGroup(): Promise<void> {
        try {
            await this.redis.xGroupCreate(
                this.options.streamName,
                this.options.groupName,
                '0',
                {
                    MKSTREAM: true,
                }
            );
        } catch (error) {
            if (!(error instanceof Error && error.message.includes('BUSYGROUP'))) {
                throw error;
            }
        }
    }

    private readGroup(id: string, block?: number): Promise<StreamReadResponse> {
        return this.redis.xReadGroup(
            this.options.groupName,
            this.options.consumerName,
            { key: this.options.streamName, id },
            {
                COUNT: this.options.readCount,
                ...(block !== undefined && { BLOCK: block }),
            }
        ) as Promise<StreamReadResponse>;
    }

    private async processStreams(streams: StreamReadResponse): Promise<void> {
        if (!streams) {
            return;
        }

        for (const stream of streams) {
            for (const m of stream.messages) {
                const { message } = m;
                const userId = message['userId'];
                const username = message['username'];

                if (m.message['type'] !== 'user.registered' || !userId || !username) {
                    await this.redis.xAck(
                        this.options.streamName,
                        this.options.groupName,
                        m.id
                    );

                    continue;
                }

                await this.initUser.execute(userId, username);

                await this.redis.xAck(
                    this.options.streamName,
                    this.options.groupName,
                    m.id
                );
            }
        }
    }

    private async reconcile(): Promise<void> {
        if (this.isReconciling) {
            return;
        }

        this.isReconciling = true;
        try {
            const users = await this.reconciliationRepo.findUsersToInitialize(
                this.options.reconcileBatchSize
            );

            for (const user of users) {
                await this.initUser.execute(user.userId, user.username);
            }
        } finally {
            this.isReconciling = false;
        }
    }
}
