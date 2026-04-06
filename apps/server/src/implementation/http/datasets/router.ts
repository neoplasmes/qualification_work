import { Router } from 'primitive-server';

import type { UploadDatasetHandler } from '@/core/commands';
import type { MultipartParserService } from '@/core/ports/services';
import type {
    GetDatasetMetadataHandler,
    GetDatasetRowsHandler,
    GetDatasetsMetadataByOrgIdHandler,
} from '@/core/queries';

import type { AppState } from '@/common/appState';

import { createGetDatasetsMetadataByOrgIdHandler } from './getByOrgId';
import { createGetDatasetMetadataHandler } from './getMetadata';
import { createGetDatasetRowsHandler } from './getRows';
import { createUploadDatasetHandler } from './upload';

/**
 * Complete stream flow looks like this: POST /datasets with multipart/form-data ->
 * request validation -> multipart/form-data parser -> uploadDatasetHandler, that orcestrates the work ->
 * datasetRepository -> database actually
 *
 * @export
 * @param {UploadDatasetHandler} uploadDatasetHandler
 * @param {MultipartParserService} multipartParser
 * @returns {Router<AppState>}
 */
export function createDatasetRouter(
    getDatasetsMetadataByOrgIdHandler: GetDatasetsMetadataByOrgIdHandler,
    getDatasetMetadataHandler: GetDatasetMetadataHandler,
    getDatasetRowsHandler: GetDatasetRowsHandler,
    uploadDatasetHandler: UploadDatasetHandler,
    multipartParser: MultipartParserService
): Router<AppState> {
    const router = new Router<AppState>('/datasets');

    router.get('/', createGetDatasetsMetadataByOrgIdHandler(getDatasetsMetadataByOrgIdHandler));
    router.get('/:id/metadata', createGetDatasetMetadataHandler(getDatasetMetadataHandler));
    router.get('/:id/rows', createGetDatasetRowsHandler(getDatasetRowsHandler));
    router.post('/', createUploadDatasetHandler(uploadDatasetHandler, multipartParser));

    return router;
}
