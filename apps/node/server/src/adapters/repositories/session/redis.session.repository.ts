import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { SESSION_TTL_SECONDS } from '@/core/domain';
import { AppError } from '@/core/errors';
import type { SessionRepository } from '@/core/ports';

import type { RedisClient } from '@/infrastructure/redis';

const sessionSchema = z.object({ userId: z.uuid() });

export class RedisSessionRepository implements SessionRepository {
    /**
     * Creates an instance of RedisSessionRepository.
     *
     * @constructor
     * @param {RedisClient} redis
     */
    constructor(private readonly redis: RedisClient) {}

    async create(data: { userId: string }): Promise<{ token: string }> {
        const token = randomUUID();

        await this.redis.set(`session:${token}`, JSON.stringify(data), {
            EX: SESSION_TTL_SECONDS,
        });

        return { token };
    }

    async find(token: string): Promise<{ userId: string } | null> {
        const raw = await this.redis.get(`session:${token}`);

        if (!raw) {
            return null;
        }

        try {
            const parsed = sessionSchema.parse(JSON.parse(raw));

            return parsed;
        } catch {
            throw new AppError('Invalid session data', 500);
        }
    }

    async delete(token: string): Promise<void> {
        // TODO: should we log something if the session was not found?
        await this.redis.del(`session:${token}`);
    }
}
