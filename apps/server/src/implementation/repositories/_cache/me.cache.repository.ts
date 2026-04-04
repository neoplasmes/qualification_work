import { AppError } from '@/core/errors';
import type { MeCacheRepository } from '@/core/ports';
import type { MeOutput } from '@/core/queries';
import type { RedisClient } from '@/infrastructure/redis';

const ME_CACHE_TTL_SECONDS = 60 * 60;
/**
 * Actually this is a заглушка while no cache where stored
 */
const DEFAULT_PROFILE_VERSION = 0;

/**
 * it is not clear where to save this functionality in project, so I decided to just let it go
 *
 * @export
 * @class RedisMeCacheRepository
 * @typedef {RedisMeCacheRepository}
 */
export class RedisMeCacheRepository implements MeCacheRepository {
    constructor(private readonly redis: RedisClient) {}

    /**
     * returns the cached /me route output
     *
     * @async
     * @param {string} userId
     * @returns {Promise<MeOutput | null>}
     */
    async findByUserId(userId: string): Promise<MeOutput | null> {
        const profileVersion = await this.getProfileVersion(userId);
        const raw = await this.redis.get(this.buildDataKey(userId, profileVersion));

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as MeOutput;
        } catch {
            throw new AppError('Invalid /me cache payload', 500);
        }
    }

    /**
     * simply saves the cache
     *
     * @async
     * @param {string} userId
     * @param {MeOutput} data
     * @returns {Promise<void>}
     */
    async save(userId: string, data: MeOutput): Promise<void> {
        const profileVersion = await this.getProfileVersion(userId);

        await this.redis.set(
            this.buildDataKey(userId, profileVersion),
            JSON.stringify(data),
            {
                EX: ME_CACHE_TTL_SECONDS,
            }
        );
    }

    /**
     * Defines the new vesion number. The idea is that we do not manually delete the old cached
     * user data and let redis to destroy it by himself lately.
     *
     * @async
     * @param {string} userId
     * @returns {Promise<void>}
     */
    async upgradeVersion(userId: string): Promise<void> {
        await this.redis.incr(this.buildVersionKey(userId));
    }

    private async getProfileVersion(userId: string): Promise<number> {
        const rawVersion = await this.redis.get(this.buildVersionKey(userId));

        if (!rawVersion) {
            return DEFAULT_PROFILE_VERSION;
        }

        const profileVersion = Number(rawVersion);

        if (!Number.isInteger(profileVersion) || profileVersion < 0) {
            throw new AppError('Invalid /me cache version', 500);
        }

        return profileVersion;
    }

    /**
     * Cache version. Should be updated when something changes in "/me"-specific data
     *
     * @private
     * @param {string} userId
     * @returns {string}
     */
    private buildVersionKey(userId: string): string {
        return `me:user:${userId}:version`;
    }

    /**
     * MeOutput is stored on this key
     *
     * @private
     * @param {string} userId
     * @param {number} profileVersion
     * @returns {string}
     */
    private buildDataKey(userId: string, profileVersion: number): string {
        return `me:user:${userId}:version:${profileVersion}:data`;
    }
}
