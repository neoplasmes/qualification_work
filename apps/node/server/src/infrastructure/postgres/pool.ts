import { Pool } from 'pg';

export async function createPool(connectionString: string): Promise<Pool> {
    const pool = new Pool({ connectionString });

    const client = await pool.connect();
    client.release();

    return pool;
}
