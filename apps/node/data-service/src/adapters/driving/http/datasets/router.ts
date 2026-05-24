import { Router } from 'primitive-server';

import type {
    CancelMergeCommand,
    CommitMergeCommand,
    DeleteDatasetCommand,
    InsertRowCommand,
    PreviewMergeCommand,
    UpdateRowValuesCommand,
    UploadDatasetCommand,
} from '@/core/commands';
import type {
    GetDatasetMetadataByDatasetIdQuery,
    GetDatasetRowsQuery,
    GetDatasetsMetadataByOrgIdQuery,
} from '@/core/queries';
import type { TmpFileStorageTool } from '@/core/ports/driven/tools';

import type { MultipartParserTool } from '@/adapters/driven/tools/_multipartParser';

import type { AppState } from '@/shared/appState';

import { createDeleteDatasetHandler } from './delete.handler';
import { createGetDatasetMetadataByDatasetIdHandler } from './getByDatasetId.handler';
import { createGetDatasetsMetadataByOrgIdHandler } from './getByOrgId.handler';
import { createGetDatasetRowsHandler } from './getRows.handler';
import { createInsertRowHandler } from './insertRow.handler';
import { createMergeCancelHandler } from './mergeCancel.handler';
import { createMergeCommitHandler } from './mergeCommit.handler';
import {
    createMergePreviewHandler,
    type MergePreviewHandlerConfig,
} from './mergePreview.handler';
import { createUpdateRowHandler } from './updateRow.handler';
import { createUploadDatasetHandler } from './upload.handler';

export type DatasetRouterDeps = {
    getDatasetsMetadataByOrgIdHandler: GetDatasetsMetadataByOrgIdQuery;
    getDatasetMetadataHandler: GetDatasetMetadataByDatasetIdQuery;
    getDatasetRowsHandler: GetDatasetRowsQuery;
    uploadDatasetHandler: UploadDatasetCommand;
    deleteDatasetHandler: DeleteDatasetCommand;
    updateRowHandler: UpdateRowValuesCommand;
    insertRowHandler: InsertRowCommand;
    previewMergeHandler: PreviewMergeCommand;
    commitMergeHandler: CommitMergeCommand;
    cancelMergeHandler: CancelMergeCommand;
    multipartParser: MultipartParserTool;
    tmpStorage: TmpFileStorageTool;
    mergePreviewConfig: MergePreviewHandlerConfig;
};

export function createDatasetRouter(deps: DatasetRouterDeps): Router<AppState> {
    const router = new Router<AppState>('/datasets');

    router.get(
        '/',
        createGetDatasetsMetadataByOrgIdHandler(deps.getDatasetsMetadataByOrgIdHandler)
    );
    router.get(
        '/:id/metadata',
        createGetDatasetMetadataByDatasetIdHandler(deps.getDatasetMetadataHandler)
    );
    router.get('/:id/rows', createGetDatasetRowsHandler(deps.getDatasetRowsHandler));
    router.post(
        '/',
        createUploadDatasetHandler(deps.uploadDatasetHandler, deps.multipartParser)
    );
    router.delete('/:id', createDeleteDatasetHandler(deps.deleteDatasetHandler));

    router.post('/:id/rows', createInsertRowHandler(deps.insertRowHandler));
    router.patch('/:id/rows/:rowId', createUpdateRowHandler(deps.updateRowHandler));

    router.post(
        '/merge/preview',
        createMergePreviewHandler(
            deps.previewMergeHandler,
            deps.multipartParser,
            deps.tmpStorage,
            deps.mergePreviewConfig
        )
    );
    router.post(
        '/merge/:sessionId/commit',
        createMergeCommitHandler(deps.commitMergeHandler)
    );
    router.delete(
        '/merge/:sessionId',
        createMergeCancelHandler(deps.cancelMergeHandler)
    );

    return router;
}
