import type { Pool } from 'pg';

import type { UserRepository } from '@/core/ports';

export class PgUserRepository implements UserRepository {
    constructor(private readonly pool: Pool) {}

    async findByEmail(email: string): Promise<{ id: string } | null> {
        const { rows } = await this.pool.query(
            'SELECT id FROM auth.users WHERE email = $1',
            [email]
        );

        return rows[0] ?? null;
    }

    async findByLogin(login: string): Promise<{ id: string } | null> {
        const { rows } = await this.pool.query(
            'SELECT id FROM auth.users WHERE login = $1',
            [login]
        );

        return rows[0] ?? null;
    }

    async create(data: {
        login: string;
        passwordHash: string;
        name: string;
        family: string;
    }): Promise<void> {
        await this.pool.query(
            `INSERT INTO auth.users (email, password_hash, name, family)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [data.login, data.passwordHash, data.name, data.family]
        );
    }
}
