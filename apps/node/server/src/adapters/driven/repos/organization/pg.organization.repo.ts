import type { Pool } from 'pg';

import type { Org } from '@/core/domain';
import type { OrgRepo } from '@/core/ports/driven/repos';

/**
 * Translate snake_case to camelCase for organization fields
 *
 * @type {Partial<Record<keyof Org, string>>}
 */
const organizationColumnMap: Partial<Record<keyof Org, string>> = {
    ownerId: 'owner_id AS "ownerId"',
    createdAt: 'created_at AS "createdAt"',
    updatedAt: 'updated_at AS "updatedAt"',
};

export class PgOrgRepo implements OrgRepo {
    /**
     * Creates an instance of PgOrgRepo.
     *
     * @constructor
     * @param {Pool} pool
     */
    constructor(private readonly pool: Pool) {}

    /**
     * Creates an organization and assigns the owner role to the owner user.
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

        return { id };
    }

    /**
     * Deletes an organization by id.
     *
     * @async
     * @param {string} id
     * @returns {Promise<void>}
     */
    async delete(id: string): Promise<void> {
        await this.pool.query(`DELETE FROM orgs.organizations WHERE id = $1`, [id]);
    }

    findById(id: string): Promise<boolean>;
    findById(id: string, retrieve: []): Promise<boolean>;
    findById<K extends keyof Org>(
        id: string,
        retrieve: K[]
    ): Promise<Pick<Org, K> | null>;
    async findById<K extends keyof Org>(
        id: string,
        retrieve?: K[]
    ): Promise<Pick<Org, K> | boolean | null> {
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
}
