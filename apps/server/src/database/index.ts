import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString =
    // попадает из докер компоуз
    process.env.DATABASE_URL ??
    // попадает из .env при соло-запуске (мне лень указывать строку целиком в .env)
    (process.env.POSTGRES_USER &&
    process.env.POSTGRES_PASSWORD &&
    process.env.POSTGRES_HOST &&
    process.env.POSTGRES_PORT &&
    process.env.POSTGRES_DB
        ? `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`
        : null);

console.log(connectionString);

if (!connectionString) {
    throw new Error('не найдены env переменные');
}

const pool = new Pool({ connectionString });

try {
    const client = await pool.connect();
    client.release();
} catch (e) {
    throw new Error(`Ошибка подключения к бд.\n${e}`);
}

export const database = drizzle(pool, { schema });
