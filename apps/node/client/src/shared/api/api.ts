import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
    reducerPath: 'rtkApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
    keepUnusedDataFor: 300,
    extractRehydrationInfo(action, { reducerPath }) {
        if (action.type === 'HYDRATE') {
            // oxlint-disable-next-line typescript/no-explicit-any
            return (action.payload as any)[reducerPath];
        }
    },
    endpoints: builder => ({
        getPost: builder.query<{ id: number; title: string; body: string }, number>({
            query: id => `/posts/${id}`,
        }),
        getUser: builder.query<{ id: number; name: string; email: string }, number>({
            query: id => `/users/${id}`,
        }),
        getComments: builder.query<{ id: number; name: string; body: string }[], number>({
            query: postId => `/posts/${postId}/comments`,
        }),
    }),
});

export const { useGetPostQuery, useGetUserQuery, useGetCommentsQuery } = api;
