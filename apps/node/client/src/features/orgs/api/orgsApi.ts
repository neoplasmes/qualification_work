import { api } from '@/shared/api';

import type { CreateOrgPayload, CreateOrgResponse } from './types';

export const orgsApi = api.injectEndpoints({
    endpoints: builder => ({
        createOrg: builder.mutation<CreateOrgResponse, CreateOrgPayload>({
            query: body => ({
                url: '/orgs',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Auth'],
        }),
        deleteOrg: builder.mutation<void, string>({
            query: orgId => ({
                url: `/orgs/${orgId}`,
                method: 'DELETE',
                responseHandler: 'text',
            }),
            invalidatesTags: ['Auth'],
        }),
    }),
});

export const { useCreateOrgMutation, useDeleteOrgMutation } = orgsApi;
