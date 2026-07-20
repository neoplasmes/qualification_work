import { useDependencies } from '@/ui/di/dependencies';
import { useLocation } from 'react-router';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import type { ActionsPageStateStore } from '../pageState';

type State = ActionsPageStateStore & {
    selectedActionId: string | null;
    workspaceMode: 'view' | 'edit';
};
export function useActionsPageState<T>(selector: (state: State) => T) {
    const location = useLocation();
    const id = new URLSearchParams(location.search).get('id');

    return useStore(
        useDependencies().ui.actions,
        useShallow(state =>
            selector({
                ...state,
                selectedActionId: id,
                isCreatingAction: !id && state.isCreatingAction,
                workspaceMode:
                    location.pathname.endsWith('/edit') || (!id && state.isCreatingAction)
                        ? 'edit'
                        : 'view',
            })
        )
    );
}
export function useActionsPageActions() {
    return useDependencies().ui.actions.getState();
}
