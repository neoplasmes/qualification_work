import { useCallback, useSyncExternalStore } from 'react';

import { useConfigStoreContext } from './configStoreContext';
import type { ConfigBind, ConfigBinding, ConfigSetter } from './types';

export function useConfigInput<T extends object, K extends keyof T & string>(
    field: K
): ConfigBinding<T[K]>;

export function useConfigInput<T extends object, V>(
    bind: ConfigBind<T, V>
): ConfigBinding<V>;

/**
 * a hook that gives a control over the concrete value in the Draft
 *
 * @export
 * @template T draft shape managed by Config
 * @template K draft field key used for direct field access
 * @template V value produced and updated through ConfigBind
 * @param source
 * @returns
 */
export function useConfigInput<T extends object, K extends keyof T & string, V>(
    source: K | ConfigBind<T, V>
): ConfigBinding<T[K] | V> {
    const store = useConfigStoreContext<T>();
    const isFieldSource = typeof source === 'string';

    const subscribe = useCallback(
        (listener: () => void) => store.subscribe(listener),
        [store]
    );
    const getSnapshot = useCallback(() => {
        if (isFieldSource) {
            return store.getField(source);
        }

        return store.getValue(source);
    }, [isFieldSource, source, store]);
    const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setValue = useCallback(
        (next: ConfigSetter<T[K] | V>) => {
            if (isFieldSource) {
                store.setField(source, next as ConfigSetter<T[K]>);

                return;
            }

            store.setValue(source, next as ConfigSetter<V>);
        },
        [isFieldSource, source, store]
    );

    return { value, setValue };
}
