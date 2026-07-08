import { api } from '@/shared/api';

import type {
    LoginPayload,
    MeResponse,
    RegisterPayload,
    RegisterResponse,
} from './types';

export const authApi = api.injectEndpoints({
    endpoints: builder => ({
        register: builder.mutation<RegisterResponse, RegisterPayload>({
            query: body => ({
                url: '/auth/register',
                method: 'POST',
                body,
            }),
        }),
        login: builder.mutation<void, LoginPayload>({
            query: body => ({
                url: '/auth/login',
                method: 'POST',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: ['Auth'],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
                responseHandler: 'text',
            }),
            invalidatesTags: ['Auth'],
        }),
        getMe: builder.query<MeResponse, void>({
            query: () => '/auth/me',
            providesTags: ['Auth'],
        }),
    }),
});

export const {
    useGetMeQuery,
    useLazyGetMeQuery,
    useLoginMutation,
    useLogoutMutation,
    useRegisterMutation,
} = authApi;
