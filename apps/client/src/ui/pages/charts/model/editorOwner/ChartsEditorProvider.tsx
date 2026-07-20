import { useDependencies } from '@/ui/di/dependencies';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { createChartsPageStore } from '../pageState';
import { chartsEditorContext } from './editor.context';

export function ChartsEditorProvider({ children }: PropsWithChildren) {
    const [store] = useState(createChartsPageStore);
    const { session } = useDependencies();
    useEffect(
        () =>
            session.subscribe(() => {
                if (!session.canRead) {
                    store.setState(store.getInitialState(), true);
                }
            }),
        [session, store]
    );

    return (
        <chartsEditorContext.Provider value={store}>
            {children}
        </chartsEditorContext.Provider>
    );
}
