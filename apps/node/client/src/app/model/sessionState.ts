import { createAction } from '@reduxjs/toolkit';

export const resetAuthenticatedSessionState = createAction(
    'app/resetAuthenticatedSessionState'
);
