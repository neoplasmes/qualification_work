import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const rtkApi = createApi({
    reducerPath: 'rtkApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
    extractRehydrationInfo(action, { reducerPath }) {
        if (action.type === 'HYDRATE') {
            return (action.payload as any)[reducerPath];
        }
    },
    endpoints: builder => ({
        getPost: builder.query<{ id: number; title: string; body: string }, number>({
            query: id => `/posts/${id}`,
        }),
    }),
});

export const { useGetPostQuery } = rtkApi;
