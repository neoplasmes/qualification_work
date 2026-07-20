import { configureStore, type Middleware } from '@reduxjs/toolkit';

import { api, type ApiExtraArgument } from '@/shared/api';

export type CreateStoreOptions = {
    apiExtraArgument?: ApiExtraArgument;
    middleware?: Middleware;
};
export function createStore(
    preloadedState?: { rtkApi: ReturnType<typeof api.reducer> },
    options: CreateStoreOptions = {}
) {
    return configureStore({
        reducer: { [api.reducerPath]: api.reducer },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: { extraArgument: options.apiExtraArgument ?? {} },
            }).concat(
                api.middleware,
                ...(options.middleware ? [options.middleware] : [])
            ),
        preloadedState,
    });
}
export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
