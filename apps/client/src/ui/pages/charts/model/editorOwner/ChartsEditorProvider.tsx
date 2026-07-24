import { useDependencies } from '@/ui/di/dependencies';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { createChartDraftStore } from '../chartDraft';
import { chartsEditorContext } from './editor.context';

export function ChartsEditorProvider({ children }: PropsWithChildren) {
    const [store] = useState(createChartDraftStore);
    const { session, ui } = useDependencies();
    useEffect(
        () =>
            session.subscribe(() => {
                if (!session.canRead) {
                    store.setState(store.getInitialState(), true);
                }
            }),
        [session, store]
    );

    useEffect(
        () =>
            ui.activeOrganization.subscribe((next, previous) => {
                if (next.activeOrgId !== previous.activeOrgId) {
                    store.setState(store.getInitialState(), true);
                }
            }),
        [store, ui]
    );

    return (
        <chartsEditorContext.Provider value={store}>
            {children}
        </chartsEditorContext.Provider>
    );
}
