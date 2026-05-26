import { api } from '@/shared/api';

import type { Action, ActionRun, ListActionRunsPayload } from './types';

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

export const actionApi = api.injectEndpoints({
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
        listActionRuns: builder.query<ActionRun[], ListActionRunsPayload>({
            query: getRunsQuery,
            providesTags: (_result, _error, arg) => [
                { type: 'ActionRuns', id: 'LIST' },
                ...(arg.kind === 'action'
                    ? [{ type: 'ActionRuns' as const, id: arg.actionId }]
                    : []),
            ],
        }),
    }),
});

export const {
    useArchiveActionMutation,
    useGetActionQuery,
    useListActionRunsQuery,
    useListActionsQuery,
} = actionApi;
