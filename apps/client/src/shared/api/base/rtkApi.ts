import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type ApiExtraArgument = {
    requestCookie?: string;
};

const browserApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
const serverApiBaseUrl =
    typeof process !== 'undefined'
        ? (process.env.SSR_API_BASE_URL ?? browserApiBaseUrl)
        : browserApiBaseUrl;

const apiBaseUrl = typeof window === 'undefined' ? serverApiBaseUrl : browserApiBaseUrl;

export const api = createApi({
    reducerPath: 'rtkApi',
    tagTypes: [
        'Auth',
        'Actions',
        'ActionRuns',
        'Charts',
        'ChartData',
        'Dashboards',
        'Datasets',
        'DatasetRows',
    ],
    baseQuery: fetchBaseQuery({
        baseUrl: apiBaseUrl,
        credentials: 'include',
        prepareHeaders: (headers, { extra }) => {
            const { requestCookie } = (extra ?? {}) as ApiExtraArgument;

            // we set cookies ONLY on ssr server, where window obviously is undefined
            if (typeof window === 'undefined' && requestCookie) {
                headers.set('cookie', requestCookie);
            }

            return headers;
        },
    }),
    keepUnusedDataFor: 300,
    extractRehydrationInfo(action, { reducerPath }) {
        if (action.type === 'HYDRATE') {
            // oxlint-disable-next-line typescript/no-explicit-any
            return (action.payload as any)[reducerPath];
        }
    },
    endpoints: () => ({}),
});
