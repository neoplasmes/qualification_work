import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import type { CacheRuntime } from '../runtime';
import { cacheContext } from './context';

export function CacheProvider({
    runtime,
    children,
}: PropsWithChildren<{ runtime: CacheRuntime }>) {
    return (
        <cacheContext.Provider value={runtime}>
            <QueryClientProvider client={runtime.queryClient}>
                {children}
            </QueryClientProvider>
        </cacheContext.Provider>
    );
}
