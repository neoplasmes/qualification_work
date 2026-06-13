import { useCallback, useSyncExternalStore } from 'react';

import { useConfigStoreContext } from './configStoreContext';
import type { ConfigBind, ConfigBinding, ConfigSetter } from './types';

export const useConfigInput = <T extends object, V>(
    bind: ConfigBind<T, V>
): ConfigBinding<V> => {
    const store = useConfigStoreContext<T, unknown>();

    const subscribe = useCallback(
        (listener: () => void) => store.subscribe(listener),
        [store]
    );
    const getSnapshot = useCallback(() => store.getValue(bind), [bind, store]);
    const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setValue = useCallback(
        (next: ConfigSetter<V>) => {
            store.setValue(bind, next);
        },
        [bind, store]
    );

    return { value, setValue };
};
