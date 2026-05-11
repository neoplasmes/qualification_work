import { z } from 'zod';

// TODO: move this thing to microsevice-utils

const schema = z.object({
    port: z.coerce.number().int().positive(),
    clientOrigin: z.string().min(1),
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
        port: env.SERVER_PORT,
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
    });
}
