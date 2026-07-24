import { useDependencies } from '@/ui/di/dependencies';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { createChartDraftStore } from '../chartDraft';
import { chartsEditorContext } from './editor.context';

export function ChartsEditorProvider({ children }: PropsWithChildren) {
    const [store] = useState(createChartDraftStore);
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
