/**
 * Auth sessions managment
 */
export interface SessionRepository {
    /**
     * Description placeholder
     *
     * @param {{ userId: string; roles: string[] }} data
     * @returns {Promise<{ token: string }>}
     */
    create(data: { userId: string }): Promise<{ token: string }>;

    /**
     * Description placeholder
     *
     * @param {string} token
     * @returns {Promise<{ userId: string; } | null>}
     */
    find(token: string): Promise<{ userId: string } | null>;

    /**
     * Description placeholder
     *
     * @param {string} token
     * @returns {Promise<void>}
     */
    delete(token: string): Promise<void>;
}
