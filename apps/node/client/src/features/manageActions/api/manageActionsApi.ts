import type { Action, ActionRun } from '@/entities/action';

import { api } from '@/shared/api';

import type {
    CreateActionPayload,
    ExecuteActionPayload,
    PatchActionPayload,
    UpdateActionPayload,
} from './types';

const getRunDatasetTags = (run: ActionRun | undefined) => {
    if (!run) {
        return [];
    }

    return Array.from(new Set(run.changes.map(change => change.datasetId))).map(
        datasetId => ({
            type: 'DatasetRows' as const,
            id: datasetId,
        })
    );
};

export const manageActionsApi = api.injectEndpoints({
    endpoints: builder => ({
        createAction: builder.mutation<Action, CreateActionPayload>({
            query: body => ({
                url: '/data/actions',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Actions', id: 'LIST' }],
        }),
        updateAction: builder.mutation<Action, UpdateActionPayload>({
            query: ({ actionId, ...body }) => ({
                url: `/data/actions/${actionId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Actions', id: arg.actionId },
                { type: 'Actions', id: 'LIST' },
            ],
        }),
        patchAction: builder.mutation<void, PatchActionPayload>({
            query: ({ actionId, ...body }) => ({
                url: `/data/actions/${actionId}`,
                method: 'PATCH',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Actions', id: arg.actionId },
                { type: 'Actions', id: 'LIST' },
            ],
        }),
        executeAction: builder.mutation<ActionRun, ExecuteActionPayload>({
            query: ({ actionId, parameters }) => ({
                url: `/data/actions/${actionId}/runs`,
                method: 'POST',
                body: { parameters },
            }),
            invalidatesTags: (result, _error, arg) => [
                { type: 'ActionRuns', id: 'LIST' },
                { type: 'ActionRuns', id: arg.actionId },
                ...getRunDatasetTags(result),
            ],
        }),
    }),
});

export const {
    useCreateActionMutation,
    useExecuteActionMutation,
    usePatchActionMutation,
    useUpdateActionMutation,
} = manageActionsApi;
