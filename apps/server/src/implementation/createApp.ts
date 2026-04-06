import type { Pool } from 'pg';
import { Application } from 'primitive-server';

import {
    CreateOrgHandler,
    DeleteOrgHandler,
    LoginHandler,
    LogoutHandler,
    RegisterHandler,
    UploadDatasetHandler,
} from '@/core/commands';
import { ValidationError } from '@/core/errors';
import { BaseError } from '@/core/errors/';
import { MeHandler } from '@/core/queries';

import {
    createAuthRouter,
    createDatasetRouter,
    createOrgsRouter,
} from '@/implementation/http';
import {
    PgDatasetRepository,
    PgOrganizationRepository,
    PgRedisUserRepository,
    RedisMeCacheRepository,
    RedisSessionRepository,
} from '@/implementation/repositories';
import {
    Argon2HasherService,
    DefaultDatasetParserFactoryService,
    FastifyBusboyMultipartParserService,
} from '@/implementation/services';

import type { AppState } from '@/common/appState';
import { resolveRequestAuth } from '@/common/auth';
import { parseCookiesMiddleware } from '@/common/parseCookie';

import type { RedisClient } from '@/infrastructure/redis';

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
    const hasher = new Argon2HasherService(pepper);

    const registerHandler = new RegisterHandler(userRepo, orgRepo, hasher);
    const loginHandler = new LoginHandler(userRepo, sessionRepo, hasher);
    const logoutHandler = new LogoutHandler(sessionRepo);
    const meHandler = new MeHandler(sessionRepo, userRepo, orgRepo);
    const createOrgHandler = new CreateOrgHandler(orgRepo);
    const deleteOrgHandler = new DeleteOrgHandler(orgRepo);

    const datasetRepo = new PgDatasetRepository(pool);
    const multipartParserService = new FastifyBusboyMultipartParserService();
    const uploadDatasetHandler = new UploadDatasetHandler(
        DefaultDatasetParserFactoryService.resolveParser,
        datasetRepo
    );

    // TODO: add auth to AppState and secure endpoints.
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

    app.onRequest(async ({ response, request, state }) => {
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

        state.auth = await resolveRequestAuth(
            sessionRepo,
            state.cookies['session'] ?? ''
        );
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

    const datasetRouter = createDatasetRouter(
        uploadDatasetHandler,
        multipartParserService
    );
    app.mount('/api', datasetRouter);

    return app;
}
