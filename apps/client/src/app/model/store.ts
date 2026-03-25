import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { rtkApi } from '@/shared/api/api';

const rootReducer = combineReducers({
    [rtkApi.reducerPath]: rtkApi.reducer,
});

export function createStore(preloadedState?: Partial<RootState>) {
    return configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware().concat(rtkApi.middleware),
        preloadedState,
    });
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
