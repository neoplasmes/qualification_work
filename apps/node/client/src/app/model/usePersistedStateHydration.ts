import { useLayoutEffect } from 'react';
import { useDispatch } from 'react-redux';

import { hydratePersistedState } from './sessionState';
import { getPersistedState, type AppDispatch } from './store';

export const usePersistedStateHydration = (enabled = true) => {
    const dispatch = useDispatch<AppDispatch>();

    useLayoutEffect(() => {
        if (!enabled) {
            return;
        }

        dispatch(hydratePersistedState(getPersistedState()));
    }, [dispatch, enabled]);
};
