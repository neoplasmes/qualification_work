import type { User } from '@/core/entities';
import type { UserRepository } from '@/core/ports';
import type { Pool } from 'pg';

const userColumnMap: Partial<Record<keyof User, string>> = {
    passwordHash: 'password_hash AS "passwordHash"',
};

export class PgRedisUserRepository implements UserRepository {
    constructor(private readonly pool: Pool) {}

    findByEmail(email: string): Promise<boolean>;
    findByEmail(email: string, retrieve: []): Promise<boolean>;
    findByEmail<K extends keyof User>(
        email: string,
        retrieve: K[]
    ): Promise<Pick<User, K> | null>;
    async findByEmail<K extends keyof User>(
        email: string,
        retrieve?: K[]
    ): Promise<Pick<User, K> | boolean | null> {
        if (!retrieve || retrieve.length === 0) {
            const { rows } = await this.pool.query(
                'SELECT 1 FROM auth.users WHERE email = $1',
                [email]
            );

            return rows.length > 0;
        }

        const columnsMapped = [];
        for (const k of retrieve) {
            columnsMapped.push(userColumnMap[k] ?? k);
        }

        const cols = columnsMapped.join(', ');

        const { rows } = await this.pool.query(
            `SELECT ${cols} FROM auth.users WHERE email = $1`,
            [email]
        );

        return rows[0] ?? null;
    }

    findById(id: string): Promise<boolean>;
    findById(id: string, retrieve: []): Promise<boolean>;
    findById<K extends keyof User>(
        id: string,
        retrieve: K[]
    ): Promise<Pick<User, K> | null>;
    async findById<K extends keyof User>(
        id: string,
        retrieve?: K[]
    ): Promise<Pick<User, K> | boolean | null> {
        if (!retrieve || retrieve.length === 0) {
            const { rows } = await this.pool.query(
                'SELECT 1 FROM auth.users WHERE id = $1',
                [id]
            );

            return rows.length > 0;
        }

        const columnMap: Partial<Record<keyof User, string>> = {
            passwordHash: 'password_hash AS "passwordHash"',
            failedLoginAttempts: 'failed_login_attempts AS "failedLoginAttempts"',
            lockedUntil: 'locked_until AS "lockedUntil"',
            createdAt: 'created_at AS "createdAt"',
            updatedAt: 'updated_at AS "updatedAt"',
        };
        const cols = retrieve.map(k => columnMap[k] ?? k).join(', ');

        const { rows } = await this.pool.query(
            `SELECT ${cols} FROM auth.users WHERE id = $1`,
            [id]
        );

        return rows[0] ?? null;
    }

    async create(data: {
        login: string;
        passwordHash: string;
        name: string;
        family: string;
    }): Promise<{ id: string }> {
        const { rows } = await this.pool.query(
            `INSERT INTO auth.users (email, password_hash, name, family)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [data.login, data.passwordHash, data.name, data.family]
        );

        return rows[0];
    }
}
