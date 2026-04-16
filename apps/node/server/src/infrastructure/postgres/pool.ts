import { Pool } from 'pg';

function buildConnectionString(): string {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    const {
        POSTGRES_USER,
        POSTGRES_PASSWORD,
        POSTGRES_HOST,
        POSTGRES_PORT,
        POSTGRES_DB,
    } = process.env;

    if (
        POSTGRES_USER &&
        POSTGRES_PASSWORD &&
        POSTGRES_HOST &&
        POSTGRES_PORT &&
        POSTGRES_DB
    ) {
        return `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;
    }

    throw new Error('не найдены env переменные');
}

export async function createPool(): Promise<Pool> {
    const connectionString = buildConnectionString();
    const pool = new Pool({ connectionString });

    const client = await pool.connect();
    client.release();

    return pool;
}
