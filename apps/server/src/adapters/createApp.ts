import type { Pool } from 'pg';
import { Application } from 'primitive-server';

import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import {
    BaseError,
    ValidationError,
} from '@qualification-work/microservice-utils/errors';
import { JsepMetricExpressionTool } from '@qualification-work/microservice-utils/metricExpression';
import type { RedisCache } from '@qualification-work/microservice-utils/redis';

import {
    AddDashboardItemCommand,
    CreateDashboardCommand,
    DeleteDashboardCommand,
    DeleteDashboardItemCommand,
    RenameDashboardCommand,
    UpdateDashboardItemCommand,
    UpdateDashboardLayoutCommand,
} from '@/core/commands';
import { GetDashboardQuery, ListDashboardsQuery } from '@/core/queries';

import { PgDashboardRepo } from '@/adapters/driven/repos';
import { createDashboardsRouter } from '@/adapters/driving/http';

import type { AppState } from '@/shared/appState';
import { getReadableOrgIds } from '@/shared/checkOrgMembership';
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
 * @param {RedisCache} cache
 * @param {Config} config
 * @param {CreateAppOptions} [opts]
 * @returns {Application<AppState>}
 */
export function createApp(
    pool: Pool,
    cache: RedisCache,
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
    // ———————————————————————————————— Dashboard ——————————————————————————————————
    // —————————————————————————————————————————————————————————————————————————————

    const dashboardRepo = new PgDashboardRepo(pool, new JsepMetricExpressionTool());

    const baseCreateDashboard = new CreateDashboardCommand(dashboardRepo);
    const baseDeleteDashboard = new DeleteDashboardCommand(dashboardRepo);
    const baseRenameDashboard = new RenameDashboardCommand(dashboardRepo);
    const baseAddDashboardItem = new AddDashboardItemCommand(dashboardRepo);
    const baseDeleteDashboardItem = new DeleteDashboardItemCommand(dashboardRepo);
    const baseUpdateDashboardItem = new UpdateDashboardItemCommand(dashboardRepo);
    const baseUpdateDashboardLayout = new UpdateDashboardLayoutCommand(dashboardRepo);

    const baseGetDashboard = new GetDashboardQuery(dashboardRepo);
    const baseListDashboards = new ListDashboardsQuery(dashboardRepo);

    const createDashboard = {
        execute: async (...args: Parameters<CreateDashboardCommand['execute']>) => {
            const id = await baseCreateDashboard.execute(...args);
            await cache.invalidateTags([`org:${args[0]}:dashboards`]);

            return id;
        },
    } as CreateDashboardCommand;
    const deleteDashboard = {
        execute: async (...args: Parameters<DeleteDashboardCommand['execute']>) => {
            const dashboard = await dashboardRepo.findById(
                args[0],
                getReadableOrgIds(args[1])
            );

            await baseDeleteDashboard.execute(...args);
            await cache.invalidateTags(
                compact([
                    `dashboard:${args[0]}`,
                    dashboard && `org:${dashboard.orgId}:dashboards`,
                ])
            );
        },
    } as DeleteDashboardCommand;
    const renameDashboard = {
        execute: async (...args: Parameters<RenameDashboardCommand['execute']>) => {
            const dashboard = await dashboardRepo.findById(
                args[0],
                getReadableOrgIds(args[2])
            );

            await baseRenameDashboard.execute(...args);
            await cache.invalidateTags(
                compact([
                    `dashboard:${args[0]}`,
                    dashboard && `org:${dashboard.orgId}:dashboards`,
                ])
            );
        },
    } as RenameDashboardCommand;
    const addDashboardItem = {
        execute: async (...args: Parameters<AddDashboardItemCommand['execute']>) => {
            const result = await baseAddDashboardItem.execute(...args);
            const dashboard = await dashboardRepo.findById(
                args[0],
                getReadableOrgIds(args[2])
            );

            await cache.invalidateTags(
                compact([
                    `dashboard:${args[0]}`,
                    dashboard && `org:${dashboard.orgId}:dashboards`,
                ])
            );

            return result;
        },
    } as AddDashboardItemCommand;
    const deleteDashboardItem = {
        execute: async (...args: Parameters<DeleteDashboardItemCommand['execute']>) => {
            const dashboard = await dashboardRepo.findById(
                args[0],
                getReadableOrgIds(args[2])
            );

            await baseDeleteDashboardItem.execute(...args);
            await cache.invalidateTags(
                compact([
                    `dashboard:${args[0]}`,
                    dashboard && `org:${dashboard.orgId}:dashboards`,
                ])
            );
        },
    } as DeleteDashboardItemCommand;
    const updateDashboardItem = {
        execute: async (...args: Parameters<UpdateDashboardItemCommand['execute']>) => {
            await baseUpdateDashboardItem.execute(...args);
            const dashboard = await dashboardRepo.findById(
                args[0],
                getReadableOrgIds(args[3])
            );

            await cache.invalidateTags(
                compact([
                    `dashboard:${args[0]}`,
                    dashboard && `org:${dashboard.orgId}:dashboards`,
                ])
            );
        },
    } as UpdateDashboardItemCommand;
    const updateDashboardLayout = {
        execute: async (...args: Parameters<UpdateDashboardLayoutCommand['execute']>) => {
            const dashboard = await dashboardRepo.findById(
                args[0],
                getReadableOrgIds(args[2])
            );

            await baseUpdateDashboardLayout.execute(...args);
            await cache.invalidateTags(
                compact([
                    `dashboard:${args[0]}`,
                    dashboard && `org:${dashboard.orgId}:dashboards`,
                ])
            );
        },
    } as UpdateDashboardLayoutCommand;

    const getDashboard = baseGetDashboard;
    const listDashboards = cache.wrapExecutable(baseListDashboards, {
        key: (orgId: string, orgs: OrgMembership[]) => [
            'dashboards',
            'list',
            orgId,
            accessFingerprint(orgs),
        ],
        tags: (orgId: string) => [`org:${orgId}:dashboards`],
    }) as ListDashboardsQuery;

    const dashboardsRouter = createDashboardsRouter({
        createDashboard,
        deleteDashboard,
        renameDashboard,
        addDashboardItem,
        deleteDashboardItem,
        updateDashboardItem,
        updateDashboardLayout,
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

function accessFingerprint(orgs: OrgMembership[]): string {
    return orgs
        .map(org => `${org.id}:${org.role}`)
        .sort()
        .join('|');
}

function compact(values: Array<string | false | null | undefined>): string[] {
    return values.filter((value): value is string => typeof value === 'string');
}
