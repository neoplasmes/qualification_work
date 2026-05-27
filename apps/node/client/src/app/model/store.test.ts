import { beforeEach, describe, expect, it } from 'vitest';

import { panelLayoutPersistence } from '@/widgets/WorkspaceGrid';

import { createStore } from './store';

describe('createStore', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('keeps persisted panel layout over server preloaded fallback', () => {
        localStorage.setItem(
            panelLayoutPersistence.key,
            JSON.stringify({
                sizes: { workspace: [360, 900, 420] },
                isLeftCollapsed: true,
                isRightCollapsed: false,
            })
        );

        const store = createStore({
            panelLayout: {
                sizes: {},
                isLeftCollapsed: false,
                isRightCollapsed: false,
            },
        });

        expect(store.getState().panelLayout).toEqual({
            sizes: { workspace: [360, 900, 420] },
            isLeftCollapsed: true,
            isRightCollapsed: false,
        });
    });
});
