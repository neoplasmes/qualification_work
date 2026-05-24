import type { Pool } from 'pg';
import { Application } from 'primitive-server';

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
    // ----- dataset -----
    const datasetRepo = new PgDatasetRepo(pool);
    const multipartParserService = new FastifyBusboyMultipartParserTool();
    const tmpStorage = new DiskTmpFileStorageTool(config.merge.tmpDir);
    const mergeSessionRepo = new RedisMergeSessionRepo(redis);

    const getDatasetsMetadataByOrgIdHandler = new GetDatasetsMetadataByOrgIdQuery(
        datasetRepo
    );
    const getDatasetMetadataHandler = new GetDatasetMetadataByDatasetIdQuery(datasetRepo);
    const getDatasetRowsHandler = new GetDatasetRowsQuery(datasetRepo);
    const uploadDatasetHandler = new UploadDatasetCommand(
        DefaultDatasetParserFactoryTool.resolveParser,
        datasetRepo
    );
    const deleteDatasetHandler = new DeleteDatasetCommand(datasetRepo);
    const updateRowHandler = new UpdateRowValuesCommand(datasetRepo);
    const insertRowHandler = new InsertRowCommand(datasetRepo);
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
    const commitMergeHandler = new CommitMergeCommand(
        datasetRepo,
        mergeSessionRepo,
        tmpStorage,
        DefaultDatasetParserFactoryTool.resolveParser
    );
    const cancelMergeHandler = new CancelMergeCommand(mergeSessionRepo, tmpStorage);

    // ----- chart -----
    const chartRepo = new PgChartRepo(pool);
    const chartCompiler = new DefaultChartCompilerTool(pool);

    const createChartHandler = new CreateChartCommand(chartRepo);
    const updateChartHandler = new UpdateChartCommand(chartRepo);
    const deleteChartHandler = new DeleteChartCommand(chartRepo);
    const getChartByIdHandler = new GetChartByIdQuery(chartRepo);
    const getChartsByOrgIdHandler = new GetChartsByOrgIdQuery(chartRepo);
    const getChartDataHandler = new GetChartDataQuery(chartRepo, chartCompiler);
    const previewChartDataHandler = new PreviewChartDataQuery(chartRepo, chartCompiler);

    // ----- action -----
    const actionRepo = new PgActionRepo(pool);
    const createActionHandler = new CreateActionCommand(actionRepo);
    const updateActionHandler = new UpdateActionCommand(actionRepo);
    const archiveActionHandler = new ArchiveActionCommand(actionRepo);
    const executeActionHandler = new ExecuteActionCommand(actionRepo);
    const patchActionHandler = new PatchActionCommand(actionRepo);
    const getActionByIdHandler = new GetActionByIdQuery(actionRepo);
    const getActionsByOrgIdHandler = new GetActionsByOrgIdQuery(actionRepo);
    const listActionRunsHandler = new ListActionRunsQuery(actionRepo);

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
