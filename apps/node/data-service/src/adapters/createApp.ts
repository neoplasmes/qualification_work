import type { Pool } from 'pg';
import { Application } from 'primitive-server';

import {
    CreateChartCommand,
    DeleteChartCommand,
    DeleteDatasetCommand,
    UpdateChartCommand,
    UploadDatasetCommand,
} from '@/core/commands';
import { BaseError, ValidationError } from '@/core/errors';
import {
    GetChartByIdQuery,
    GetChartDataQuery,
    GetChartsByOrgIdQuery,
    GetDatasetMetadataByDatasetIdQuery,
    GetDatasetRowsQuery,
    GetDatasetsMetadataByOrgIdQuery,
} from '@/core/queries';

import { PgChartRepo, PgDatasetRepo } from '@/adapters/driven/repos';
import {
    DefaultChartCompilerTool,
    DefaultDatasetParserFactoryTool,
    FastifyBusboyMultipartParserTool,
} from '@/adapters/driven/tools';
import { createChartsRouter, createDatasetRouter } from '@/adapters/driving/http';

import type { AppState } from '@/shared/appState';

import type { Config } from '@/infrastructure/config';

/** Wires the DI graph and returns an Application ready to listen(). */
export function createApp(pool: Pool, config: Config): Application<AppState> {
    // ----- dataset -----
    const datasetRepo = new PgDatasetRepo(pool);
    const multipartParserService = new FastifyBusboyMultipartParserTool();

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

    // ----- chart -----
    const chartRepo = new PgChartRepo(pool);
    const chartCompiler = new DefaultChartCompilerTool(pool);

    const createChartHandler = new CreateChartCommand(chartRepo);
    const updateChartHandler = new UpdateChartCommand(chartRepo);
    const deleteChartHandler = new DeleteChartCommand(chartRepo);
    const getChartByIdHandler = new GetChartByIdQuery(chartRepo);
    const getChartsByOrgIdHandler = new GetChartsByOrgIdQuery(chartRepo);
    const getChartDataHandler = new GetChartDataQuery(chartRepo, chartCompiler);

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
            'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'access-control-allow-headers': 'Content-Type, X-Internal-Auth',
            'access-control-allow-credentials': 'true',
        });
    });

    app.get('/health', ({ response }) => {
        response.json({ status: 'ok' });
    });

    const datasetRouter = createDatasetRouter(
        getDatasetsMetadataByOrgIdHandler,
        getDatasetMetadataHandler,
        getDatasetRowsHandler,
        uploadDatasetHandler,
        deleteDatasetHandler,
        multipartParserService
    );
    const chartsRouter = createChartsRouter(
        createChartHandler,
        updateChartHandler,
        deleteChartHandler,
        getChartByIdHandler,
        getChartsByOrgIdHandler,
        getChartDataHandler
    );

    // gateway rewrites /api/data/* -> /api/* before forwarding here
    app.mount('/api', datasetRouter);
    app.mount('/api', chartsRouter);

    return app;
}
