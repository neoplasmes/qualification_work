import type { Organization } from '@/core/entities';
import type { MeCacheRepository, OrganizationRepository } from '@/core/ports';
import type { Pool } from 'pg';

/**
 * Translate snake_case to camelCase for organization fields
 *
 * @type {Partial<Record<keyof Organization, string>>}
 */
const organizationColumnMap: Partial<Record<keyof Organization, string>> = {
    ownerId: 'owner_id AS "ownerId"',
    createdAt: 'created_at AS "createdAt"',
    updatedAt: 'updated_at AS "updatedAt"',
};

export class PgOrganizationRepository implements OrganizationRepository {
    /**
     * Creates an instance of PgOrganizationRepository.
     *
     * @constructor
     * @param {Pool} pool
     * @param {RedisMeCacheRepository} meCacheRepository
     */
    constructor(
        private readonly pool: Pool,
        private readonly meCacheRepository: MeCacheRepository
    ) {}

    /**
     * affects user -> has to revalidate the cached /me data
     *
     * @async
     * @param {{ name: string; ownerId: string }} data
     * @returns {Promise<{ id: string }>}
     */
    async create(data: { name: string; ownerId: string }): Promise<{ id: string }> {
        const { rows } = await this.pool.query(
            `INSERT INTO orgs.organizations (name, owner_id) VALUES ($1, $2) RETURNING id`,
            [data.name, data.ownerId]
        );

        const { id } = rows[0] as { id: string };

        await this.pool.query(
            `INSERT INTO orgs.roles (org_id, user_id, role) VALUES ($1, $2, 'owner')`,
            [id, data.ownerId]
        );

        void this.meCacheRepository.upgradeVersion(data.ownerId);

        return { id };
    }

    /**
     * affects user -> has to revalidate the cached /me data
     *
     * @async
     * @param {string} id
     * @returns {Promise<void>}
     */
    async delete(id: string): Promise<void> {
        const { rows } = await this.pool.query<{
            user_id: string;
        }>(`SELECT user_id FROM orgs.roles WHERE org_id = $1`, [id]);

        await this.pool.query(`DELETE FROM orgs.organizations WHERE id = $1`, [id]);

        for (const r of rows) {
            void this.meCacheRepository.upgradeVersion(r.user_id);
        }
    }

    findById(id: string): Promise<boolean>;
    findById(id: string, retrieve: []): Promise<boolean>;
    findById<K extends keyof Organization>(
        id: string,
        retrieve: K[]
    ): Promise<Pick<Organization, K> | null>;
    async findById<K extends keyof Organization>(
        id: string,
        retrieve?: K[]
    ): Promise<Pick<Organization, K> | boolean | null> {
        if (!retrieve || retrieve.length === 0) {
            const { rows } = await this.pool.query(
                'SELECT 1 FROM orgs.organizations WHERE id = $1',
                [id]
            );

            return rows.length > 0;
        }

        const columnsMapped = [];
        for (const k of retrieve) {
            columnsMapped.push(organizationColumnMap[k] ?? k);
        }

        /**
         * intrestingly join() works faster, than string concatenation in loop.
         */
        const columnsString = columnsMapped.join(', ');

        const { rows } = await this.pool.query(
            `SELECT ${columnsString} FROM orgs.organizations WHERE id = $1`,
            [id]
        );

        return rows[0] ?? null;
    }

    async findByUserId(
        userId: string
    ): Promise<{ id: string; name: string; role: string }[]> {
        const { rows } = await this.pool.query(
            `SELECT o.id, o.name, r.role::text AS role
             FROM orgs.roles r
             JOIN orgs.organizations o ON o.id = r.org_id
             WHERE r.user_id = $1`,
            [userId]
        );

        return rows;
    }
}
