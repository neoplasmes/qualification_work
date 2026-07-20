import { useCallback, useSyncExternalStore } from 'react';

import { useConfigStoreContext } from './configStoreContext';
import type { ConfigSnapshot } from './types';

export const useConfig = <T extends object>() => {
    const store = useConfigStoreContext<T>();

    /** "this" was being lost when passing store.subscribe to useSyncExternalStore */
    const stableSubscribe = useCallback(
        (listener: () => void) => store.subscribe(listener),
        [store]
    );
    const getSnapshot = useCallback(() => store.getSnapshot(), [store]);

    return useSyncExternalStore(
        stableSubscribe,
        getSnapshot,
        getSnapshot
    ) as ConfigSnapshot<T>;
};
