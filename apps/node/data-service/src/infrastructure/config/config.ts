import { z } from 'zod';

const schema = z.object({
    port: z.coerce.number().int().positive(),
    clientOrigin: z.url(),
    postgresConnectionString: z.string().min(1),
    redis: z.object({
        host: z.string().min(1),
        port: z.coerce.number().int().positive(),
        password: z.string().optional(),
    }),
    auth: z.object({
        jwksUrl: z.url(),
        jwtIssuer: z.string().min(1),
        jwtAudience: z.string().min(1),
    }),
    merge: z.object({
        tmpDir: z.string().min(1),
        sessionTtlSeconds: z.coerce.number().int().positive(),
        maxFileBytes: z.coerce.number().int().positive(),
        maxRowsInMemory: z.coerce.number().int().positive(),
        maxExistingRowsForMerge: z.coerce.number().int().positive(),
        cleanupIntervalMs: z.coerce.number().int().positive(),
    }),
});

export type Config = Readonly<z.infer<typeof schema>>;

/**
 * initializes application config from environment variables
 *
 * @export
 * @returns {Config}
 */
export function loadConfig(): Config {
    const env = process.env;

    const result = schema.safeParse({
        port: env.DATA_SERVICE_PORT,
        clientOrigin: env.CLIENT_ORIGIN,
        postgresConnectionString: env.DATABASE_URL,
        redis: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD,
        },
        auth: {
            jwksUrl: env.AUTH_JWKS_URL,
            jwtIssuer: env.AUTH_JWT_ISSUER,
            jwtAudience: env.AUTH_JWT_AUDIENCE,
        },
        merge: {
            tmpDir: env.MERGE_TMP_DIR ?? '/tmp/datasets',
            sessionTtlSeconds: env.MERGE_SESSION_TTL_SECONDS ?? '1800',
            maxFileBytes: env.MERGE_MAX_FILE_BYTES ?? `${500 * 1024 * 1024}`,
            maxRowsInMemory: env.MERGE_MAX_ROWS_IN_MEMORY ?? '100000',
            maxExistingRowsForMerge: env.MERGE_MAX_EXISTING_ROWS ?? '1000000',
            cleanupIntervalMs: env.MERGE_CLEANUP_INTERVAL_MS ?? '300000',
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
        auth: Object.freeze({
            jwksUrl: data.auth.jwksUrl,
            jwtIssuer: data.auth.jwtIssuer,
            jwtAudience: data.auth.jwtAudience,
        }),
        merge: Object.freeze({
            tmpDir: data.merge.tmpDir,
            sessionTtlSeconds: data.merge.sessionTtlSeconds,
            maxFileBytes: data.merge.maxFileBytes,
            maxRowsInMemory: data.merge.maxRowsInMemory,
            maxExistingRowsForMerge: data.merge.maxExistingRowsForMerge,
            cleanupIntervalMs: data.merge.cleanupIntervalMs,
        }),
    });
}
