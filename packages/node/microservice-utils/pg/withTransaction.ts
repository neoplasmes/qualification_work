import type { Pool, PoolClient } from 'pg';

export async function withTransaction<T>(
    pool: Pool,
    query: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await query(client);

        await client.query('COMMIT');

        return result;
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});

        throw error;
    } finally {
        client.release();
    }
}
