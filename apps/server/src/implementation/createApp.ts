import type { AppState } from '@/common/appState';
import { parseCookiesMiddleware } from '@/common/parseCookie';
import {
    CreateOrgHandler,
    DeleteOrgHandler,
    LoginHandler,
    LogoutHandler,
    RegisterHandler,
} from '@/core/commands';
import { ValidationError } from '@/core/errors';
import { BaseError } from '@/core/errors/';
import { MeHandler } from '@/core/queries';
import { createAuthRouter, createOrgsRouter } from '@/implementation/http';
import {
    PgOrganizationRepository,
    PgRedisUserRepository,
    RedisMeCacheRepository,
    RedisSessionRepository,
} from '@/implementation/repositories';
import { Argon2Hasher } from '@/implementation/services';
import type { RedisClient } from '@/infrastructure/redis';
import type { Pool } from 'pg';
import { Application } from 'primitive-server';

/**
 * createApp function to reuse in tests
 *
 * @export
 * @param {Pool} pool
 * @param {RedisClient} redis
 * @param {string} pepper
 * @returns {Application<AppState>}
 */
export function createApp(
    pool: Pool,
    redis: RedisClient,
    pepper: string
): Application<AppState> {
    const userRepo = new PgRedisUserRepository(pool);
    const sessionRepo = new RedisSessionRepository(redis);
    const meCacheRepository = new RedisMeCacheRepository(redis);
    const orgRepo = new PgOrganizationRepository(pool, meCacheRepository);
    const hasher = new Argon2Hasher(pepper);

    const registerHandler = new RegisterHandler(userRepo, orgRepo, hasher);
    const loginHandler = new LoginHandler(userRepo, sessionRepo, hasher);
    const logoutHandler = new LogoutHandler(sessionRepo);
    const meHandler = new MeHandler(sessionRepo, userRepo, orgRepo);
    const createOrgHandler = new CreateOrgHandler(orgRepo);
    const deleteOrgHandler = new DeleteOrgHandler(orgRepo);

    const app = new Application<AppState>();

    app.onError((err, { response }) => {
        /**
         * so the response can be sent and errors can be handled somewhere locally, before this hook
         */
        if (response.sent) {
            return;
        }

        if (err instanceof ValidationError) {
            response.status(err.statusCode).json({
                error: err.message,
                fields: err.fields,
            });

            return;
        }

        if (err instanceof BaseError) {
            response.status(err.statusCode).json({ error: err.message });

            return;
        }

        console.error(err);
        response.status(500);
    });

    app.onRequest(({ response, request, state }) => {
        response.head({
            'access-control-allow-origin':
                process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
            'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'access-control-allow-headers': 'Content-Type',
            'access-control-allow-credentials': 'true',
        });

        // TODO: should we parse cookies on OPTIONS and HEAD?
        // TODO: getHeader() doesn't return arrays. Will this kill my app?
        const header = request.getHeader('cookie') ?? '';

        state.cookies = parseCookiesMiddleware(header);
    });

    app.get('/', ({ response }) => {
        response.json({ hello: 'world' });
    });

    app.get('/health', ({ response }) => {
        response.json({ status: 'ok' });
    });

    const authRouter = createAuthRouter(
        registerHandler,
        loginHandler,
        logoutHandler,
        meHandler,
        meCacheRepository,
        sessionRepo
    );
    app.mount('/api', authRouter);

    const orgsRouter = createOrgsRouter(createOrgHandler, deleteOrgHandler);
    app.mount('/api', orgsRouter);

    return app;
}
