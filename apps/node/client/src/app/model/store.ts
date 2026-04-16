import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { api } from '@/shared/api';

const rootReducer = combineReducers({
    [api.reducerPath]: api.reducer,
});

export function createStore(preloadedState?: Partial<RootState>) {
    return configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(api.middleware),
        preloadedState,
    });
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
