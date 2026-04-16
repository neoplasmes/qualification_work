/**
 * Service for hashing and verifying passwords
 */
export interface Hasher {
    /**
     *
     * @param plain
     */
    hashPassword(plain: string): Promise<string>;

    /**
     *
     * @param plain
     * @param hashed
     */
    verifyPassword(plain: string, hashed: string): Promise<boolean>;
}
