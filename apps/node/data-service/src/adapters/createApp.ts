import type { Pool } from 'pg';
import { Application } from 'primitive-server';

import { createRedisCache, type RedisCache } from '@qualification-work/redis-cache';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import {
    ArchiveActionCommand,
    CancelMergeCommand,
    CreateActionCommand,
    CommitMergeCommand,
    CreateChartCommand,
    DeleteChartCommand,
    DeleteDatasetCommand,
    ExecuteActionCommand,
    InsertRowCommand,
    PatchActionCommand,
    PreviewMergeCommand,
    UpdateActionCommand,
    UpdateChartCommand,
    UpdateRowValuesCommand,
    UploadDatasetCommand,
} from '@/core/commands';
import { BaseError, ValidationError } from '@/core/errors';
import {
    GetActionByIdQuery,
    GetActionsByOrgIdQuery,
    GetChartByIdQuery,
    GetChartDataQuery,
    GetChartsByOrgIdQuery,
    GetDatasetMetadataByDatasetIdQuery,
    GetDatasetRowsQuery,
    GetDatasetsMetadataByOrgIdQuery,
    ListActionRunsQuery,
    PreviewChartDataQuery,
} from '@/core/queries';
import type { ListActionRunsInput } from '@/core/queries/action';

import {
    PgActionRepo,
    PgChartRepo,
    PgDatasetRepo,
    RedisMergeSessionRepo,
} from '@/adapters/driven/repos';
import {
    DefaultChartCompilerTool,
    DefaultDatasetParserFactoryTool,
    DiskTmpFileStorageTool,
    FastifyBusboyMultipartParserTool,
} from '@/adapters/driven/tools';
import {
    createActionsRouter,
    createChartsRouter,
    createDatasetRouter,
} from '@/adapters/driving/http';

import type { AppState } from '@/shared/appState';
import { startMergeSessionCleanup } from '@/shared/mergeSessionCleanup';
import { resolveInternalAuthHook, type AuthHook } from '@/shared/resolveInternalAuth';

import type { Config } from '@/infrastructure/config';
import type { RedisClient } from '@/infrastructure/redis';

export type CreateAppOptions = {
    /** override auth hook for tests or e2e scenarios */
    authHook?: AuthHook;
    /** disable cleanup timer in tests */
    disableMergeCleanup?: boolean;
};

export type CreateAppResult = {
    app: Application<AppState>;
    stop: () => void;
};

/** Wires the DI graph and returns an Application ready to listen(). */
export function createApp(
    pool: Pool,
    redis: RedisClient,
    config: Config,
    opts: CreateAppOptions = {}
): Application<AppState> {
    const result = createAppWithCleanup(pool, redis, config, opts);

    return result.app;
}

export function createAppWithCleanup(
    pool: Pool,
    redis: RedisClient,
    config: Config,
    opts: CreateAppOptions = {}
): CreateAppResult {
    const cache = createRedisCache(redis, {
        namespace: 'data-service',
        defaultTtlSeconds: 60,
    });

    // ----- dataset -----
    const datasetRepo = new PgDatasetRepo(pool);
    const multipartParserService = new FastifyBusboyMultipartParserTool();
    const tmpStorage = new DiskTmpFileStorageTool(config.merge.tmpDir);
    const mergeSessionRepo = new RedisMergeSessionRepo(redis);

    const baseGetDatasetsMetadataByOrgIdHandler = new GetDatasetsMetadataByOrgIdQuery(
        datasetRepo
    );
    const baseGetDatasetMetadataHandler = new GetDatasetMetadataByDatasetIdQuery(
        datasetRepo
    );
    const baseGetDatasetRowsHandler = new GetDatasetRowsQuery(datasetRepo);
    const baseUploadDatasetHandler = new UploadDatasetCommand(
        DefaultDatasetParserFactoryTool.resolveParser,
        datasetRepo
    );
    const baseDeleteDatasetHandler = new DeleteDatasetCommand(datasetRepo);
    const baseUpdateRowHandler = new UpdateRowValuesCommand(datasetRepo);
    const baseInsertRowHandler = new InsertRowCommand(datasetRepo);
    const previewMergeHandler = new PreviewMergeCommand(
        datasetRepo,
        mergeSessionRepo,
        tmpStorage,
        DefaultDatasetParserFactoryTool.resolveParser,
        {
            sessionTtlSeconds: config.merge.sessionTtlSeconds,
            maxMergeRowsInMemory: config.merge.maxRowsInMemory,
            maxExistingRowsForMerge: config.merge.maxExistingRowsForMerge,
        }
    );
    const baseCommitMergeHandler = new CommitMergeCommand(
        datasetRepo,
        mergeSessionRepo,
        tmpStorage,
        DefaultDatasetParserFactoryTool.resolveParser
    );
    const cancelMergeHandler = new CancelMergeCommand(mergeSessionRepo, tmpStorage);

    // ----- chart -----
    const chartRepo = new PgChartRepo(pool);
    const chartCompiler = new DefaultChartCompilerTool(pool);

    const baseCreateChartHandler = new CreateChartCommand(chartRepo);
    const baseUpdateChartHandler = new UpdateChartCommand(chartRepo);
    const baseDeleteChartHandler = new DeleteChartCommand(chartRepo);
    const baseGetChartByIdHandler = new GetChartByIdQuery(chartRepo);
    const baseGetChartsByOrgIdHandler = new GetChartsByOrgIdQuery(chartRepo);
    const baseGetChartDataHandler = new GetChartDataQuery(chartRepo, chartCompiler);
    const previewChartDataHandler = new PreviewChartDataQuery(chartRepo, chartCompiler);

    // ----- action -----
    const actionRepo = new PgActionRepo(pool);
    const baseCreateActionHandler = new CreateActionCommand(actionRepo);
    const baseUpdateActionHandler = new UpdateActionCommand(actionRepo);
    const baseArchiveActionHandler = new ArchiveActionCommand(actionRepo);
    const baseExecuteActionHandler = new ExecuteActionCommand(actionRepo);
    const basePatchActionHandler = new PatchActionCommand(actionRepo);
    const baseGetActionByIdHandler = new GetActionByIdQuery(actionRepo);
    const baseGetActionsByOrgIdHandler = new GetActionsByOrgIdQuery(actionRepo);
    const baseListActionRunsHandler = new ListActionRunsQuery(actionRepo);

    const getDatasetsMetadataByOrgIdHandler = cache.wrapExecutable(
        baseGetDatasetsMetadataByOrgIdHandler,
        {
            key: (orgId: string, orgs: OrgMembership[]) => [
                'datasets',
                'list',
                orgId,
                accessFingerprint(orgs),
            ],
            tags: (orgId: string) => [`org:${orgId}:datasets`],
        }
    ) as GetDatasetsMetadataByOrgIdQuery;
    const getDatasetMetadataHandler = cache.wrapExecutable(
        baseGetDatasetMetadataHandler,
        {
            key: (datasetId: string, orgs: OrgMembership[]) => [
                'datasets',
                'metadata',
                datasetId,
                accessFingerprint(orgs),
            ],
            tags: (datasetId: string) => [`dataset:${datasetId}`],
        }
    ) as GetDatasetMetadataByDatasetIdQuery;
    const getDatasetRowsHandler = cache.wrapExecutable(baseGetDatasetRowsHandler, {
        key: (
            datasetId: string,
            offset: number,
            limit: number,
            orgs: OrgMembership[]
        ) => [
            'datasets',
            'rows',
            datasetId,
            offset,
            limit,
            accessFingerprint(orgs),
        ],
        tags: (datasetId: string) => [`dataset:${datasetId}`],
        ttlSeconds: 30,
    }) as GetDatasetRowsQuery;

    const uploadDatasetHandler = {
        execute: async (...args: Parameters<UploadDatasetCommand['execute']>) => {
            const result = await baseUploadDatasetHandler.execute(...args);
            await cache.invalidateTags([
                `dataset:${result.id}`,
                `org:${args[0]}:datasets`,
            ]);

            return result;
        },
    } as UploadDatasetCommand;
    const deleteDatasetHandler = {
        execute: async (datasetId: string) => {
            const metadata =
                await datasetRepo.getDatasetMetadataByDatasetId(datasetId);
            const tags = await datasetTagsForInvalidation(
                chartRepo,
                datasetId,
                metadata?.dataset.orgId
            );

            await baseDeleteDatasetHandler.execute(datasetId);
            await cache.invalidateTags(tags);
        },
    } as DeleteDatasetCommand;
    const updateRowHandler = {
        execute: async (...args: Parameters<UpdateRowValuesCommand['execute']>) => {
            const result = await baseUpdateRowHandler.execute(...args);
            await invalidateDataset(cache, chartRepo, args[0].datasetId, args[0].orgId);

            return result;
        },
    } as UpdateRowValuesCommand;
    const insertRowHandler = {
        execute: async (...args: Parameters<InsertRowCommand['execute']>) => {
            const result = await baseInsertRowHandler.execute(...args);
            await invalidateDataset(cache, chartRepo, args[0].datasetId, args[0].orgId);

            return result;
        },
    } as InsertRowCommand;
    const commitMergeHandler = {
        execute: async (...args: Parameters<CommitMergeCommand['execute']>) => {
            const result = await baseCommitMergeHandler.execute(...args);
            await invalidateDataset(cache, chartRepo, result.datasetId, args[0].orgId);

            return result;
        },
    } as CommitMergeCommand;

    const createChartHandler = {
        execute: async (...args: Parameters<CreateChartCommand['execute']>) => {
            const result = await baseCreateChartHandler.execute(...args);
            await cache.invalidateTags([`org:${args[0].orgId}:charts`]);

            return result;
        },
    } as CreateChartCommand;
    const updateChartHandler = {
        execute: async (...args: Parameters<UpdateChartCommand['execute']>) => {
            const chart = await chartRepo.getById(args[0]);

            await baseUpdateChartHandler.execute(...args);
            await cache.invalidateTags(
                compact([
                    `chart:${args[0]}`,
                    chart && `org:${chart.orgId}:charts`,
                    chart && `dataset:${chart.datasetId}`,
                ])
            );
        },
    } as UpdateChartCommand;
    const deleteChartHandler = {
        execute: async (chartId: string) => {
            const chart = await chartRepo.getById(chartId);

            await baseDeleteChartHandler.execute(chartId);
            await cache.invalidateTags(
                compact([
                    `chart:${chartId}`,
                    chart && `org:${chart.orgId}:charts`,
                    chart && `dataset:${chart.datasetId}`,
                ])
            );
        },
    } as DeleteChartCommand;
    const getChartByIdHandler = cache.wrapExecutable(baseGetChartByIdHandler, {
        key: (chartId: string, orgs: OrgMembership[]) => [
            'charts',
            'by-id',
            chartId,
            accessFingerprint(orgs),
        ],
        tags: (chartId: string) => [`chart:${chartId}`],
    }) as GetChartByIdQuery;
    const getChartsByOrgIdHandler = cache.wrapExecutable(baseGetChartsByOrgIdHandler, {
        key: (orgId: string, orgs: OrgMembership[]) => [
            'charts',
            'list',
            orgId,
            accessFingerprint(orgs),
        ],
        tags: (orgId: string) => [`org:${orgId}:charts`],
    }) as GetChartsByOrgIdQuery;
    const getChartDataHandler = {
        execute: async (...args: Parameters<GetChartDataQuery['execute']>) => {
            const [input] = args;
            const chart = await chartRepo.getById(input.chartId);

            return cache.rememberJson(
                {
                    key: [
                        'charts',
                        'data',
                        input.chartId,
                        input.filterOverrides ?? null,
                        accessFingerprint(input.orgs),
                    ],
                    tags: compact([
                        `chart:${input.chartId}`,
                        chart && `dataset:${chart.datasetId}`,
                    ]),
                    ttlSeconds: 120,
                },
                () => baseGetChartDataHandler.execute(...args)
            );
        },
    } as GetChartDataQuery;

    const createActionHandler = {
        execute: async (...args: Parameters<CreateActionCommand['execute']>) => {
            const result = await baseCreateActionHandler.execute(...args);
            await cache.invalidateTags([`org:${args[0].orgId}:actions`]);

            return result;
        },
    } as CreateActionCommand;
    const updateActionHandler = {
        execute: async (...args: Parameters<UpdateActionCommand['execute']>) => {
            const action = await actionRepo.getById(args[0]);

            await baseUpdateActionHandler.execute(...args);
            await cache.invalidateTags(
                compact([`action:${args[0]}`, action && `org:${action.orgId}:actions`])
            );
        },
    } as UpdateActionCommand;
    const patchActionHandler = {
        execute: async (...args: Parameters<PatchActionCommand['execute']>) => {
            const action = await actionRepo.getById(args[0]);

            await basePatchActionHandler.execute(...args);
            await cache.invalidateTags(
                compact([`action:${args[0]}`, action && `org:${action.orgId}:actions`])
            );
        },
    } as PatchActionCommand;
    const archiveActionHandler = {
        execute: async (...args: Parameters<ArchiveActionCommand['execute']>) => {
            const action = await actionRepo.getById(args[0]);

            await baseArchiveActionHandler.execute(...args);
            await cache.invalidateTags(
                compact([`action:${args[0]}`, action && `org:${action.orgId}:actions`])
            );
        },
    } as ArchiveActionCommand;
    const executeActionHandler = {
        execute: async (...args: Parameters<ExecuteActionCommand['execute']>) => {
            const result = await baseExecuteActionHandler.execute(...args);
            const datasetIds = [
                ...new Set(result.changes.map(change => change.datasetId)),
            ];
            const chartTags = (
                await Promise.all(
                    datasetIds.map(datasetId => chartRepo.listIdsByDatasetId(datasetId))
                )
            )
                .flat()
                .map(chartId => `chart:${chartId}`);

            await cache.invalidateTags([
                `action:${result.actionId}`,
                `action:${result.actionId}:runs`,
                `org:${result.orgId}:actions`,
                ...datasetIds.map(id => `dataset:${id}`),
                ...chartTags,
            ]);

            return result;
        },
    } as ExecuteActionCommand;
    const getActionByIdHandler = cache.wrapExecutable(baseGetActionByIdHandler, {
        key: (actionId: string, orgs: OrgMembership[]) => [
            'actions',
            'by-id',
            actionId,
            accessFingerprint(orgs),
        ],
        tags: (actionId: string) => [`action:${actionId}`],
        ttlSeconds: 60,
    }) as GetActionByIdQuery;
    const getActionsByOrgIdHandler = cache.wrapExecutable(
        baseGetActionsByOrgIdHandler,
        {
            key: (orgId: string, orgs: OrgMembership[]) => [
                'actions',
                'list',
                orgId,
                accessFingerprint(orgs),
            ],
            tags: (orgId: string) => [`org:${orgId}:actions`],
            ttlSeconds: 60,
        }
    ) as GetActionsByOrgIdQuery;
    const listActionRunsHandler = cache.wrapExecutable(baseListActionRunsHandler, {
        key: (input: ListActionRunsInput) => [
            'actions',
            'runs',
            input.kind,
            input.orgId,
            input.kind === 'action' ? input.actionId : null,
            input.offset,
            input.limit,
            accessFingerprint(input.orgs),
        ],
        tags: (input: ListActionRunsInput) =>
            input.kind === 'action'
                ? [
                      `action:${input.actionId}`,
                      `action:${input.actionId}:runs`,
                      `org:${input.orgId}:actions`,
                  ]
                : [`org:${input.orgId}:actions`],
        ttlSeconds: 30,
    }) as ListActionRunsQuery;

    const app = new Application<AppState>();

    app.onError((err, { response }) => {
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

    // CORS is handled at the gateway; these headers are a fallback for direct access
    app.onRequest(async ({ response }) => {
        response.head({
            'access-control-allow-origin': config.clientOrigin,
            'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'access-control-allow-headers': 'Content-Type, X-Internal-Auth',
            'access-control-allow-credentials': 'true',
        });
    });

    app.get('/health', ({ response }) => {
        response.json({ status: 'ok' });
    });

    const datasetRouter = createDatasetRouter({
        getDatasetsMetadataByOrgIdHandler,
        getDatasetMetadataHandler,
        getDatasetRowsHandler,
        uploadDatasetHandler,
        deleteDatasetHandler,
        updateRowHandler,
        insertRowHandler,
        previewMergeHandler,
        commitMergeHandler,
        cancelMergeHandler,
        multipartParser: multipartParserService,
        tmpStorage,
        mergePreviewConfig: { maxFileBytes: config.merge.maxFileBytes },
    });
    const chartsRouter = createChartsRouter(
        createChartHandler,
        updateChartHandler,
        deleteChartHandler,
        getChartByIdHandler,
        getChartsByOrgIdHandler,
        getChartDataHandler,
        previewChartDataHandler
    );
    const actionsRouter = createActionsRouter({
        createActionHandler,
        updateActionHandler,
        archiveActionHandler,
        executeActionHandler,
        patchActionHandler,
        getActionByIdHandler,
        getActionsByOrgIdHandler,
        listActionRunsHandler,
    });

    // gateway rewrites /api/data/* -> /api/* before forwarding here
    app.mount('/api', datasetRouter);
    app.mount('/api', chartsRouter);
    app.mount('/api', actionsRouter);

    const authHook =
        opts.authHook ??
        resolveInternalAuthHook({
            jwksUrl: config.auth.jwksUrl,
            issuer: config.auth.jwtIssuer,
            audience: config.auth.jwtAudience,
        });
    app.assignHook('preHandler', '/api', authHook);

    let stopCleanup = () => undefined as void;
    if (!opts.disableMergeCleanup) {
        stopCleanup = startMergeSessionCleanup(mergeSessionRepo, tmpStorage, {
            intervalMs: config.merge.cleanupIntervalMs,
            maxAgeMs: config.merge.sessionTtlSeconds * 1000,
        });
    }

    return { app, stop: stopCleanup };
}

function accessFingerprint(orgs: OrgMembership[]): string {
    return orgs
        .map(org => `${org.id}:${org.role}`)
        .sort()
        .join('|');
}

async function invalidateDataset(
    cache: RedisCache,
    chartRepo: PgChartRepo,
    datasetId: string,
    orgId: string
): Promise<void> {
    await cache.invalidateTags(
        await datasetTagsForInvalidation(chartRepo, datasetId, orgId)
    );
}

async function datasetTagsForInvalidation(
    chartRepo: PgChartRepo,
    datasetId: string,
    orgId?: string
): Promise<string[]> {
    const chartIds = await chartRepo.listIdsByDatasetId(datasetId).catch(() => []);

    return compact([
        `dataset:${datasetId}`,
        orgId && `org:${orgId}:datasets`,
        ...chartIds.map(chartId => `chart:${chartId}`),
    ]);
}

function compact(values: Array<string | false | null | undefined>): string[] {
    return values.filter((value): value is string => typeof value === 'string');
}
