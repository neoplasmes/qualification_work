import { ClientRoot } from '@/main/ClientRoot';
import { chartsEditorContext } from '@/ui/pages/charts';
import type { PropsWithChildren } from 'react';

import type { createUiTestRuntime } from './uiRuntime';

export function UiTestProvider({
    store,
    children,
}: PropsWithChildren<{ store: ReturnType<typeof createUiTestRuntime> }>) {
    return (
        <ClientRoot runtime={store.runtime}>
            <chartsEditorContext.Provider value={store.chartEditor}>
                {children}
            </chartsEditorContext.Provider>
        </ClientRoot>
    );
}
