import type { Pool } from 'pg';
import { Application } from 'primitive-server';

import {
    AddDashboardItemCommand,
    CreateDashboardCommand,
    CreateOrgCommand,
    DeleteDashboardCommand,
    DeleteDashboardItemCommand,
    DeleteOrgCommand,
    RenameDashboardCommand,
    ReorderDashboardCommand,
} from '@/core/commands';
import { BaseError, ValidationError } from '@/core/errors';
import { GetDashboardQuery, ListDashboardsQuery } from '@/core/queries';

import { PgDashboardRepo, PgOrgRepo } from '@/adapters/driven/repos';
import { createDashboardsRouter, createOrgsRouter } from '@/adapters/driving/http';

import type { AppState } from '@/shared/appState';
import { parseCookiesMiddleware } from '@/shared/parseCookie';
import { resolveInternalAuthHook, type AuthHook } from '@/shared/resolveInternalAuth';

import type { Config } from '@/infrastructure/config';

export type CreateAppOptions = {
    /**
     * overrides auth hook for tests or e2e scenarios
     * defaults to resolveInternalAuthHook built from config
     */
    authHook?: AuthHook;
};

/**
 * createApp function to reuse in tests
 *
 * @export
 * @param {Pool} pool
 * @param {Config} config
 * @param {CreateAppOptions} [opts]
 * @returns {Application<AppState>}
 */
export function createApp(
    pool: Pool,
    config: Config,
    opts: CreateAppOptions = {}
): Application<AppState> {
    const app = new Application<AppState>();

    // ——————————————————————————————— CORS ———————————————————————————————————

    app.onRequest(async ({ response, request, state }) => {
        response.head({
            'access-control-allow-origin': config.clientOrigin,
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

    // —————————————————————————————————————————————————————————————————————————————
    // ——————————————————————————————————— Org —————————————————————————————————————
    // —————————————————————————————————————————————————————————————————————————————

    const orgRepo = new PgOrgRepo(pool);

    const createOrg = new CreateOrgCommand(orgRepo);
    const deleteOrg = new DeleteOrgCommand(orgRepo);

    const orgsRouter = createOrgsRouter(createOrg, deleteOrg);

    app.mount('/api', orgsRouter);

    // —————————————————————————————————————————————————————————————————————————————
    // ———————————————————————————————— Dashboard ——————————————————————————————————
    // —————————————————————————————————————————————————————————————————————————————

    const dashboardRepo = new PgDashboardRepo(pool);

    const createDashboard = new CreateDashboardCommand(dashboardRepo);
    const deleteDashboard = new DeleteDashboardCommand(dashboardRepo);
    const renameDashboard = new RenameDashboardCommand(dashboardRepo);
    const addDashboardItem = new AddDashboardItemCommand(dashboardRepo);
    const deleteDashboardItem = new DeleteDashboardItemCommand(dashboardRepo);
    const reorderDashboard = new ReorderDashboardCommand(dashboardRepo);

    const getDashboard = new GetDashboardQuery(dashboardRepo);
    const listDashboards = new ListDashboardsQuery(dashboardRepo);

    const dashboardsRouter = createDashboardsRouter({
        createDashboard,
        deleteDashboard,
        renameDashboard,
        addDashboardItem,
        deleteDashboardItem,
        reorderDashboard,
        getDashboard,
        listDashboards,
    });
    app.mount('/api', dashboardsRouter);

    // ———————————————————————————————— Auth ————————————————————————————————————

    const authHook =
        opts.authHook ??
        resolveInternalAuthHook({
            jwksUrl: config.auth.jwksUrl,
            issuer: config.auth.jwtIssuer,
            audience: config.auth.jwtAudience,
        });

    app.assignHook('preHandler', '/api', authHook);

    // ———————————————————————————— Error handling ——————————————————————————————

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

    return app;
}
