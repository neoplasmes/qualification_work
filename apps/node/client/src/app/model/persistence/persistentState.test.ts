import { beforeEach, describe, expect, it } from 'vitest';

import { persistentStateStorage } from './persistentState';

describe('persistentState', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('loads fallback state when storage is empty or invalid', () => {
        expect(persistentStateStorage.load('missing', { selectedId: null })).toEqual({
            selectedId: null,
        });

        localStorage.setItem('broken', '{');

        expect(persistentStateStorage.load('broken', { selectedId: null })).toEqual({
            selectedId: null,
        });
    });

    it('builds initial state through the slice descriptor', () => {
        localStorage.setItem('page', JSON.stringify({ selectedId: 'item-1' }));

        const state = persistentStateStorage.getInitialState({
            key: 'page',
            fallbackState: { selectedId: null as string | null },
            getInitialState: persistedState => ({
                ...persistedState,
                isModalOpen: false,
            }),
            pickPersistedState: state => ({ selectedId: state.selectedId }),
        });

        expect(state).toEqual({ selectedId: 'item-1', isModalOpen: false });
    });

    it('clears selected persisted keys without touching unrelated storage', () => {
        localStorage.setItem('datasetsPage_v1', JSON.stringify({ selectedId: 'ds-1' }));
        localStorage.setItem('panelLayout_v2', JSON.stringify({ sizes: {} }));

        persistentStateStorage.clear(['datasetsPage_v1']);

        expect(localStorage.getItem('datasetsPage_v1')).toBeNull();
        expect(localStorage.getItem('panelLayout_v2')).toBe(
            JSON.stringify({ sizes: {} })
        );
    });

    it('stores selected state only when persisted fields change', () => {
        let state = { page: { selectedId: 'item-1', transient: false } };
        const listeners: Array<() => void> = [];
        const store = {
            getState: () => state,
            subscribe: (listener: () => void) => {
                listeners.push(listener);

                return () => undefined;
            },
        };

        persistentStateStorage.subscribeSlices(store, [
            {
                key: 'page',
                selectPersistedState: rootState => ({
                    selectedId: rootState.page.selectedId,
                }),
            },
        ]);

        state = { page: { selectedId: 'item-1', transient: true } };
        listeners.forEach(listener => listener());

        expect(localStorage.getItem('page')).toBeNull();

        state = { page: { selectedId: 'item-2', transient: true } };
        listeners.forEach(listener => listener());

        expect(localStorage.getItem('page')).toBe(
            JSON.stringify({ selectedId: 'item-2' })
        );
    });
});
