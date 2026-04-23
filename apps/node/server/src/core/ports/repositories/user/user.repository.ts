import type { User } from '@/core/domain';

/**
 * User data management
 */
export interface UserRepository {
    /**
     * Find user by email. Email is UNIQUE.
     *
     * @param email
     * @param retrieve fields of User entity to return
     */
    findByEmail(email: string): Promise<boolean>;
    findByEmail(email: string, retrieve: []): Promise<boolean>;
    findByEmail<K extends keyof User>(
        email: string,
        retrieve: K[]
    ): Promise<Pick<User, K> | null>;

    /**
     * Find user by id
     *
     * @param id
     * @param retrieve fields of User entity to return
     */
    findById(id: string): Promise<boolean>;
    findById(id: string, retrieve: []): Promise<boolean>;
    findById<K extends keyof User>(
        id: string,
        retrieve: K[]
    ): Promise<Pick<User, K> | null>;

    /**
     * Create a user
     *
     * @param data
     */
    create(data: {
        login: string;
        passwordHash: string;
        name: string;
        family: string;
    }): Promise<{ id: string }>;
}
