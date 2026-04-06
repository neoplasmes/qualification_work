import type { MeOutput } from '@/core/queries';

/**
 * some kind of internal/protected repo, that is not used literally in core, but used in
 * other repositories implementation
 *
 * @export
 * @interface MeCacheRepository
 */
export interface MeCacheRepository {
    /**
     * find cached /me results
     *
     * @param {string} userId
     * @returns {Promise<MeOutput | null>}
     */
    findByUserId(userId: string): Promise<MeOutput | null>;

    /**
     * save /me results to cache
     *
     * @param {string} userId
     * @param {MeOutput} data
     * @returns {Promise<void>}
     */
    save(userId: string, data: MeOutput): Promise<void>;

    /**
     * upgrade cache version
     *
     * @param {string} userId
     * @returns {Promise<void>}
     */
    upgradeVersion(userId: string): Promise<void>;
}
