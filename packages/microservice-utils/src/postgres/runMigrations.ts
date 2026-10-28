import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Pool } from 'pg';

/**
 * applies idempotent sql files of the service in name order
 * one transaction under an advisory lock keeps concurrent replicas from racing
 *
 * @param pool
 * @param dir
 * @returns
 */
export async function runMigrations(pool: Pool, dir: string): Promise<void> {
    const files = readdirSync(dir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query(`SELECT pg_advisory_xact_lock(hashtext('migrations'))`);

        for (const file of files) {
            await client.query(readFileSync(join(dir, file), 'utf8'));
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});

        throw error;
    } finally {
        client.release();
    }
}
