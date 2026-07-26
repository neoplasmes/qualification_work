import type { Action } from '@/core/entities/action';
import { useState } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import {
    actionToBuilderDraft,
    createActionBuilderDraft,
    type ActionBuilderDraft,
} from '../../ui/ActionBuilder';

export function createActionDraftStore(initial: ActionBuilderDraft) {
    return createStore<{
        draft: ActionBuilderDraft;
        setDraft(
            value:
                | ActionBuilderDraft
                | ((previous: ActionBuilderDraft) => ActionBuilderDraft)
        ): void;
    }>()(set => ({
        draft: initial,
        setDraft: value =>
            set(state => ({
                draft: typeof value === 'function' ? value(state.draft) : value,
            })),
    }));
}

export function useActionDraft(action: Action | undefined) {
    const [store] = useState(() =>
        createActionDraftStore(
            action ? actionToBuilderDraft(action) : createActionBuilderDraft()
        )
    );
    const draft = useStore(store, state => state.draft);

    return { draft, setDraft: store.getState().setDraft };
}
