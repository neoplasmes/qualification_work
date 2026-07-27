import { CacheProvider } from '@/env/cache/context';
import { dependenciesContext } from '@/ui/di/dependencies';
import type { PropsWithChildren } from 'react';
import { RouterProvider, type createBrowserRouter } from 'react-router';

import type { ApplicationRuntime } from '../dependencies';

export function ClientRoot({
    runtime,
    router,
    children,
}: PropsWithChildren<{
    runtime: ApplicationRuntime;
    router?: ReturnType<typeof createBrowserRouter>;
}>) {
    let content = children;
    if (router) {
        content = <RouterProvider router={router} />;
    }

    return (
        <dependenciesContext.Provider value={runtime.dependencies}>
            <CacheProvider runtime={runtime.cache}>
                <div data-theme="paper" style={{ height: '100%' }}>
                    {content}
                </div>
            </CacheProvider>
        </dependenciesContext.Provider>
    );
}
