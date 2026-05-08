import { z } from 'zod';

const rawSchema = z.object({
    port: z.coerce.number().int().positive(),
    clientOrigin: z.url(),
    postgresConnectionString: z.string().min(1),
    redis: z.object({
        host: z.string().min(1),
        port: z.coerce.number().int().positive(),
        password: z.string().optional(),
    }),
});

export type Config = Readonly<{
    port: number;
    clientOrigin: string;
    postgresConnectionString: string;
    redis: Readonly<{
        host: string;
        port: number;
        password?: string;
    }>;
}>;

export function loadConfig(): Config {
    const env = process.env;

    const result = rawSchema.safeParse({
        port: env.DATA_SERVICE_PORT,
        clientOrigin: env.CLIENT_ORIGIN,
        postgresConnectionString: env.DATABASE_URL,
        redis: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD,
        },
    });

    if (!result.success) {
        const missing = result.error.issues.map(i => i.path.join('.')).join(', ');

        throw new Error(`Invalid config, missing or invalid properties: ${missing}`);
    }

    const { data } = result;

    return Object.freeze({
        port: data.port,
        clientOrigin: data.clientOrigin,
        postgresConnectionString: data.postgresConnectionString,
        redis: Object.freeze({
            host: data.redis.host,
            port: data.redis.port,
            password: data.redis.password,
        }),
    });
}
