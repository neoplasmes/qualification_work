import { Router } from 'primitive-server';

import type {
    CancelMergeCommand,
    CommitMergeCommand,
    DeleteDatasetCommand,
    DeleteRowCommand,
    InsertRowCommand,
    PatchDatasetCommand,
    PreviewMergeCommand,
    UpdateColumnAnalysisCommand,
    UpdateRowValuesCommand,
    UploadDatasetCommand,
} from '@/core/commands';
import type { TmpFileStorageTool } from '@/core/ports/driven/tools';
import type {
    GetDatasetMetadataByDatasetIdQuery,
    GetDatasetRowsQuery,
    GetDatasetsMetadataByOrgIdQuery,
} from '@/core/queries';

import type { MultipartParserTool } from '@/adapters/driven/tools/_multipartParser';

import type { AppState } from '@/shared/appState';

import {
    createDeleteDatasetHandler,
    createDeleteRowHandler,
    createMergeCancelHandler,
} from './delete';
import {
    createGetDatasetMetadataByDatasetIdHandler,
    createGetDatasetRowsHandler,
    createGetDatasetsMetadataByOrgIdHandler,
} from './get';
import {
    createPatchDatasetHandler,
    createUpdateColumnAnalysisHandler,
    createUpdateRowHandler,
} from './patch';
import {
    createInsertRowHandler,
    createMergeCommitHandler,
    createMergePreviewHandler,
    createUploadDatasetHandler,
    type MergePreviewHandlerConfig,
} from './post';

export type DatasetRouterDeps = {
    getDatasetsMetadataByOrgIdHandler: GetDatasetsMetadataByOrgIdQuery;
    getDatasetMetadataHandler: GetDatasetMetadataByDatasetIdQuery;
    getDatasetRowsHandler: GetDatasetRowsQuery;
    uploadDatasetHandler: UploadDatasetCommand;
    patchDatasetHandler: PatchDatasetCommand;
    updateColumnAnalysisHandler: UpdateColumnAnalysisCommand;
    deleteDatasetHandler: DeleteDatasetCommand;
    deleteRowHandler: DeleteRowCommand;
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
    router.patch('/:id', createPatchDatasetHandler(deps.patchDatasetHandler));
    router.patch(
        '/:id/columns/:columnId',
        createUpdateColumnAnalysisHandler(deps.updateColumnAnalysisHandler)
    );
    router.delete('/:id', createDeleteDatasetHandler(deps.deleteDatasetHandler));

    router.post('/:id/rows', createInsertRowHandler(deps.insertRowHandler));
    router.patch('/:id/rows', createUpdateRowHandler(deps.updateRowHandler));
    router.delete('/:id/rows', createDeleteRowHandler(deps.deleteRowHandler));

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
    router.delete('/merge/:sessionId', createMergeCancelHandler(deps.cancelMergeHandler));

    return router;
}
