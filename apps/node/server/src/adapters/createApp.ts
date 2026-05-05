import type { Pool } from 'pg';
import { Application } from 'primitive-server';

import {
    CreateOrgCommand,
    DeleteOrgCommand,
    UploadDatasetCommand,
} from '@/core/commands';
import { BaseError, ValidationError } from '@/core/errors';
import {
    GetDatasetMetadataByDatasetIdQuery,
    GetDatasetRowsQuery,
    GetDatasetsMetadataByOrgIdQuery,
} from '@/core/queries';

import { PgDatasetRepo, PgOrgRepo } from '@/adapters/driven/repos';
import {
    DefaultDatasetParserFactoryTool,
    FastifyBusboyMultipartParserTool,
} from '@/adapters/driven/tools';
import { createDatasetRouter, createOrgsRouter } from '@/adapters/driving/http';

import type { AppState } from '@/shared/appState';
import { parseCookiesMiddleware } from '@/shared/parseCookie';

/**
 * createApp function to reuse in tests
 *
 * @export
 * @param {Pool} pool
 * @returns {Application<AppState>}
 */
export function createApp(pool: Pool): Application<AppState> {
    const orgRepo = new PgOrgRepo(pool);

    const createOrgHandler = new CreateOrgCommand(orgRepo);
    const deleteOrgHandler = new DeleteOrgCommand(orgRepo);

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
    });

    app.get('/', ({ response }) => {
        response.json({ hello: 'world' });
    });

    app.get('/health', ({ response }) => {
        response.json({ status: 'ok' });
    });

    const orgsRouter = createOrgsRouter(createOrgHandler, deleteOrgHandler);
    app.mount('/api', orgsRouter);

    const datasetRouter = createDatasetRouter(
        getDatasetsMetadataByOrgIdHandler,
        getDatasetMetadataHandler,
        getDatasetRowsHandler,
        uploadDatasetHandler,
        multipartParserService
    );
    app.mount('/api', datasetRouter);

    return app;
}
