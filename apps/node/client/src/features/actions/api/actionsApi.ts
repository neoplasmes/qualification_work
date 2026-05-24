import { api } from '@/shared/api';

import type {
    Action,
    ActionRun,
    CreateActionPayload,
    ExecuteActionPayload,
    ListActionRunsPayload,
    PatchActionPayload,
    UpdateActionPayload,
} from './types';

const getRunsQuery = (payload: ListActionRunsPayload) => {
    const params = new URLSearchParams({
        orgId: payload.orgId,
        offset: String(payload.offset ?? 0),
        limit: String(payload.limit ?? 50),
    });

    if (payload.kind === 'action') {
        return `/data/actions/${payload.actionId}/runs?${params.toString()}`;
    }

    return `/data/actions/runs?${params.toString()}`;
};

const getRunDatasetTags = (run: ActionRun | undefined) => {
    if (!run) {
        return [];
    }

    return Array.from(new Set(run.changes.map(change => change.datasetId))).map(datasetId => ({
        type: 'DatasetRows' as const,
        id: datasetId,
    }));
};

export const actionsApi = api.injectEndpoints({
    endpoints: builder => ({
        listActions: builder.query<Action[], string>({
            query: orgId => `/data/actions?orgId=${encodeURIComponent(orgId)}`,
            providesTags: result =>
                result
                    ? [
                          ...result.map(action => ({
                              type: 'Actions' as const,
                              id: action.id,
                          })),
                          { type: 'Actions' as const, id: 'LIST' },
                      ]
                    : [{ type: 'Actions' as const, id: 'LIST' }],
        }),
        getAction: builder.query<Action, string>({
            query: actionId => `/data/actions/${actionId}`,
            providesTags: (_result, _error, actionId) => [
                { type: 'Actions', id: actionId },
            ],
        }),
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
        patchAction: builder.mutation<Action, PatchActionPayload>({
            query: ({ actionId, ...body }) => ({
                url: `/data/actions/${actionId}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Actions', id: arg.actionId },
                { type: 'Actions', id: 'LIST' },
            ],
        }),
        archiveAction: builder.mutation<void, string>({
            query: actionId => ({
                url: `/data/actions/${actionId}`,
                method: 'DELETE',
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, actionId) => [
                { type: 'Actions', id: actionId },
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
        listActionRuns: builder.query<ActionRun[], ListActionRunsPayload>({
            query: getRunsQuery,
            providesTags: (_result, _error, arg) => [
                { type: 'ActionRuns', id: 'LIST' },
                ...(arg.kind === 'action' ? [{ type: 'ActionRuns' as const, id: arg.actionId }] : []),
            ],
        }),
    }),
});

export const {
    useArchiveActionMutation,
    useCreateActionMutation,
    useExecuteActionMutation,
    useGetActionQuery,
    useListActionRunsQuery,
    useListActionsQuery,
    usePatchActionMutation,
    useUpdateActionMutation,
} = actionsApi;
