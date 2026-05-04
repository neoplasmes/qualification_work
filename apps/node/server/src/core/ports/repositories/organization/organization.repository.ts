import type { Organization } from '@/core/domain';

/**
 * Organization management at the data level
 */
export interface OrganizationRepository {
    /**
     * Create an organization
     *
     * @param data
     */
    create(data: { name: string; ownerId: string }): Promise<{ id: string }>;

    /**
     * Delete an organization by id
     *
     * @param id
     */
    delete(id: string): Promise<void>;

    /**
     * find organization by id
     *
     * @param id
     * @param retrieve fields of Organization entity to return
     */
    findById(id: string): Promise<boolean>;
    findById(id: string, retrieve: []): Promise<boolean>;
    findById<K extends keyof Organization>(
        id: string,
        retrieve: K[]
    ): Promise<Pick<Organization, K> | null>;
}
