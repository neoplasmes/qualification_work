import type { Organization } from '@/core/entities';
import type { OrganizationRepository } from '@/core/ports';
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
     */
    constructor(private readonly pool: Pool) {}

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

    async delete(id: string): Promise<void> {
        await this.pool.query(`DELETE FROM orgs.organizations WHERE id = $1`, [id]);
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

        // let columnsString = '';
        // retrieve.forEach((k, i) => {
        //     const col = organizationColumnMap[k] ?? k;
        //     columnsString += col;

        //     if (i < retrieve.length - 1) {
        //         columnsString += ', ';
        //     }
        // });
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
