import { createContext, useContext } from 'react';

import type { ConfigStore } from './configStore';

export const configStoreContext = createContext<ConfigStore<object, unknown> | null>(
    null
);

export const useConfigStoreContext = <T extends object, O>() => {
    const store = useContext(configStoreContext);

    if (!store) {
        throw new Error('Config components must be rendered inside Config.Root.');
    }

    return store as unknown as ConfigStore<T, O>;
};
