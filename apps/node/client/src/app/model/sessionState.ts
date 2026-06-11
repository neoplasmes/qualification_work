import { createAction } from '@reduxjs/toolkit';

export const hydratePersistedState = createAction<object>('app/hydratePersistedState');

export const resetAuthenticatedSessionState = createAction(
    'app/resetAuthenticatedSessionState'
);
