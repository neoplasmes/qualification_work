import type { MergeSession, MergeSessionRepo } from '@/core/ports/driven/repos';

import type { RedisClient } from '@/infrastructure/redis';

const KEY_PREFIX = 'merge_session:';

export class RedisMergeSessionRepo implements MergeSessionRepo {
    constructor(private readonly redis: RedisClient) {}

    private key(sessionId: string): string {
        return `${KEY_PREFIX}${sessionId}`;
    }

    async save(session: MergeSession, ttlSeconds: number): Promise<void> {
        await this.redis.set(this.key(session.sessionId), JSON.stringify(session), {
            EX: ttlSeconds,
        });
    }

    async get(sessionId: string): Promise<MergeSession | null> {
        const raw = await this.redis.get(this.key(sessionId));
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as MergeSession;
    }

    async delete(sessionId: string): Promise<void> {
        await this.redis.del(this.key(sessionId));
    }

    async listSessionIds(): Promise<string[]> {
        const ids: string[] = [];

        // SCAN keeps us off the global KEYS scan; iterator yields keys one at a time
        for await (const key of this.redis.scanIterator({
            MATCH: `${KEY_PREFIX}*`,
            COUNT: 100,
        })) {
            const keys = Array.isArray(key) ? key : [key];
            for (const k of keys) {
                if (typeof k === 'string') {
                    ids.push(k.slice(KEY_PREFIX.length));
                }
            }
        }

        return ids;
    }
}
