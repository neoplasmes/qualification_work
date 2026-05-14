import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';

import type { UserRepo } from '@/core/ports/driven/repos';

import { isUniqueViolation } from '@/shared/postgres/errors';

import type { ReconciliationRepo } from './_reconciliation.repo';

export class PgUserRepo implements UserRepo, ReconciliationRepo {
    constructor(private readonly pool: Pool) {}

    async initialize(data: {
        userId: string;
        orgDisplayName: string;
    }): Promise<{ initialized: boolean; orgId: string | null }> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            /**
             * other queries will see true only after the end of the transaction
             * so we do not have to worry about concurrent initialization
             */
            const initializationHasStarted = await client.query(
                `UPDATE auth.users
                SET is_initializing = false
                WHERE id = $1 AND is_initializing = true`,
                [data.userId]
            );

            if (initializationHasStarted.rowCount === 0) {
                await client.query('COMMIT');

                return { initialized: false, orgId: null };
            }

            /**
             * will be regenerated until there is no collision
             */
            let orgId: string | undefined;
            while (!orgId) {
                const slug = randomBytes(16).toString('hex');
                try {
                    const { rows } = await client.query<{ id: string }>(
                        `INSERT INTO orgs.organizations (name, display_name, owner_id)
                        VALUES ($1, $2, $3)
                        RETURNING id`,
                        [slug, data.orgDisplayName, data.userId]
                    );
                    orgId = rows[0].id;
                } catch (error) {
                    if (isUniqueViolation(error)) {
                        throw error;
                    }
                }
            }

            await client.query(
                `INSERT INTO orgs.roles (org_id, user_id, role)
                VALUES ($1, $2, 'owner')
                ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
                [orgId, data.userId]
            );

            await client.query('COMMIT');

            return { initialized: true, orgId };
        } catch (error) {
            await client.query('ROLLBACK');

            throw error;
        } finally {
            client.release();
        }
    }

    async findUsersToInitialize(
        limit: number
    ): Promise<{ userId: string; username: string }[]> {
        const { rows } = await this.pool.query<{ userId: string; username: string }>(
            `SELECT id AS "userId", name AS "username"
            FROM auth.users
            WHERE is_initializing = true
            ORDER BY created_at ASC
            LIMIT $1`,
            [limit]
        );

        return rows;
    }
}
