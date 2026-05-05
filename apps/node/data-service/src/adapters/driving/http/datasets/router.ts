import { Router } from 'primitive-server';

import type { UploadDatasetCommand } from '@/core/commands';
import type {
    GetDatasetMetadataByDatasetIdQuery,
    GetDatasetRowsQuery,
    GetDatasetsMetadataByOrgIdQuery,
} from '@/core/queries';

import type { MultipartParserTool } from '@/adapters/driven/tools/_multipartParser';

import type { AppState } from '@/shared/appState';

import { createGetDatasetMetadataByDatasetIdHandler } from './getByDatasetId.handler';
import { createGetDatasetsMetadataByOrgIdHandler } from './getByOrgId.handler';
import { createGetDatasetRowsHandler } from './getRows.handler';
import { createUploadDatasetHandler } from './upload.handler';

/**
 * Complete stream flow looks like this: POST /datasets with multipart/form-data ->
 * request validation -> multipart/form-data parser -> uploadDatasetHandler, that orcestrates the work ->
 * datasetRepository -> database actually
 *
 * @export
 * @param {UploadDatasetCommand} uploadDatasetHandler
 * @param {MultipartParserTool} multipartParser
 * @returns {Router<AppState>}
 */
export function createDatasetRouter(
    getDatasetsMetadataByOrgIdHandler: GetDatasetsMetadataByOrgIdQuery,
    getDatasetMetadataHandler: GetDatasetMetadataByDatasetIdQuery,
    getDatasetRowsHandler: GetDatasetRowsQuery,
    uploadDatasetHandler: UploadDatasetCommand,
    multipartParser: MultipartParserTool
): Router<AppState> {
    const router = new Router<AppState>('/datasets');

    router.get(
        '/',
        createGetDatasetsMetadataByOrgIdHandler(getDatasetsMetadataByOrgIdHandler)
    );
    router.get(
        '/:id/metadata',
        createGetDatasetMetadataByDatasetIdHandler(getDatasetMetadataHandler)
    );
    router.get('/:id/rows', createGetDatasetRowsHandler(getDatasetRowsHandler));
    router.post('/', createUploadDatasetHandler(uploadDatasetHandler, multipartParser));

    return router;
}
